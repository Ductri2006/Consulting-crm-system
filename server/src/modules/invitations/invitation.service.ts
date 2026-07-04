import { createHash, randomBytes } from "node:crypto";

import { InvitationStatus, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { env } from "../../config/env";
import { HTTP_STATUS } from "../../constants/httpStatus";
import {
  createInvitationEmailTemplate,
  sendEmail as sendOutboundEmail,
  skippedEmailDelivery,
  type EmailDeliveryResult,
} from "../../lib/email";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { signAccessToken } from "../../utils/jwt";
import {
  createPaginationMeta,
  getPagination,
} from "../../utils/pagination";
import { isPrismaError } from "../../utils/prismaError";
import {
  safeOrganizationSelect,
  sanitizeUser,
} from "../../utils/sanitizeUser";
import type {
  AcceptInvitationInput,
  AcceptInvitationResult,
  CreateInvitationInput,
  CreateInvitationResult,
  InvitationListQuery,
  InvitationListResult,
  InvitationPreview,
  ResendInvitationInput,
  ResendInvitationResult,
  SafeInvitation,
} from "./invitation.types";

const TOKEN_BYTES = 32;
const DAY_IN_MS = 24 * 60 * 60 * 1_000;
const INVALID_INVITATION_MESSAGE = "Invalid or expired invitation.";

const userSummarySelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

const safeInvitationSelect = {
  id: true,
  organizationId: true,
  email: true,
  role: true,
  status: true,
  invitedById: true,
  acceptedById: true,
  expiresAt: true,
  acceptedAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
  organization: {
    select: safeOrganizationSelect,
  },
  invitedBy: {
    select: userSummarySelect,
  },
  acceptedBy: {
    select: userSummarySelect,
  },
} satisfies Prisma.WorkspaceInvitationSelect;

const invitationLookupSelect = {
  id: true,
  organizationId: true,
  email: true,
  role: true,
  status: true,
  expiresAt: true,
  organization: {
    select: {
      ...safeOrganizationSelect,
      isActive: true,
    },
  },
} satisfies Prisma.WorkspaceInvitationSelect;

type SelectedInvitation = Prisma.WorkspaceInvitationGetPayload<{
  select: typeof safeInvitationSelect;
}>;

type InvitationLookup = Prisma.WorkspaceInvitationGetPayload<{
  select: typeof invitationLookupSelect;
}>;

const toSafeInvitation = (
  invitation: SelectedInvitation,
): SafeInvitation => invitation;

const toSafeOrganization = (
  organization: InvitationLookup["organization"],
) => ({
  id: organization.id,
  name: organization.name,
  slug: organization.slug,
});

const generateInvitationToken = (): string =>
  randomBytes(TOKEN_BYTES).toString("base64url");

const hashInvitationToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const buildInviteUrl = (token: string): string => {
  const clientOrigin = env.CLIENT_URL.split(",")[0]?.trim() ?? env.CLIENT_URL;
  return `${clientOrigin}/invite/${encodeURIComponent(token)}`;
};

const redactInviteUrl = (inviteUrl: string): string => {
  try {
    const url = new URL(inviteUrl);
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts[0] === "invite" && parts[1]) {
      url.pathname = "/invite/[redacted-token]";
      url.search = "";
      url.hash = "";
      return url.toString();
    }
  } catch {
    return inviteUrl.replace(/(\/invite\/)[^/?#]+/g, "$1[redacted-token]");
  }

  return inviteUrl.replace(/(\/invite\/)[^/?#]+/g, "$1[redacted-token]");
};

const throwInvalidInvitation = (): never => {
  throw new AppError(
    INVALID_INVITATION_MESSAGE,
    HTTP_STATUS.NOT_FOUND,
  );
};

const expirePendingInvitations = async (
  where: Prisma.WorkspaceInvitationWhereInput = {},
): Promise<void> => {
  const now = new Date();

  await prisma.workspaceInvitation.updateMany({
    where: {
      ...where,
      status: InvitationStatus.PENDING,
      expiresAt: {
        lte: now,
      },
    },
    data: {
      status: InvitationStatus.EXPIRED,
      updatedAt: now,
    },
  });
};

const assertInvitationIsPreviewable = async (
  invitation: InvitationLookup | null,
): Promise<InvitationLookup> => {
  if (!invitation || !invitation.organization.isActive) {
    return throwInvalidInvitation();
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    return throwInvalidInvitation();
  }

  if (invitation.expiresAt <= new Date()) {
    await expirePendingInvitations({ id: invitation.id });
    return throwInvalidInvitation();
  }

  return invitation;
};

const getInvitationByToken = async (
  token: string,
): Promise<InvitationLookup | null> =>
  prisma.workspaceInvitation.findUnique({
    where: {
      tokenHash: hashInvitationToken(token),
    },
    select: invitationLookupSelect,
  });

const getInvitationWhere = (
  query: InvitationListQuery,
  organizationId: string,
): Prisma.WorkspaceInvitationWhereInput => {
  const where: Prisma.WorkspaceInvitationWhereInput = {
    organizationId,
  };

  if (query.role) {
    where.role = query.role;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: "insensitive" } },
      {
        invitedBy: {
          is: {
            fullName: { contains: query.search, mode: "insensitive" },
          },
        },
      },
      {
        acceptedBy: {
          is: {
            fullName: { contains: query.search, mode: "insensitive" },
          },
        },
      },
    ];
  }

  return where;
};

const assertNoExistingUserForEmail = async (
  email: string,
): Promise<void> => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(
      "An account with this email already exists.",
      HTTP_STATUS.CONFLICT,
    );
  }
};

