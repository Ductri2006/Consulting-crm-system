import { i18n } from './index'
import {
  localeTags,
  normalizeLanguage,
  type SupportedLanguage,
} from './languages'

const getLocaleTag = (language = i18n.language): string =>
  localeTags[normalizeLanguage(language)]

export const formatDate = (
  value: string | null,
  language?: SupportedLanguage | string,
): string => {
  if (!value) {
    return i18n.t('common.notScheduled')
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(getLocaleTag(language), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export const formatDateTime = (
  value: string | null,
  language?: SupportedLanguage | string,
): string => {
  if (!value) {
    return i18n.t('common.notScheduled')
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(getLocaleTag(language), {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export const formatMonthYear = (
  value: string,
  language?: SupportedLanguage | string,
): string => {
  const [year, month] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(getLocaleTag(language), {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export const formatNumber = (
  value: number,
  language?: SupportedLanguage | string,
): string => new Intl.NumberFormat(getLocaleTag(language)).format(value)

export const formatFileSize = (
  size: number | null,
  language?: SupportedLanguage | string,
): string => {
  if (!size || size <= 0) {
    return i18n.t('common.notProvided')
  }

  const formatter = new Intl.NumberFormat(getLocaleTag(language), {
    maximumFractionDigits: 1,
  })

  if (size < 1024) {
    return `${formatter.format(size)} B`
  }

  if (size < 1024 * 1024) {
    return `${formatter.format(size / 1024)} KB`
  }

  return `${formatter.format(size / (1024 * 1024))} MB`
}
