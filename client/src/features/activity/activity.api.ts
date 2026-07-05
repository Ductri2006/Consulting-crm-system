import { apiClient } from '../../lib/apiClient'
import type {
  ActivityListParams,
  ActivityListResponse,
  ActivitySummaryResponse,
} from './activity.types'

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

const buildActivityListQuery = (params: ActivityListParams): string => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    sort: params.sort ?? 'newest',
  })

  setOptionalParam(query, 'action', params.action)
  setOptionalParam(query, 'actorUserId', params.actorUserId)
  setOptionalParam(query, 'entityType', params.entityType)
  setOptionalParam(query, 'fromDate', params.fromDate)
  setOptionalParam(query, 'search', params.search)
  setOptionalParam(query, 'toDate', params.toDate)

  return query.toString()
}

export const listActivities = (
  params: ActivityListParams,
): Promise<ActivityListResponse> =>
  apiClient.get<ActivityListResponse>(
    `/activity?${buildActivityListQuery(params)}`,
  )

export const getActivitySummary = (): Promise<ActivitySummaryResponse> =>
  apiClient.get<ActivitySummaryResponse>('/activity/summary')
