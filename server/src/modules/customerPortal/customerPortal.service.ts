import { randomBytes } from "node:crypto";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { signCustomerPortalAccessToken } from "../../utils/jwt";
import { isPrismaError } from "../../utils/prismaError";
import {
  type CreatePortalAccountInput,
  type PortalAccountMutationResult,
  type PortalLoginInput,
  type PortalLoginResult,
  type PortalProfileResult,
  type PortalSession,
  type ResetPortalPasswordInput,
  type SafeCustomerPortalAccount,
  type SafePortalCustomer,
  type SafePortalOrganization,
} from "./customerPortal.types";

const INVALID_PORTAL_LOGIN_MESSAGE = "Invalid workspace, email, or password.";
const CASE_TRACKING_PLACEHOLDER =
  "Case tracking will be available in a future step.";

export const safePortalAccountSelect = {
  id: true,
  organizationId: true,
  customerId: true,
  email: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerPortalAccountSelect;

export const safePortalCustomerSelect = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
  address: true,
} satisfies Prisma.CustomerSelect;

export const safePortalOrganizationSelect = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.OrganizationSelect;

const portalSessionAccountSelect = {
  ...safePortalAccountSelect,
  passwordHash: true,
  customer: {
    select: {
      ...safePortalCustomerSelect,
      organizationId: true,
    },
  },
  organization: {
    select: {
      ...safePortalOrganizationSelect,
      isActive: true,
    },
  },
} satisfies Prisma.CustomerPortalAccountSelect;

type PortalSessionAccount = Prisma.CustomerPortalAccountGetPayload<{
  select: typeof portalSessionAccountSelect;
}>;

const generateTemporaryPassword = (): string =>
  `Portal-${randomBytes(12).toString("base64url")}-9aA!`;

const toSafePortalAccount = (
  account: SafeCustomerPortalAccount,
): SafeCustomerPortalAccount => ({
  id: account.id,
  organizationId: account.organizationId,
  customerId: account.customerId,
  email: account.email,
  isActive: account.isActive,
  lastLoginAt: account.lastLoginAt,
  createdAt: account.createdAt,
  updatedAt: account.updatedAt,
});

const toSafePortalCustomer = (
  customer: SafePortalCustomer,
): SafePortalCustomer => ({
  id: customer.id,
  fullName: customer.fullName,
  phone: customer.phone,
  email: customer.email,
  address: customer.address,
});

const toSafePortalOrganization = (
  organization: SafePortalOrganization,
): SafePortalOrganization => ({
  id: organization.id,
  name: organization.name,
  slug: organization.slug,
});

export const toPortalSession = (
  account: PortalSessionAccount,
): PortalSession => ({
  portalAccount: toSafePortalAccount(account),
  customer: toSafePortalCustomer(account.customer),
  organization: toSafePortalOrganization(account.organization),
});

export const toPortalProfile = (
  session: PortalSession,
): PortalProfileResult => ({
  ...session,
  overview: {
    message: CASE_TRACKING_PLACEHOLDER,
    caseTrackingAvailable: false,
    documentUploadAvailable: false,
    messagingAvailable: false,
  },
});

const throwPortalAccountWriteError = (error: unknown): never => {
  if (isPrismaError(error, "P2002")) {
    throw new AppError(
      "Customer portal account already exists for this customer or email.",
      HTTP_STATUS.CONFLICT,
    );
  }

  if (isPrismaError(error, "P2025")) {
    throw new AppError(
      "Customer portal account not found.",
      HTTP_STATUS.NOT_FOUND,
    );
  }

  throw error;
};

