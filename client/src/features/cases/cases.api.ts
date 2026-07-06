import { apiClient } from '../../lib/apiClient'
import type {
  CaseAssignInput,
  CaseAiSummary,
  CaseAiSummaryResponse,
  CaseDetail,
  CaseHistoryParams,
  CaseHistoryResponse,
  CaseListParams,
  CaseListResponse,
  CaseProfile,
  CaseRecord,
  CaseStatusUpdateInput,
  CreateCaseInput,
  CustomerOptionListResponse,
  OverdueCaseListParams,
  ServiceOptionListResponse,
  UpdateCaseInput,
  UserOptionListResponse,
} from './cases.types'

interface CaseResponse<TCase extends CaseRecord = CaseProfile> {
  case: TCase
}

const setOptionalParam = (
  query: URLSearchParams,
  key: string,
  value?: string,
): void => {
  const trimmed = value?.trim()

  if (trimmed) {
    query.set(key, trimmed)
  }
}

const buildCaseListQuery = (params: CaseListParams): string => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  setOptionalParam(query, 'search', params.search)
  setOptionalParam(query, 'status', params.status)
  setOptionalParam(query, 'priority', params.priority)
  setOptionalParam(query, 'serviceId', params.serviceId)
  setOptionalParam(query, 'customerId', params.customerId)
  setOptionalParam(query, 'assignedToId', params.assignedToId)

  return query.toString()
}

export const listCases = (
  params: CaseListParams,
): Promise<CaseListResponse> =>
  apiClient.get<CaseListResponse>(`/cases?${buildCaseListQuery(params)}`)

export const listOverdueCases = (
  params: OverdueCaseListParams,
): Promise<CaseListResponse> => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  setOptionalParam(query, 'assignedToId', params.assignedToId)

  return apiClient.get<CaseListResponse>(
    `/cases/overdue?${query.toString()}`,
  )
}

export const getCase = async (id: string): Promise<CaseDetail> => {
  const response = await apiClient.get<CaseResponse<CaseDetail>>(
    `/cases/${id}`,
  )
  return response.case
}

export const createCase = async (
  input: CreateCaseInput,
): Promise<CaseProfile> => {
  const response = await apiClient.post<
    CaseResponse,
    CreateCaseInput
  >('/cases', input)
  return response.case
}

export const updateCase = async (
  id: string,
  input: UpdateCaseInput,
): Promise<CaseProfile> => {
  const response = await apiClient.patch<
    CaseResponse,
    UpdateCaseInput
  >(`/cases/${id}`, input)
  return response.case
}

export const updateCaseStatus = async (
  id: string,
  input: CaseStatusUpdateInput,
): Promise<CaseProfile> => {
  const response = await apiClient.patch<
    CaseResponse,
    CaseStatusUpdateInput
  >(`/cases/${id}/status`, input)
  return response.case
}

export const assignCase = async (
  id: string,
  input: CaseAssignInput,
): Promise<CaseProfile> => {
  const response = await apiClient.patch<
    CaseResponse,
    CaseAssignInput
  >(`/cases/${id}/assign`, input)
  return response.case
}

export const getCaseHistory = (
  id: string,
  params: CaseHistoryParams,
): Promise<CaseHistoryResponse> => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  return apiClient.get<CaseHistoryResponse>(
    `/cases/${id}/history?${query.toString()}`,
  )
}

export const generateCaseAiSummary = async (
  id: string,
): Promise<CaseAiSummary> => {
  const response = await apiClient.post<CaseAiSummaryResponse>(
    `/cases/${id}/ai-summary`,
  )
  return response.summary
}

export const deleteCase = async (id: string): Promise<CaseRecord> => {
  const response = await apiClient.delete<CaseResponse<CaseRecord>>(
    `/cases/${id}`,
  )
  return response.case
}

export const listCaseCustomers = (
  search = '',
): Promise<CustomerOptionListResponse> => {
  const query = new URLSearchParams({ page: '1', limit: '100' })
  setOptionalParam(query, 'search', search)
  return apiClient.get<CustomerOptionListResponse>(
    `/customers?${query.toString()}`,
  )
}

export const listCaseServices = (): Promise<ServiceOptionListResponse> =>
  apiClient.get<ServiceOptionListResponse>('/services?page=1&limit=100')

export const listAssignableUsers = (): Promise<UserOptionListResponse> =>
  apiClient.get<UserOptionListResponse>('/users/assignable')
