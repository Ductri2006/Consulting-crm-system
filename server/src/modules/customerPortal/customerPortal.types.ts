import type { Customer, CustomerPortalAccount, Organization } from "@prisma/client";
import { z } from "zod";

import type {
  createPortalAccountSchema,
  portalLoginSchema,
  resetPortalPasswordSchema,
} from "./customerPortal.validation";

export type CreatePortalAccountInput = z.infer<
  typeof createPortalAccountSchema
>;
export type ResetPortalPasswordInput = z.infer<
  typeof resetPortalPasswordSchema
>;
export type PortalLoginInput = z.infer<typeof portalLoginSchema>;

export type SafeCustomerPortalAccount = Pick<
  CustomerPortalAccount,
  | "id"
  | "organizationId"
  | "customerId"
  | "email"
  | "isActive"
  | "lastLoginAt"
  | "createdAt"
  | "updatedAt"
>;

export type SafePortalCustomer = Pick<
  Customer,
  "id" | "fullName" | "phone" | "email" | "address"
>;

export type SafePortalOrganization = Pick<Organization, "id" | "name" | "slug">;

export interface PortalSession {
  portalAccount: SafeCustomerPortalAccount;
  customer: SafePortalCustomer;
  organization: SafePortalOrganization;
}

export interface PortalLoginResult extends PortalSession {
  accessToken: string;
}

export interface PortalProfileResult extends PortalSession {
  overview: {
    message: string;
    caseTrackingAvailable: boolean;
    documentUploadAvailable: boolean;
    messagingAvailable: boolean;
  };
}

export interface PortalAccountMutationResult {
  account: SafeCustomerPortalAccount;
  temporaryPassword?: string;
}
