export const documentTypes = [
  'IDENTITY_DOCUMENT',
  'REAL_ESTATE_DOCUMENT',
  'CONTRACT',
  'LEGAL_DOCUMENT',
  'CONSTRUCTION_DOCUMENT',
  'OTHER',
] as const

export type DocumentType = (typeof documentTypes)[number]

export const documentSources = ['INTERNAL', 'CUSTOMER_PORTAL'] as const

export type DocumentSource = (typeof documentSources)[number]

export const documentVisibilities = [
  'INTERNAL_ONLY',
  'CUSTOMER_VISIBLE',
] as const

export type DocumentVisibility = (typeof documentVisibilities)[number]

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CustomerOption {
  id: string
  fullName: string
  phone: string
  email: string | null
}

export interface CaseOption {
  id: string
  caseCode: string
  title: string
  status: string
  assignedToId?: string | null
  customerId?: string
  customer?: CustomerOption
}

export interface UserOption {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: UserRole
  avatarUrl: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface DocumentRecord {
  id: string
  caseProfileId: string | null
  customerId: string | null
  uploadedById: string | null
  uploadedByPortalAccountId: string | null
  portalVisibilityUpdatedById: string | null
  fileName: string
  fileUrl: string
  fileType: DocumentType
  source: DocumentSource
  visibility: DocumentVisibility
  mimeType: string | null
  size: number | null
  portalVisibilityUpdatedAt: string | null
  createdAt: string
  updatedAt?: string
  caseProfile: CaseOption | null
  customer: CustomerOption | null
  uploadedBy: UserOption | null
  uploadedByPortalAccount: {
    id: string
    email: string
    customer: CustomerOption
  } | null
  portalVisibilityUpdatedBy: UserOption | null
}

export type DocumentDetail = DocumentRecord

export interface DocumentListResponse {
  items: DocumentRecord[]
  meta: PaginationMeta
}

export interface DocumentListParams {
  page: number
  limit: number
  search?: string
  fileType?: DocumentType
  customerId?: string
  caseProfileId?: string
  uploadedById?: string
}

export interface DocumentUploadFormValues {
  file: FileList
  customerId: string
  caseProfileId: string
  fileType: DocumentType
}

export interface DocumentUploadInput {
  file: File
  customerId?: string
  caseProfileId?: string
  fileType: DocumentType
}

export interface DocumentPortalVisibilityInput {
  visibility: DocumentVisibility
}

export interface CustomerOptionListResponse {
  items: CustomerOption[]
  meta: PaginationMeta
}

export interface CaseOptionListResponse {
  items: CaseOption[]
  meta: PaginationMeta
}

export interface UserOptionListResponse {
  users: UserOption[]
}
