import type { InvitationStatus, UserRole } from "@prisma/client";
import type { z } from "zod";

import type { PaginationMeta } from "../../utils/pagination";
import type {
  SafeOrganization,
  SafeUser,
} from "../../utils/sanitizeUser";
import type {
  acceptInvitationSchema,
  createInvitationSchema,
  invitationListQuerySchema,
} from "./invitation.validation";

export type InvitationListQuery = z.infer<typeof invitationListQuerySchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

export interface InvitationUserSummary {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface SafeInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  invitedById: string | null;
  acceptedById: string | null;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  organization: SafeOrganization;
  invitedBy: InvitationUserSummary | null;
  acceptedBy: InvitationUserSummary | null;
}

export interface InvitationListResult {
  items: SafeInvitation[];
  meta: PaginationMeta;
}

export interface CreateInvitationResult {
  invitation: SafeInvitation;
  inviteUrl: string;
}

export interface InvitationPreview {
  email: string;
  role: UserRole;
  expiresAt: Date;
  organization: SafeOrganization;
}

export interface AcceptInvitationResult {
  accessToken: string;
  user: SafeUser;
  organization: SafeOrganization;
}
