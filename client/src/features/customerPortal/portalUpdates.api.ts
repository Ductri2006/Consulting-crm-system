import { portalApiClient } from '../../lib/portalApiClient'
import type {
  PortalUpdatesListParams,
  PortalUpdatesListResponse,
  PortalUpdatesSummaryResponse,
} from './portalUpdates.types'

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

const buildPortalUpdatesQuery = (
  params: PortalUpdatesListParams,
): string => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  setOptionalParam(query, 'type', params.type)
  setOptionalParam(query, 'caseId', params.caseId)

  return query.toString()
}

export const listPortalUpdates = (
  params: PortalUpdatesListParams,
): Promise<PortalUpdatesListResponse> =>
  portalApiClient.get<PortalUpdatesListResponse>(
    `/portal/updates?${buildPortalUpdatesQuery(params)}`,
  )

export const getPortalUpdatesSummary =
  (): Promise<PortalUpdatesSummaryResponse> =>
    portalApiClient.get<PortalUpdatesSummaryResponse>(
      '/portal/updates/summary',
    )
