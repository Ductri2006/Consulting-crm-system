import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

import { cn } from '../../utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonOwnProps {
  children: ReactNode
  className?: string
  variant?: ButtonVariant
  size?: ButtonSize
}

type ButtonElementProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps>

type ButtonLinkProps = ButtonOwnProps &
  Omit<LinkProps, keyof ButtonOwnProps>

export type ButtonProps = ButtonElementProps | ButtonLinkProps

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 focus-visible:ring-blue-600',
  secondary:
    'bg-slate-900 text-white shadow-sm shadow-slate-900/20 hover:bg-slate-800 focus-visible:ring-slate-900',
  outline:
    'border border-slate-300 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-blue-600',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-slate-500',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 py-2 text-sm',
  md: 'min-h-11 px-5 py-2.5 text-sm',
  lg: 'min-h-12 px-6 py-3 text-base',
}

function getButtonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )
}

export function Button(props: ButtonProps) {
  if ('to' in props) {
    const {
      children,
      className,
      size = 'md',
      variant = 'primary',
      ...linkProps
    } = props

    return (
      <Link
        className={getButtonClasses(variant, size, className)}
        {...linkProps}
      >
        {children}
      </Link>
    )
  }

  const {
    children,
    className,
    size = 'md',
    type = 'button',
    variant = 'primary',
    ...buttonProps
  } = props

  return (
    <button
      className={getButtonClasses(variant, size, className)}
      type={type}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
