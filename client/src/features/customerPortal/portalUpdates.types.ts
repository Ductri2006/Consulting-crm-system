import type { PortalPaginationMeta } from './portalCases.types'

export type PortalUpdateType = 'CASE' | 'APPOINTMENT' | 'DOCUMENT' | 'ACCOUNT'

export interface PortalUpdateCaseSummary {
  id: string
  caseCode: string
  title: string
}

export interface PortalUpdateItem {
  id: string
  type: PortalUpdateType
  title: string
  description: string
  occurredAt: string
  entityType: string
  entityId: string
  caseProfile: PortalUpdateCaseSummary | null
  action?: string
}

export interface PortalUpdatesListParams {
  page: number
  limit: number
  type?: PortalUpdateType
  caseId?: string
}

export interface PortalUpdatesListResponse {
  items: PortalUpdateItem[]
  meta: PortalPaginationMeta
}

export interface PortalUpdatesSummaryResponse {
  totalUpdates: number
  latestUpdateAt: string | null
  recentUpdates: PortalUpdateItem[]
}

export const portalUpdateTypes = [
  'CASE',
  'APPOINTMENT',
  'DOCUMENT',
  'ACCOUNT',
] as const
