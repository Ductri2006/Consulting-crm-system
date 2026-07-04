import type { User } from "@prisma/client";
import { z } from "zod";

import type { PaginationMeta } from "../../utils/pagination";
import type { SafeUser } from "../../utils/sanitizeUser";
import {
  createUserSchema,
  resetUserPasswordSchema,
  updateUserSchema,
  userListQuerySchema,
} from "./user.validation";

export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetUserPasswordInput = z.infer<
  typeof resetUserPasswordSchema
>;

export type InternalUser = SafeUser;

export interface UserListResult {
  items: InternalUser[];
  meta: PaginationMeta;
}

export type UserCreateData = Pick<
  User,
  | "fullName"
  | "email"
  | "phone"
  | "role"
  | "passwordHash"
  | "avatarUrl"
  | "isActive"
>;
