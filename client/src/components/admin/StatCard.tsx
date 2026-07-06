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
    <article className="group relative overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/90 p-5 shadow-sm shadow-slate-950/[0.04] ring-1 ring-slate-200/70 backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/[0.06]">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500/80 via-cyan-400/70 to-emerald-400/60 opacity-0 transition group-hover:opacity-100"
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            {formatNumber(value, i18n.language)}
          </p>
        </div>
        <span className={`rounded-xl p-2.5 ring-1 ring-inset ring-white/60 ${iconClassName}`}>
          {icon}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs text-slate-400">
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{description}</span>
      </div>
    </article>
  )
}
