import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Files,
  FolderKanban,
  LayoutDashboard,
  MessageSquareText,
  Scale,
  UsersRound,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard', active: true },
  { label: 'Customers', icon: UsersRound, to: '/admin/customers', active: true },
  {
    label: 'Consultation Requests',
    icon: MessageSquareText,
    to: '/admin/consultation-requests',
    active: true,
  },
  { label: 'Cases', icon: FolderKanban, to: '/admin/cases', active: true },
  { label: 'Appointments', icon: CalendarDays, to: '/admin/appointments', active: true },
  { label: 'Tasks', icon: ClipboardCheck, to: '/admin/tasks', active: true },
  { label: 'Documents', icon: Files, to: '/admin/documents', active: true },
  { label: 'Reports', icon: BarChart3, active: false },
]

export interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

function SidebarContent({ onClose }: Pick<AdminSidebarProps, 'onClose'>) {
  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <NavLink
          aria-label="Advisora CRM dashboard"
          className="flex items-center gap-3"
          onClick={onClose}
          to="/admin/dashboard"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/40">
            <Scale className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <strong className="block text-base tracking-tight">Advisora CRM</strong>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Operations
            </span>
          </span>
        </NavLink>
        <button
          aria-label="Close navigation"
          className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Workspace
        </p>
        <ul className="space-y-1.5">
          {navigation.map(({ label, icon: Icon, to, active }) => (
            <li key={label}>
              {active && to ? (
                <NavLink
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white',
                    )
                  }
                  onClick={onClose}
                  to={to}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  {label}
                </NavLink>
              ) : (
                <div
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500"
                  title="Coming soon"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    {label}
                  </span>
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                    Soon
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 px-4 py-3">
          <p className="text-xs font-semibold text-slate-200">Portfolio environment</p>
          <p className="mt-1 text-[11px] leading-4 text-slate-500">
            Connected to the Advisora CRM API.
          </p>
        </div>
      </div>
    </div>
  )
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent onClose={onClose} />
      </aside>

      <button
        aria-label="Close navigation overlay"
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition lg:hidden',
          isOpen ? 'visible opacity-100' : 'invisible opacity-0',
        )}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-hidden={!isOpen}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[88vw] transform transition duration-300 lg:hidden',
          isOpen
            ? 'translate-x-0'
            : 'pointer-events-none -translate-x-full',
        )}
        inert={!isOpen}
      >
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  )
}