const throwInvitationWriteError = (error: unknown): never => {
  if (isPrismaError(error, "P2002")) {
    throw new AppError(
      "A pending invitation for this email already exists.",
      HTTP_STATUS.CONFLICT,
    );
  }

  if (isPrismaError(error, "P2025")) {
    throw new AppError("Invitation not found.", HTTP_STATUS.NOT_FOUND);
  }

  throw error;
};

const throwAcceptWriteError = (error: unknown): never => {
  if (isPrismaError(error, "P2002")) {
    throw new AppError(
      "An account with this email already exists.",
      HTTP_STATUS.CONFLICT,
    );
  }

  throw error;
};

const getEmailActivityAction = (
  emailDelivery: EmailDeliveryResult,
): string => {
  if (emailDelivery.status === "FAILED") {
    return "INVITATION_EMAIL_FAILED";
  }

  if (emailDelivery.status === "DISABLED") {
    return "INVITATION_EMAIL_SKIPPED";
  }

  return "INVITATION_EMAIL_SENT";
};

const getEmailActivityDescription = (
  emailDelivery: EmailDeliveryResult,
): string => {
  if (emailDelivery.status === "FAILED") {
    return `Invitation email delivery failed via ${emailDelivery.provider}.`;
  }

  if (emailDelivery.status === "DISABLED") {
    return `Invitation email delivery skipped for provider ${emailDelivery.provider}.`;
  }

  return `Invitation email delivery completed via ${emailDelivery.provider}.`;
};

const recordInvitationEmailActivity = async ({
  actorId,
  emailDelivery,
  invitationId,
  organizationId,
}: {
  actorId: string;
  emailDelivery: EmailDeliveryResult;
  invitationId: string;
  organizationId: string;
}): Promise<void> => {
  try {
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: actorId,
        action: getEmailActivityAction(emailDelivery),
        entityType: "WorkspaceInvitation",
        entityId: invitationId,
        description: getEmailActivityDescription(emailDelivery),
      },
    });
  } catch (error) {
    console.warn("Invitation email activity log could not be written.", {
      invitationId,
      organizationId,
      error: error instanceof Error ? error.message : "Unknown error.",
    });
  }
};

const deliverInvitationEmail = async ({
  invitation,
  inviteUrl,
  shouldSendEmail,
}: {
  invitation: SelectedInvitation;
  inviteUrl: string;
  shouldSendEmail: boolean;
}): Promise<EmailDeliveryResult> => {
  if (!shouldSendEmail) {
    return skippedEmailDelivery();
  }

  const template = createInvitationEmailTemplate({
    appName: env.APP_NAME,
    workspaceName: invitation.organization.name,
    invitedEmail: invitation.email,
    role: invitation.role,
    invitedBy: invitation.invitedBy
      ? {
          fullName: invitation.invitedBy.fullName,
          email: invitation.invitedBy.email,
        }
      : null,
    inviteUrl,
    expiresAt: invitation.expiresAt,
  });

  return sendOutboundEmail({
    to: invitation.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: env.EMAIL_REPLY_TO,
    auditLabel: `WorkspaceInvitation:${invitation.id}`,
    redactedPreviewUrl: redactInviteUrl(inviteUrl),
  });
};

