import { cn } from '../../utils/cn'

const statusStyles: Record<string, string> = {
  RECEIVED: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  VERIFYING: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  PROPOSING_SOLUTION: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  PROCESSING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  DONE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  TODO: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  PENDING: 'bg-orange-50 text-orange-700 ring-orange-600/20',
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}

export interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        statusStyles[status] ?? 'bg-slate-100 text-slate-700 ring-slate-500/20',
        className,
      )}
    >
      {formatStatus(status)}
    </span>
  )
}
