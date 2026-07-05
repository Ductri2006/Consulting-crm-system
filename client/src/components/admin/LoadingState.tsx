import { useTranslation } from 'react-i18next'

export interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label }: LoadingStateProps) {
  const { t } = useTranslation()

  return (
    <div
      aria-live="polite"
      className="flex min-h-[360px] items-center justify-center"
      role="status"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {label ?? t('common.loading')}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {t('admin.loadingHint', {
              defaultValue: "We're getting the latest CRM information.",
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
