import { useTranslation } from 'react-i18next'
import { getStatusLabel } from '../../i18n/statusLabels'
import { cn } from '../../utils/cn'
import type {
  PortalCaseStatus,
  PortalPriority,
} from './portalCases.types'

export function PortalStatusBadge({ status }: { status: PortalCaseStatus }) {
  const { t } = useTranslation()
  const styles: Record<PortalCaseStatus, string> = {
    RECEIVED: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    VERIFYING: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    PROPOSING_SOLUTION: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    PROCESSING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
        styles[status],
      )}
    >
      {getStatusLabel(t, 'case', status)}
    </span>
  )
}

export function PortalPriorityBadge({
  priority,
}: {
  priority: PortalPriority
}) {
  const { t } = useTranslation()
  const styles: Record<PortalPriority, string> = {
    LOW: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    MEDIUM: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    HIGH: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    URGENT: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
        styles[priority],
      )}
    >
      {getStatusLabel(t, 'priority', priority)}
    </span>
  )
}
