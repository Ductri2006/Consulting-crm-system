import type { z } from "zod";

import type { SafeUser } from "../../utils/sanitizeUser";
import type { loginSchema } from "./auth.validation";

export type LoginInput = z.infer<typeof loginSchema>;

export interface LoginResult {
  accessToken: string;
  user: SafeUser;
}
