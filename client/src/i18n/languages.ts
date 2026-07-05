export const LOCALE_STORAGE_KEY = 'advisora_locale'

export const supportedLanguages = ['en', 'vi'] as const

export type SupportedLanguage = (typeof supportedLanguages)[number]

export const defaultLanguage: SupportedLanguage = 'en'

export const languageLabels: Record<SupportedLanguage, string> = {
  en: 'EN',
  vi: 'VI',
}

export const localeTags: Record<SupportedLanguage, string> = {
  en: 'en-US',
  vi: 'vi-VN',
}

export const isSupportedLanguage = (
  value: string | undefined,
): value is SupportedLanguage =>
  supportedLanguages.some((language) => language === value)

export const normalizeLanguage = (
  value: string | undefined,
): SupportedLanguage => {
  if (!value) {
    return defaultLanguage
  }

  const language = value.toLowerCase().split('-')[0]

  return isSupportedLanguage(language) ? language : defaultLanguage
}