export const findInvitations = async (
  query: InvitationListQuery,
  organizationId: string,
): Promise<InvitationListResult> => {
  await expirePendingInvitations({ organizationId });

  const { page, limit } = query;
  const { skip, take } = getPagination(page, limit);
  const where = getInvitationWhere(query, organizationId);

  const [items, total] = await prisma.$transaction([
    prisma.workspaceInvitation.findMany({
      where,
      skip,
      take,
      select: safeInvitationSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
    prisma.workspaceInvitation.count({ where }),
  ]);

  return {
    items: items.map(toSafeInvitation),
    meta: createPaginationMeta(page, limit, total),
  };
};

export const createInvitation = async (
  input: CreateInvitationInput,
  actorId: string,
  organizationId: string,
): Promise<CreateInvitationResult> => {
  await expirePendingInvitations({
    organizationId,
    email: input.email,
  });
  await assertNoExistingUserForEmail(input.email);

  const pendingInvitation = await prisma.workspaceInvitation.findFirst({
    where: {
      organizationId,
      email: input.email,
      status: InvitationStatus.PENDING,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
    },
  });

  if (pendingInvitation) {
    throw new AppError(
      "A pending invitation for this email already exists.",
      HTTP_STATUS.CONFLICT,
    );
  }

  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = new Date(Date.now() + input.expiresInDays * DAY_IN_MS);

  try {
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        organizationId,
        email: input.email,
        role: input.role,
        tokenHash,
        invitedById: actorId,
        expiresAt,
      },
      select: safeInvitationSelect,
    });

    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: actorId,
        action: "INVITATION_CREATED",
        entityType: "WorkspaceInvitation",
        entityId: invitation.id,
        description: "Workspace invitation created.",
      },
    });

    const inviteUrl = buildInviteUrl(token);
    const emailDelivery = await deliverInvitationEmail({
      invitation,
      inviteUrl,
      shouldSendEmail: input.sendEmail,
    });

    await recordInvitationEmailActivity({
      actorId,
      emailDelivery,
      invitationId: invitation.id,
      organizationId,
    });

    return {
      invitation: toSafeInvitation(invitation),
      inviteUrl,
      emailDelivery,
    };
  } catch (error) {
    return throwInvitationWriteError(error);
  }
};

export const resendInvitation = async (
  id: string,
  input: ResendInvitationInput,
  actorId: string,
  organizationId: string,
): Promise<ResendInvitationResult> => {
  await expirePendingInvitations({ organizationId });

  const existingInvitation = await prisma.workspaceInvitation.findFirst({
    where: {
      id,
      organizationId,
    },
    select: {
      email: true,
      status: true,
    },
  });

  if (!existingInvitation) {
    throw new AppError("Invitation not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (existingInvitation.status === InvitationStatus.ACCEPTED) {
    throw new AppError(
      "Accepted invitations cannot be resent.",
      HTTP_STATUS.CONFLICT,
    );
  }

  if (existingInvitation.status === InvitationStatus.REVOKED) {
    throw new AppError(
      "Revoked invitations cannot be resent.",
      HTTP_STATUS.CONFLICT,
    );
  }

  await assertNoExistingUserForEmail(existingInvitation.email);

  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = new Date(Date.now() + input.expiresInDays * DAY_IN_MS);

  try {
    const invitation = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.workspaceInvitation.updateMany({
        where: {
          id,
          organizationId,
          status: {
            in: [InvitationStatus.PENDING, InvitationStatus.EXPIRED],
          },
        },
        data: {
          tokenHash,
          status: InvitationStatus.PENDING,
          expiresAt,
          acceptedAt: null,
          acceptedById: null,
          revokedAt: null,
        },
      });

      if (updateResult.count !== 1) {
        throw new AppError(
          "Only pending or expired invitations can be resent.",
          HTTP_STATUS.CONFLICT,
        );
      }

      const updated = await tx.workspaceInvitation.findFirst({
        where: {
          id,
          organizationId,
        },
        select: safeInvitationSelect,
      });

      if (!updated) {
        throw new AppError("Invitation not found.", HTTP_STATUS.NOT_FOUND);
      }

      return updated;
    });

    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: actorId,
        action: "INVITATION_RESENT",
        entityType: "WorkspaceInvitation",
        entityId: invitation.id,
        description: "Workspace invitation link rotated for resend.",
      },
    });

    const inviteUrl = buildInviteUrl(token);
    const emailDelivery = await deliverInvitationEmail({
      invitation,
      inviteUrl,
      shouldSendEmail: true,
    });

    await recordInvitationEmailActivity({
      actorId,
      emailDelivery,
      invitationId: invitation.id,
      organizationId,
    });

    return {
      invitation: toSafeInvitation(invitation),
      inviteUrl,
      emailDelivery,
    };
  } catch (error) {
    return throwInvitationWriteError(error);
  }
};