const assertCustomerExists = async (
  customerId: string,
  organizationId: string,
  tx: Prisma.TransactionClient = prisma,
) => {
  const customer = await tx.customer.findFirst({
    where: {
      id: customerId,
      organizationId,
    },
    select: {
      ...safePortalCustomerSelect,
      organizationId: true,
      portalAccount: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!customer) {
    throw new AppError("Customer not found.", HTTP_STATUS.NOT_FOUND);
  }

  return customer;
};

const getPortalAccountForCustomer = async (
  customerId: string,
  organizationId: string,
  tx: Prisma.TransactionClient = prisma,
): Promise<SafeCustomerPortalAccount | null> =>
  tx.customerPortalAccount.findFirst({
    where: {
      customerId,
      organizationId,
    },
    select: safePortalAccountSelect,
  });

const assertPortalAccountForCustomer = async (
  customerId: string,
  organizationId: string,
  tx: Prisma.TransactionClient = prisma,
): Promise<SafeCustomerPortalAccount> => {
  const account = await getPortalAccountForCustomer(
    customerId,
    organizationId,
    tx,
  );

  if (!account) {
    throw new AppError(
      "Customer portal account not found.",
      HTTP_STATUS.NOT_FOUND,
    );
  }

  return account;
};

export const getCustomerPortalAccount = async (
  customerId: string,
  organizationId: string,
): Promise<SafeCustomerPortalAccount | null> => {
  await assertCustomerExists(customerId, organizationId);

  return getPortalAccountForCustomer(customerId, organizationId);
};

export const createCustomerPortalAccount = async (
  customerId: string,
  input: CreatePortalAccountInput,
  actorId: string,
  organizationId: string,
): Promise<PortalAccountMutationResult> => {
  const rawPassword = input.password ?? generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(rawPassword, 12);
  const isGeneratedPassword = input.password === undefined;

  try {
    const account = await prisma.$transaction(async (tx) => {
      const customer = await assertCustomerExists(customerId, organizationId, tx);

      if (customer.portalAccount) {
        throw new AppError(
          "Customer portal account already exists.",
          HTTP_STATUS.CONFLICT,
        );
      }

      const email = (input.email ?? customer.email)?.trim().toLowerCase();

      if (!email) {
        throw new AppError(
          "Customer portal account requires an email address.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const existingEmail = await tx.customerPortalAccount.findFirst({
        where: {
          organizationId,
          email,
        },
        select: {
          id: true,
        },
      });

      if (existingEmail) {
        throw new AppError(
          "A customer portal account with this email already exists in this workspace.",
          HTTP_STATUS.CONFLICT,
        );
      }

      const created = await tx.customerPortalAccount.create({
        data: {
          organizationId,
          customerId: customer.id,
          email,
          passwordHash,
          isActive: true,
        },
        select: safePortalAccountSelect,
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          userId: actorId,
          action: "CUSTOMER_PORTAL_ACCOUNT_CREATED",
          entityType: "CustomerPortalAccount",
          entityId: created.id,
          description: "Customer portal account created.",
        },
      });

      return created;
    });

    return {
      account: toSafePortalAccount(account),
      temporaryPassword: isGeneratedPassword ? rawPassword : undefined,
    };
  } catch (error) {
    return throwPortalAccountWriteError(error);
  }
};

export const resetCustomerPortalPassword = async (
  customerId: string,
  input: ResetPortalPasswordInput,
  actorId: string,
  organizationId: string,
): Promise<PortalAccountMutationResult> => {
  const rawPassword = input.password ?? generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(rawPassword, 12);
  const isGeneratedPassword = input.password === undefined;

  try {
    const account = await prisma.$transaction(async (tx) => {
      const existing = await assertPortalAccountForCustomer(
        customerId,
        organizationId,
        tx,
      );
      const updated = await tx.customerPortalAccount.update({
        where: {
          id: existing.id,
        },
        data: {
          passwordHash,
        },
        select: safePortalAccountSelect,
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          userId: actorId,
          action: "CUSTOMER_PORTAL_PASSWORD_RESET",
          entityType: "CustomerPortalAccount",
          entityId: updated.id,
          description: "Customer portal account password reset.",
        },
      });

      return updated;
    });

    return {
      account: toSafePortalAccount(account),
      temporaryPassword: isGeneratedPassword ? rawPassword : undefined,
    };
  } catch (error) {
    return throwPortalAccountWriteError(error);
  }
};

