import type { z } from "zod";

import type {
  SafeOrganization,
  SafeUser,
} from "../../utils/sanitizeUser";
import type { workspaceSignupSchema } from "./workspace.validation";

export type WorkspaceSignupInput = z.infer<typeof workspaceSignupSchema>;

export interface WorkspaceSignupResult {
  accessToken: string;
  user: SafeUser;
  organization: SafeOrganization;
}
