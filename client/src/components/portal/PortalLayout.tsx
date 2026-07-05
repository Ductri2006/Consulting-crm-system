import {
  Bell,
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { usePortalAuth } from '../../features/customerPortal'
import { cn } from '../../utils/cn'
import { LanguageSwitcher } from '../common/LanguageSwitcher'

const portalNavItems = [
  {
    href: '/portal/dashboard',
    labelKey: 'dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/portal/cases',
    labelKey: 'myCases',
    icon: BriefcaseBusiness,
  },
  {
    href: '/portal/documents',
    labelKey: 'documents',
    icon: FileText,
  },
  {
    href: '/portal/updates',
    labelKey: 'updates',
    icon: Bell,
  },
]

export function PortalLayout() {
  const { t } = useTranslation()
  const { logout, session } = usePortalAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/portal/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">
                {session?.organization.name ?? t('navigation.portal')}
              </p>
              <p className="truncate text-xs font-medium text-slate-500">
                {session?.customer.fullName ?? t('portal.secureWorkspace')}
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
            <nav
              aria-label={t('navigation.portal')}
              className="-mx-1 max-w-full overflow-x-auto px-1 pb-1"
            >
              <div className="flex min-w-max items-center gap-1">
              {portalNavItems.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    className={({ isActive }) =>
                      cn(
                        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition',
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                          : 'text-slate-600 hover:bg-slate-50',
                      )
                    }
                    key={item.href}
                    to={item.href}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {t(`navigation.${item.labelKey}`)}
                  </NavLink>
                )
              })}
              </div>
            </nav>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <LanguageSwitcher compact />
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                onClick={() => void handleLogout()}
                type="button"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
