import { portalApiClient } from '../../lib/portalApiClient'
import type {
  PortalCaseDetail,
  PortalCaseListParams,
  PortalCaseListResponse,
  PortalCaseSummaryResponse,
} from './portalCases.types'

interface PortalCaseResponse {
  case: PortalCaseDetail
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

const buildCaseListQuery = (params: PortalCaseListParams): string => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  setOptionalParam(query, 'search', params.search)
  setOptionalParam(query, 'status', params.status)

  return query.toString()
}

export const listPortalCases = (
  params: PortalCaseListParams,
): Promise<PortalCaseListResponse> =>
  portalApiClient.get<PortalCaseListResponse>(
    `/portal/cases?${buildCaseListQuery(params)}`,
  )

export const getPortalCaseSummary =
  (): Promise<PortalCaseSummaryResponse> =>
    portalApiClient.get<PortalCaseSummaryResponse>(
      '/portal/cases/summary',
    )

export const getPortalCase = async (
  id: string,
): Promise<PortalCaseDetail> => {
  const response = await portalApiClient.get<PortalCaseResponse>(
    `/portal/cases/${id}`,
  )
  return response.case
}
