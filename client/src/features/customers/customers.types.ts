export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface Customer {
  id: string
  fullName: string
  phone: string
  email: string | null
  address: string | null
  identityNumber: string | null
  birthday: string | null
  source: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface CustomerRelatedCounts {
  cases: number
  appointments: number
  documents: number
}

export interface CustomerDetail extends Customer {
  relatedCounts: CustomerRelatedCounts
}

export interface CustomerListResponse {
  items: Customer[]
  meta: PaginationMeta
}

export interface CustomerListParams {
  page: number
  limit: number
  search?: string
}

export interface CustomerMutationInput {
  fullName: string
  phone: string
  email?: string
  address?: string
  identityNumber?: string
  birthday?: string
  source?: string
  note?: string
}
