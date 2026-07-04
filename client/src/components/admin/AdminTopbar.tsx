import { LogOut, Menu, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../features/auth'

export interface AdminTopbarProps {
  onMenuClick: () => void
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const { user, logout } = useAuth()
  const workspaceName = user?.organization?.name?.trim() || 'CRM workspace'

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur md:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          aria-label="Open navigation"
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <p className="max-w-56 truncate text-sm font-semibold text-slate-900">
            {workspaceName}
          </p>
          <p className="text-xs text-slate-400">Your operations at a glance</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden text-right sm:block">
          <p className="max-w-44 truncate text-sm font-semibold text-slate-900">
            {user?.fullName ?? 'CRM user'}
          </p>
          <p className="max-w-44 truncate text-xs text-slate-400">
            {user?.email ?? ''}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm"
        >
          {initials(user?.fullName ?? 'CRM')}
        </div>
        <span className="hidden items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 md:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {user?.role ?? 'User'}
        </span>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          onClick={() => void logout()}
          type="button"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
