import type { Organization, User } from "@prisma/client";

export type SafeUser = Pick<
  User,
  | "id"
  | "organizationId"
  | "fullName"
  | "email"
  | "phone"
  | "role"
  | "avatarUrl"
  | "isActive"
  | "createdAt"
  | "updatedAt"
> & {
  organization?: SafeOrganization | null;
};

export type SafeOrganization = Pick<
  Organization,
  "id" | "name" | "slug"
>;

export const safeOrganizationSelect = {
  id: true,
  name: true,
  slug: true,
} satisfies Record<keyof SafeOrganization, true>;

type SanitizableUser = User & {
  organization?: SafeOrganization | null;
};

export const sanitizeUser = (user: SanitizableUser): SafeUser => ({
  id: user.id,
  organizationId: user.organizationId,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatarUrl: user.avatarUrl,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  organization:
    user.organization === undefined
      ? undefined
      : user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
          }
        : null,
});
