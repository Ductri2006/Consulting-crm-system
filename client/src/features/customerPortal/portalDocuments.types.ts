import type {
  PortalCaseStatus,
  PortalDocumentType,
  PortalPaginationMeta,
} from './portalCases.types'

export const portalDocumentSources = [
  'INTERNAL',
  'CUSTOMER_PORTAL',
] as const

export type PortalDocumentSource = (typeof portalDocumentSources)[number]

export const portalDocumentVisibilities = [
  'INTERNAL_ONLY',
  'CUSTOMER_VISIBLE',
] as const

export type PortalDocumentVisibility =
  (typeof portalDocumentVisibilities)[number]

export const portalDocumentScanStatuses = [
  'PENDING',
  'CLEAN',
  'INFECTED',
  'FAILED',
  'SKIPPED',
] as const

export type PortalDocumentScanStatus =
  (typeof portalDocumentScanStatuses)[number]

export type PortalDocumentDownloadUnavailableReason =
  | 'SCAN_PENDING'
  | 'SCAN_FAILED'
  | 'SCAN_INFECTED'
  | 'FILE_UNAVAILABLE'
  | 'STORAGE_UNAVAILABLE'
  | 'DOWNLOAD_BLOCKED'

export interface PortalDocumentCaseSummary {
  id: string
  caseCode: string
  title: string
  status: PortalCaseStatus
}

export interface PortalDocumentRecord {
  id: string
  fileName: string
  fileType: PortalDocumentType
  size: number | null
  source: PortalDocumentSource
  visibility: PortalDocumentVisibility
  scanStatus: PortalDocumentScanStatus
  caseProfile: PortalDocumentCaseSummary | null
  createdAt: string
  uploadedByLabel: string
  downloadAvailable: boolean
  downloadUnavailableReason: PortalDocumentDownloadUnavailableReason | null
}

export interface PortalDocumentListResponse {
  items: PortalDocumentRecord[]
  meta: PortalPaginationMeta
}

export interface PortalDocumentListParams {
  page: number
  limit: number
  search?: string
  caseId?: string
  fileType?: PortalDocumentType
  source?: PortalDocumentSource
}

export interface PortalDocumentUploadFormValues {
  file: FileList
  caseProfileId: string
  fileType: PortalDocumentType
}

export interface PortalDocumentUploadInput {
  file: File
  caseProfileId?: string
  fileType: PortalDocumentType
}