const setCustomerPortalAccountActive = async (
  customerId: string,
  organizationId: string,
  actorId: string,
  isActive: boolean,
): Promise<SafeCustomerPortalAccount> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await assertPortalAccountForCustomer(
        customerId,
        organizationId,
        tx,
      );
      const updated = await tx.customerPortalAccount.update({
        where: {
          id: existing.id,
        },
        data: {
          isActive,
        },
        select: safePortalAccountSelect,
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          userId: actorId,
          action: isActive
            ? "CUSTOMER_PORTAL_ACCOUNT_ACTIVATED"
            : "CUSTOMER_PORTAL_ACCOUNT_DEACTIVATED",
          entityType: "CustomerPortalAccount",
          entityId: updated.id,
          description: isActive
            ? "Customer portal account activated."
            : "Customer portal account deactivated.",
        },
      });

      return toSafePortalAccount(updated);
    });
  } catch (error) {
    return throwPortalAccountWriteError(error);
  }
};

export const deactivateCustomerPortalAccount = async (
  customerId: string,
  actorId: string,
  organizationId: string,
): Promise<SafeCustomerPortalAccount> =>
  setCustomerPortalAccountActive(customerId, organizationId, actorId, false);

export const activateCustomerPortalAccount = async (
  customerId: string,
  actorId: string,
  organizationId: string,
): Promise<SafeCustomerPortalAccount> =>
  setCustomerPortalAccountActive(customerId, organizationId, actorId, true);

const getActivePortalSessionAccount = async (
  portalAccountId: string,
): Promise<PortalSessionAccount | null> =>
  prisma.customerPortalAccount.findUnique({
    where: {
      id: portalAccountId,
    },
    select: portalSessionAccountSelect,
  });

export const getPortalSessionByAccountId = async (
  portalAccountId: string,
): Promise<PortalSession> => {
  const account = await getActivePortalSessionAccount(portalAccountId);

  if (
    !account ||
    !account.isActive ||
    !account.organization.isActive ||
    account.customer.organizationId !== account.organizationId
  ) {
    throw new AppError(
      "Invalid or expired access token.",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  return toPortalSession(account);
};

const throwInvalidPortalLogin = (): never => {
  throw new AppError(
    INVALID_PORTAL_LOGIN_MESSAGE,
    HTTP_STATUS.UNAUTHORIZED,
  );
};

export const loginCustomerPortal = async (
  input: PortalLoginInput,
): Promise<PortalLoginResult> => {
  const organization = await prisma.organization.findUnique({
    where: {
      slug: input.workspaceSlug,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!organization?.isActive) {
    return throwInvalidPortalLogin();
  }

  const account = await prisma.customerPortalAccount.findFirst({
    where: {
      organizationId: organization.id,
      email: input.email,
    },
    select: portalSessionAccountSelect,
  });

  if (
    !account?.isActive ||
    !account.organization.isActive ||
    account.customer.organizationId !== account.organizationId
  ) {
    return throwInvalidPortalLogin();
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    account.passwordHash,
  );

  if (!isPasswordValid) {
    return throwInvalidPortalLogin();
  }

  const updated = await prisma.customerPortalAccount.update({
    where: {
      id: account.id,
    },
    data: {
      lastLoginAt: new Date(),
    },
    select: portalSessionAccountSelect,
  });
  const session = toPortalSession(updated);
  const accessToken = signCustomerPortalAccessToken({
    sub: updated.id,
    portalAccountId: updated.id,
    organizationId: updated.organizationId,
    customerId: updated.customerId,
    email: updated.email,
    purpose: "customer_portal",
  });

  return {
    accessToken,
    ...session,
  };
};
