import type {
  AppointmentMethod,
  AppointmentStatus,
  CaseStatus,
  Customer,
  CustomerPortalAccount,
  DocumentScanStatus,
  DocumentSource,
  DocumentType,
  DocumentVisibility,
  Organization,
  Priority,
  TaskStatus,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import type {
  createPortalAccountSchema,
  portalCaseIdParamsSchema,
  portalCaseListQuerySchema,
  portalDocumentIdParamsSchema,
  portalDocumentListQuerySchema,
  portalDocumentUploadSchema,
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
export type PortalCaseListQuery = z.infer<typeof portalCaseListQuerySchema>;
export type PortalCaseIdParams = z.infer<typeof portalCaseIdParamsSchema>;
export type PortalDocumentIdParams = z.infer<
  typeof portalDocumentIdParamsSchema
>;
export type PortalDocumentListQuery = z.infer<
  typeof portalDocumentListQuerySchema
>;
export type PortalDocumentUploadInput = z.infer<
  typeof portalDocumentUploadSchema
>;

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

export interface SafePortalStaff {
  id: string;
  fullName: string;
  role: UserRole;
}

export interface SafePortalService {
  id: string;
  name: string;
  slug: string;
}

export interface PortalCaseRelatedCounts {
  histories: number;
  appointments: number;
  documents: number;
  tasks: number;
}

export interface PortalCaseTimelineItem {
  id: string;
  action: string;
  description: string | null;
  oldStatus: CaseStatus | null;
  newStatus: CaseStatus | null;
  createdAt: Date;
  user: SafePortalStaff | null;
}

export interface PortalCaseSummary {
  id: string;
  caseCode: string;
  title: string;
  status: CaseStatus;
  priority: Priority;
  service: SafePortalService;
  assignedStaff: SafePortalStaff | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  latestActivity: PortalCaseTimelineItem | null;
  upcomingAppointmentCount: number;
  documentCount: number;
  taskCount: number;
}

export interface PortalCaseListResult {
  items: PortalCaseSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SafePortalAppointment {
  id: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string | null;
  method: AppointmentMethod;
  status: AppointmentStatus;
  staff: SafePortalStaff | null;
}

export interface SafePortalDocumentMetadata {
  id: string;
  fileName: string;
  fileType: DocumentType;
  size: number | null;
  source: DocumentSource;
  visibility: DocumentVisibility;
  scanStatus: DocumentScanStatus;
  caseProfile: {
    id: string;
    caseCode: string;
    title: string;
    status: CaseStatus;
  } | null;
  createdAt: Date;
  uploadedByLabel: string;
  downloadAvailable: boolean;
  downloadUnavailableReason: string | null;
}

export interface SafePortalTaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  deadline: Date | null;
  updatedAt: Date;
}

export interface PortalCaseDetail extends PortalCaseSummary {
  description: string | null;
  customer: SafePortalCustomer;
  deadline: Date | null;
  counts: PortalCaseRelatedCounts;
  timeline: PortalCaseTimelineItem[];
  appointments: SafePortalAppointment[];
  documents: SafePortalDocumentMetadata[];
  tasks: SafePortalTaskSummary[];
}

export interface PortalCaseStatusCount {
  status: CaseStatus;
  count: number;
}

export interface PortalCaseSummaryResult {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  cancelledCases: number;
  upcomingAppointments: number;
  nextAppointment: SafePortalAppointment | null;
  casesByStatus: PortalCaseStatusCount[];
  recentCases: PortalCaseSummary[];
}

export interface PortalDocumentListResult {
  items: SafePortalDocumentMetadata[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PortalDocumentDownload {
  fileName: string;
  contentType: string | null;
  contentLength: number | null;
  stream: NodeJS.ReadableStream;
  finalizeSuccess: () => Promise<void>;
}

export type PortalUpdateType =
  | "CASE"
  | "APPOINTMENT"
  | "DOCUMENT"
  | "ACCOUNT";

export interface PortalUpdateCaseSummary {
  id: string;
  caseCode: string;
  title: string;
}

export interface PortalUpdateItem {
  id: string;
  type: PortalUpdateType;
  title: string;
  description: string;
  occurredAt: Date;
  entityType: string;
  entityId: string;
  caseProfile: PortalUpdateCaseSummary | null;
  action?: string;
}

export interface PortalUpdatesQuery {
  page: number;
  limit: number;
  type?: PortalUpdateType;
  caseId?: string;
}

export interface PortalUpdatesResult {
  items: PortalUpdateItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PortalUpdatesSummaryResult {
  totalUpdates: number;
  latestUpdateAt: Date | null;
  recentUpdates: PortalUpdateItem[];
}

export interface PortalDocumentUploadFile {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}
