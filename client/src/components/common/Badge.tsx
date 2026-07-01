import type { HTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

type BadgeVariant = 'neutral' | 'blue' | 'amber' | 'green'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

export function Badge({
  className,
  variant = 'blue',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
