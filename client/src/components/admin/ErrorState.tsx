import { AlertCircle, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

export interface ErrorStateProps {
  title: string
  description: string
  action?: ReactNode
  className?: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({
  title,
  description,
  action,
  className,
  onRetry,
  retryLabel,
}: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'grid min-h-72 place-items-center rounded-lg border border-rose-200 bg-white p-8 text-center shadow-sm',
        className,
      )}
      role="alert"
    >
      <div className="max-w-md">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
        <p className="mx-auto mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>
        {action ? <div className="mt-5">{action}</div> : null}
        {onRetry ? (
          <button
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            onClick={onRetry}
            type="button"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {retryLabel ?? t('common.tryAgain')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
