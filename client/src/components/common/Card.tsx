import type { HTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({
  className,
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm',
        interactive &&
          'transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-soft',
        className,
      )}
      {...props}
    />
  )
}
