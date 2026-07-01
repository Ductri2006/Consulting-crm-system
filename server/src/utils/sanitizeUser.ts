import type { User } from "@prisma/client";

export type SafeUser = Pick<
  User,
  | "id"
  | "fullName"
  | "email"
  | "phone"
  | "role"
  | "avatarUrl"
  | "isActive"
  | "createdAt"
  | "updatedAt"
>;

export const sanitizeUser = (user: User): SafeUser => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatarUrl: user.avatarUrl,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
