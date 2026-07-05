import type { TFunction } from 'i18next'
import { getStatusLabel, fallbackEnumLabel } from '../../i18n/statusLabels'
import type {
  PortalCaseStatus,
  PortalCaseTimelineItem,
} from './portalCases.types'
import type { PortalUpdateItem } from './portalUpdates.types'

type PortalUpdateDescriptionTarget =
  | Pick<PortalUpdateItem, 'action' | 'description'>
  | Pick<
      PortalCaseTimelineItem,
      'action' | 'description' | 'oldStatus' | 'newStatus'
    >

const getStatusValue = (
  t: TFunction,
  status: PortalCaseStatus | null | undefined,
): string => (status ? getStatusLabel(t, 'case', status) : '')

export const getPortalUpdateDescription = (
  t: TFunction,
  target: PortalUpdateDescriptionTarget,
): string => {
  const fallback =
    target.description ??
    (target.action ? fallbackEnumLabel(target.action) : '')

  if (!target.action) {
    return fallback
  }

  const oldStatus = 'oldStatus' in target ? target.oldStatus : null
  const newStatus = 'newStatus' in target ? target.newStatus : null
  const descriptionKey =
    oldStatus && newStatus
      ? `${target.action}_WITH_STATUS`
      : target.action

  return t(`portal.updates.descriptions.${descriptionKey}`, {
    defaultValue: fallback,
    newStatus: getStatusValue(t, newStatus),
    oldStatus: getStatusValue(t, oldStatus),
  })
}
