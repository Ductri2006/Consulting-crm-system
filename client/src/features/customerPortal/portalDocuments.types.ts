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
  mimeType: string | null
  size: number | null
  source: PortalDocumentSource
  visibility: PortalDocumentVisibility
  caseProfile: PortalDocumentCaseSummary | null
  createdAt: string
  uploadedByLabel: string
  downloadAvailable: boolean
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
