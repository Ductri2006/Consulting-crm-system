import { apiClient } from '../../lib/apiClient'
import type {
  ConsultationRequest,
  ConsultationRequestListParams,
  ConsultationRequestListResponse,
  ConsultationRequestResponse,
  UpdateConsultationRequestStatusInput,
} from './consultationRequests.types'
import { updateConsultationRequestStatusSchema } from './consultationRequests.validation'

const buildListQuery = ({
  page,
  limit,
  search,
  status,
}: ConsultationRequestListParams): string => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (search?.trim()) {
    params.set('search', search.trim())
  }

  if (status) {
    params.set('status', status)
  }

  return params.toString()
}

export function getConsultationRequests(
  params: ConsultationRequestListParams,
): Promise<ConsultationRequestListResponse> {
  return apiClient.get<ConsultationRequestListResponse>(
    `/consultation-requests?${buildListQuery(params)}`,
  )
}

export async function getConsultationRequest(
  id: string,
): Promise<ConsultationRequest> {
  const response = await apiClient.get<ConsultationRequestResponse>(
    `/consultation-requests/${id}`,
  )

  return response.request
}

export async function updateConsultationRequestStatus(
  id: string,
  input: UpdateConsultationRequestStatusInput,
): Promise<ConsultationRequest> {
  const validatedInput = updateConsultationRequestStatusSchema.parse(input)
  const response = await apiClient.patch<
    ConsultationRequestResponse,
    UpdateConsultationRequestStatusInput
  >(`/consultation-requests/${id}/status`, validatedInput)

  return response.request
}
