import type { TFunction } from 'i18next'

export type StatusNamespace =
  | 'appointment'
  | 'case'
  | 'document'
  | 'downloadUnavailableReason'
  | 'invitation'
  | 'method'
  | 'ocrStatus'
  | 'priority'
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
