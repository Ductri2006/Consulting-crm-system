import type { TFunction } from 'i18next'

export type StatusNamespace =
  | 'appointment'
  | 'activityAction'
  | 'case'
  | 'document'
  | 'downloadUnavailableReason'
  | 'entityType'
  | 'invitation'
  | 'method'
  | 'ocrStatus'
  | 'priority'
  | 'portalUpdateAction'
  | 'portalUpdateType'
  | 'publish'
  | 'request'
  | 'role'
  | 'scanStatus'
  | 'storageProvider'
  | 'task'

export const fallbackEnumLabel = (value: string): string =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')

export const getStatusLabel = (
  t: TFunction,
  namespace: StatusNamespace,
  value: string,
): string =>
  t(`status.${namespace}.${value}`, {
    defaultValue: fallbackEnumLabel(value),
  })
