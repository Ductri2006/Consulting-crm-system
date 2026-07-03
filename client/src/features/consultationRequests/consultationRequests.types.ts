export const consultationRequestStatuses = [
  'NEW',
  'CONTACTED',
  'CONVERTED',
  'CLOSED',
] as const

export type ConsultationRequestStatus =
  (typeof consultationRequestStatuses)[number]

export const editableConsultationRequestStatuses = [
  'NEW',
  'CONTACTED',
  'CLOSED',
] as const

export type EditableConsultationRequestStatus =
  (typeof editableConsultationRequestStatuses)[number]

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ConsultationServiceSummary {
  id: string
  name: string
  slug: string
  isActive: boolean
}

export interface ConsultationRequest {
  id: string
  fullName: string
  phone: string
  email: string | null
  serviceId?: string | null
  message: string | null
  status: ConsultationRequestStatus
  convertedCustomerId?: string | null
  convertedCaseProfileId?: string | null
  convertedAt?: string | null
  createdAt: string
  updatedAt?: string
  service?: ConsultationServiceSummary | null
}

export interface ConsultationRequestListResponse {
  items: ConsultationRequest[]
  meta: PaginationMeta
}

export interface ConsultationRequestResponse {
  request: ConsultationRequest
}

export interface ConsultationRequestListParams {
  page: number
  limit: number
  search?: string
  status?: ConsultationRequestStatus
}

export interface UpdateConsultationRequestStatusInput {
  status: EditableConsultationRequestStatus
}