export const revokeInvitation = async (
  id: string,
  actorId: string,
  organizationId: string,
): Promise<SafeInvitation> => {
  await expirePendingInvitations({ organizationId });

  const invitation = await prisma.workspaceInvitation.findFirst({
    where: {
      id,
      organizationId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!invitation) {
    throw new AppError("Invitation not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new AppError(
      "Only pending invitations can be revoked.",
      HTTP_STATUS.CONFLICT,
    );
  }

  try {
    const revoked = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.workspaceInvitation.updateMany({
        where: {
          id,
          organizationId,
          status: InvitationStatus.PENDING,
        },
        data: {
          status: InvitationStatus.REVOKED,
          revokedAt: new Date(),
        },
      });

      if (updateResult.count !== 1) {
        throw new AppError(
          "Only pending invitations can be revoked.",
          HTTP_STATUS.CONFLICT,
        );
      }

      const updated = await tx.workspaceInvitation.findFirst({
        where: {
          id,
          organizationId,
        },
        select: safeInvitationSelect,
      });

      if (!updated) {
        throw new AppError("Invitation not found.", HTTP_STATUS.NOT_FOUND);
      }

      return updated;
    });

    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: actorId,
        action: "INVITATION_REVOKED",
        entityType: "WorkspaceInvitation",
        entityId: revoked.id,
        description: "Workspace invitation revoked.",
      },
    });

    return toSafeInvitation(revoked);
  } catch (error) {
    return throwInvitationWriteError(error);
  }
};

export const previewInvitation = async (
  token: string,
): Promise<InvitationPreview> => {
  const invitation = await assertInvitationIsPreviewable(
    await getInvitationByToken(token),
  );

  return {
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    organization: toSafeOrganization(invitation.organization),
  };
};

export const acceptInvitation = async (
  token: string,
  input: AcceptInvitationInput,
): Promise<AcceptInvitationResult> => {
  const tokenHash = hashInvitationToken(token);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const invitation = await tx.workspaceInvitation.findUnique({
        where: {
          tokenHash,
        },
        select: invitationLookupSelect,
      });

      if (!invitation || !invitation.organization.isActive) {
        return throwInvalidInvitation();
      }

      if (
        invitation.status !== InvitationStatus.PENDING ||
        invitation.expiresAt <= now
      ) {
        if (
          invitation.status === InvitationStatus.PENDING &&
          invitation.expiresAt <= now
        ) {
          await tx.workspaceInvitation.update({
            where: {
              id: invitation.id,
            },
            data: {
              status: InvitationStatus.EXPIRED,
            },
          });
        }

        return throwInvalidInvitation();
      }

      const existingUser = await tx.user.findUnique({
        where: {
          email: invitation.email,
        },
        select: {
          id: true,
        },
      });

      if (existingUser) {
        throw new AppError(
          "An account with this email already exists.",
          HTTP_STATUS.CONFLICT,
        );
      }

      const claimResult = await tx.workspaceInvitation.updateMany({
        where: {
          id: invitation.id,
          status: InvitationStatus.PENDING,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: now,
        },
      });

      if (claimResult.count !== 1) {
        return throwInvalidInvitation();
      }

      const user = await tx.user.create({
        data: {
          organizationId: invitation.organizationId,
          fullName: input.fullName,
          email: invitation.email,
          phone: input.phone,
          passwordHash,
          role: invitation.role,
          isActive: true,
        },
        include: {
          organization: {
            select: safeOrganizationSelect,
          },
        },
      });

      await tx.workspaceInvitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          acceptedById: user.id,
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId: invitation.organizationId,
          userId: user.id,
          action: "INVITATION_ACCEPTED",
          entityType: "WorkspaceInvitation",
          entityId: invitation.id,
          description: "Workspace invitation accepted.",
        },
      });

      return {
        organization: toSafeOrganization(invitation.organization),
        user,
      };
    });

    const accessToken = signAccessToken({
      sub: result.user.id,
      userId: result.user.id,
      role: result.user.role,
      email: result.user.email,
      organizationId: result.user.organizationId,
    });

    return {
      accessToken,
      user: sanitizeUser(result.user),
      organization: result.organization,
    };
  } catch (error) {
    return throwAcceptWriteError(error);
  }
};

export { hashInvitationToken };
