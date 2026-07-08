import { LogOut, Menu, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../common/LanguageSwitcher'
import { useAuth } from '../../features/auth'
import { getStatusLabel } from '../../i18n/statusLabels'

export interface AdminTopbarProps {
  isMenuOpen: boolean
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

export function AdminTopbar({ isMenuOpen, onMenuClick }: AdminTopbarProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const workspaceName = user?.organization?.name?.trim() || t('admin.crmWorkspace')

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          aria-controls="admin-mobile-sidebar"
          aria-expanded={isMenuOpen}
          aria-label={t('admin.openNavigation')}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <p
            className="max-w-56 truncate text-sm font-semibold text-slate-900"
            title={workspaceName}
          >
            {workspaceName}
          </p>
          <p className="text-xs text-slate-500">{t('admin.topbarSubtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageSwitcher compact className="hidden md:inline-flex" />
        <div className="hidden text-right sm:block">
          <p className="max-w-44 truncate text-sm font-semibold text-slate-900">
            {user?.fullName ?? t('admin.crmUser')}
          </p>
          <p className="max-w-44 truncate text-xs text-slate-500">
            {user?.email ?? ''}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-slate-900 to-blue-900 text-sm font-bold text-white shadow-sm shadow-slate-950/20"
        >
          {initials(user?.fullName ?? 'CRM')}
        </div>
        <span className="hidden items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 md:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {user?.role ? getStatusLabel(t, 'role', user.role) : t('admin.crmUser')}
        </span>
        <button
          aria-label={t('common.logout')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          onClick={() => void logout()}
          type="button"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden md:inline">{t('common.logout')}</span>
        </button>
      </div>
    </header>
  )
}
