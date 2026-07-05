import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  languageLabels,
  supportedLanguages,
  type SupportedLanguage,
} from '../../i18n/languages'
import { cn } from '../../utils/cn'

export interface LanguageSwitcherProps {
  className?: string
  compact?: boolean
}

export function LanguageSwitcher({
  className,
  compact = false,
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language

  const setLanguage = (language: SupportedLanguage) => {
    if (currentLanguage.startsWith(language)) {
      return
    }

    void i18n.changeLanguage(language)
  }

  return (
    <div
      aria-label={t('language.label')}
      className={cn(
        'inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-sm font-bold text-slate-600 shadow-sm',
        className,
      )}
      role="group"
    >
      {!compact ? (
        <span className="hidden items-center gap-1 px-2 text-slate-400 sm:inline-flex">
          <Languages className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t('language.label')}</span>
        </span>
      ) : null}
      {supportedLanguages.map((language) => {
        const isActive = currentLanguage.startsWith(language)

        return (
          <button
            aria-pressed={isActive}
            className={cn(
              'min-h-8 rounded-md px-2.5 transition',
              isActive
                ? 'bg-slate-950 text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950',
            )}
            key={language}
            onClick={() => setLanguage(language)}
            type="button"
          >
            {languageLabels[language]}
          </button>
        )
      })}
    </div>
  )
}
