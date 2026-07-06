import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

export interface LoadingStateProps {
  className?: string
  hint?: string | null
  label?: string
}

export function LoadingState({ className, hint, label }: LoadingStateProps) {
  const { t } = useTranslation()
  const resolvedHint = hint === undefined ? t('admin.loadingHint') : hint

  return (
    <div
      aria-live="polite"
      className={cn('flex min-h-[360px] items-center justify-center', className)}
      role="status"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 px-8 py-7 text-center shadow-sm shadow-slate-950/[0.03] backdrop-blur">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {label ?? t('common.loading')}
          </p>
          {resolvedHint ? (
            <p className="mt-1 text-xs text-slate-500">{resolvedHint}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
