import type { z } from "zod";

import type {
  SafeOrganization,
  SafeUser,
} from "../../utils/sanitizeUser";
import type {
  updateWorkspaceSchema,
  workspaceSignupSchema,
} from "./workspace.validation";

export type WorkspaceSignupInput = z.infer<typeof workspaceSignupSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

export interface CurrentWorkspace {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceSignupResult {
  accessToken: string;
  user: SafeUser;
  organization: SafeOrganization;
}
