import { Prisma, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

import { env } from "../../config/env";
import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { signAccessToken } from "../../utils/jwt";
import { isPrismaError } from "../../utils/prismaError";
import {
  safeOrganizationSelect,
  sanitizeUser,
} from "../../utils/sanitizeUser";
import type {
  CurrentWorkspace,
  UpdateWorkspaceInput,
  WorkspaceSignupInput,
  WorkspaceSignupResult,
} from "./workspace.types";

const MAX_SLUG_LENGTH = 50;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const workspaceProfileSelect = {
  id: true,
  name: true,
  slug: true,
  industry: true,
  website: true,
  phone: true,
  email: true,
  address: true,
  logoUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrganizationSelect;

const normalizeGeneratedSlug = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const trimSlugForSuffix = (slug: string, suffix = ""): string => {
  const maxBaseLength = MAX_SLUG_LENGTH - suffix.length;
  return slug.slice(0, maxBaseLength).replace(/-+$/g, "");
};

const getGeneratedSlugBase = (workspaceName: string): string => {
  const base = trimSlugForSuffix(normalizeGeneratedSlug(workspaceName));

  if (!base || !slugPattern.test(base)) {
    throw new AppError(
      "Workspace name could not produce a valid slug. Provide a workspace slug.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return base;
};

const assertSignupEnabled = (): void => {
  if (env.WORKSPACE_SIGNUP_ENABLED !== "true") {
    throw new AppError(
      "Workspace signup is currently disabled.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const getUniqueGeneratedSlug = async (
  tx: Prisma.TransactionClient,
  workspaceName: string,
): Promise<string> => {
  const base = getGeneratedSlugBase(workspaceName);

  for (let index = 1; index <= 100; index += 1) {
    const suffix = index === 1 ? "" : `-${index}`;
    const candidate = `${trimSlugForSuffix(base, suffix)}${suffix}`;

    if (!candidate || candidate.length > MAX_SLUG_LENGTH) {
      continue;
    }

    const existing = await tx.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new AppError(
    "Workspace slug is already in use.",
    HTTP_STATUS.CONFLICT,
  );
};

const getSignupSlug = async (
  tx: Prisma.TransactionClient,
  input: WorkspaceSignupInput,
): Promise<string> => {
  if (!input.workspaceSlug) {
    return getUniqueGeneratedSlug(tx, input.workspaceName);
  }

  const existing = await tx.organization.findUnique({
    where: { slug: input.workspaceSlug },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(
      "Workspace slug is already in use.",
      HTTP_STATUS.CONFLICT,
    );
  }

  return input.workspaceSlug;
};

const throwSignupWriteError = (error: unknown): never => {
  if (isPrismaError(error, "P2002")) {
    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.join(",")
      : String(error.meta?.target ?? "");

    if (target.includes("email")) {
      throw new AppError(
        "An account with this email already exists.",
        HTTP_STATUS.CONFLICT,
      );
    }

    if (target.includes("slug")) {
      throw new AppError(
        "Workspace slug is already in use.",
        HTTP_STATUS.CONFLICT,
      );
    }

    throw new AppError(
      "Workspace slug or owner email is already in use.",
      HTTP_STATUS.CONFLICT,
    );
  }

  throw error;
};

const throwWorkspaceUpdateError = (error: unknown): never => {
  if (isPrismaError(error, "P2002")) {
    throw new AppError(
      "Workspace slug is already in use.",
      HTTP_STATUS.CONFLICT,
    );
  }

  if (isPrismaError(error, "P2025")) {
    throw new AppError("Workspace not found.", HTTP_STATUS.NOT_FOUND);
  }

  throw error;
};

const getUpdateData = (
  input: UpdateWorkspaceInput,
): Prisma.OrganizationUpdateInput => {
  const data: Prisma.OrganizationUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.slug !== undefined) {
    data.slug = input.slug;
  }

  if (input.industry !== undefined) {
    data.industry = input.industry;
  }

  if (input.website !== undefined) {
    data.website = input.website;
  }

  if (input.phone !== undefined) {
    data.phone = input.phone;
  }

  if (input.email !== undefined) {
    data.email = input.email;
  }

  if (input.address !== undefined) {
    data.address = input.address;
  }

  if (input.logoUrl !== undefined) {
    data.logoUrl = input.logoUrl;
  }

  return data;
};

export const getCurrentWorkspace = async (
  organizationId: string,
): Promise<CurrentWorkspace> => {
  const workspace = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: workspaceProfileSelect,
  });

  if (!workspace) {
    throw new AppError("Workspace not found.", HTTP_STATUS.NOT_FOUND);
  }

  return workspace;
};

export const updateCurrentWorkspace = async (
  input: UpdateWorkspaceInput,
  actorId: string,
  organizationId: string,
): Promise<CurrentWorkspace> => {
  if (input.slug !== undefined) {
    const existing = await prisma.organization.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });

    if (existing && existing.id !== organizationId) {
      throw new AppError(
        "Workspace slug is already in use.",
        HTTP_STATUS.CONFLICT,
      );
    }
  }

  const data = getUpdateData(input);

  try {
    return await prisma.$transaction(async (tx) => {
      const workspace = await tx.organization.update({
        where: { id: organizationId },
        data,
        select: workspaceProfileSelect,
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          userId: actorId,
          action: "WORKSPACE_UPDATED",
          entityType: "Organization",
          entityId: workspace.id,
          description: "Workspace profile updated.",
        },
      });

      return workspace;
    });
  } catch (error) {
    return throwWorkspaceUpdateError(error);
  }
};

export const signupWorkspace = async (
  input: WorkspaceSignupInput,
): Promise<WorkspaceSignupResult> => {
  assertSignupEnabled();
  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingOwner = await tx.user.findUnique({
        where: { email: input.ownerEmail },
        select: { id: true },
      });

      if (existingOwner) {
        throw new AppError(
          "An account with this email already exists.",
          HTTP_STATUS.CONFLICT,
        );
      }

      const slug = await getSignupSlug(tx, input);
      const organization = await tx.organization.create({
        data: {
          name: input.workspaceName,
          slug,
          industry: input.industry,
          website: input.website,
          phone: input.phone,
          email: input.email,
          address: input.address,
          isActive: true,
        },
        select: safeOrganizationSelect,
      });
      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          fullName: input.ownerFullName,
          email: input.ownerEmail,
          phone: input.ownerPhone,
          passwordHash,
          role: UserRole.ADMIN,
          isActive: true,
        },
        include: {
          organization: {
            select: safeOrganizationSelect,
          },
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          action: "WORKSPACE_CREATED",
          entityType: "Organization",
          entityId: organization.id,
          description: "Workspace created through public signup.",
        },
      });

      return { organization, user };
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
    return throwSignupWriteError(error);
  }
};
