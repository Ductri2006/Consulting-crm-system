import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../i18n/format'

export interface StatCardProps {
  label: string
  value: number
  icon: ReactNode
  iconClassName: string
  description: string
}

export function StatCard({
  label,
  value,
  icon,
  iconClassName,
  description,
}: StatCardProps) {
  const { i18n } = useTranslation()

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            {formatNumber(value, i18n.language)}
          </p>
        </div>
        <span className={`rounded-xl p-2.5 ${iconClassName}`}>{icon}</span>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs text-slate-400">
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{description}</span>
      </div>
    </article>
  )
}
