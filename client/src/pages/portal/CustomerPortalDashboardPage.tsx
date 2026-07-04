import {
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getPortalCaseSummary,
  getPortalProfile,
  type PortalCaseSummary,
  type PortalCaseSummaryResponse,
  type PortalProfileData,
  usePortalAuth,
} from '../../features/customerPortal'
import {
  PortalPriorityBadge,
  PortalStatusBadge,
} from '../../features/customerPortal/portalCases.display'
import {
  formatPortalDate,
  formatPortalDateTime,
} from '../../features/customerPortal/portalCases.format'

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
          {icon}
        </span>
      </div>
    </div>
  )
}

function ComingSoonItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-600/20">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-950">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

function RecentCaseCard({ caseProfile }: { caseProfile: PortalCaseSummary }) {
  return (
    <Link
      className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-emerald-200 hover:shadow-md"
      to={`/portal/cases/${caseProfile.id}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-sm font-bold text-emerald-700">
            {caseProfile.caseCode}
          </p>
          <h3 className="mt-2 text-sm font-bold text-slate-950">
            {caseProfile.title}
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Updated {formatPortalDateTime(caseProfile.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PortalStatusBadge status={caseProfile.status} />
          <PortalPriorityBadge priority={caseProfile.priority} />
        </div>
      </div>
    </Link>
  )
}

export function CustomerPortalDashboardPage() {
  const { session } = usePortalAuth()
  const [profile, setProfile] = useState<PortalProfileData | null>(null)
  const [caseSummary, setCaseSummary] =
    useState<PortalCaseSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadPortalData = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const [nextProfile, nextCaseSummary] = await Promise.all([
        getPortalProfile(),
        getPortalCaseSummary(),
      ])
      setProfile(nextProfile)
      setCaseSummary(nextCaseSummary)
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Customer portal data could not be loaded.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPortalData()
  }, [loadPortalData])

  const data = profile ?? session

  if (!data) {
    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-slate-600">
          Portal session is not available.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-700">
              {data.organization.name}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
              Welcome, {data.customer.fullName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {profile?.overview.message ??
                'Case tracking is available in your portal.'}
            </p>
          </div>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            disabled={isLoading}
            onClick={() => void loadPortalData()}
            type="button"
          >
            <RefreshCw
              className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
      </header>

      {loadError ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="alert"
        >
          Refresh failed: {loadError}. Showing the latest available portal
          session.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />}
          label="Total cases"
          value={caseSummary?.totalCases ?? 0}
        />
        <StatCard
          icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />}
          label="Active cases"
          value={caseSummary?.activeCases ?? 0}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
          label="Completed cases"
          value={caseSummary?.completedCases ?? 0}
        />
        <StatCard
          icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />}
          label="Upcoming appointments"
          value={caseSummary?.upcomingAppointments ?? 0}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Recent Cases
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Updated newest first.
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white transition hover:bg-emerald-700 sm:self-auto"
              to="/portal/cases"
            >
              <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
              View my cases
            </Link>
          </div>

          {caseSummary?.recentCases.length ? (
            <div className="mt-5 grid gap-3">
              {caseSummary.recentCases.map((caseProfile) => (
                <RecentCaseCard
                  caseProfile={caseProfile}
                  key={caseProfile.id}
                />
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              No cases are available in your portal yet.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Next Appointment
          </h2>
          {caseSummary?.nextAppointment ? (
            <div className="mt-5 rounded-lg border border-slate-200 p-4">
              <p className="font-bold text-slate-950">
                {formatPortalDate(caseSummary.nextAppointment.appointmentDate)}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {caseSummary.nextAppointment.startTime}
                {caseSummary.nextAppointment.endTime
                  ? ` - ${caseSummary.nextAppointment.endTime}`
                  : ''}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Staff:{' '}
                {caseSummary.nextAppointment.staff?.fullName ??
                  'Not assigned yet'}
              </p>
            </div>
          ) : (
            <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              No upcoming appointment is scheduled.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Customer Profile
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {data.organization.slug}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Active
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoRow
              icon={<Phone className="h-4 w-4" aria-hidden="true" />}
              label="Phone"
              value={data.customer.phone}
            />
            <InfoRow
              icon={<Mail className="h-4 w-4" aria-hidden="true" />}
              label="Email"
              value={data.customer.email ?? data.portalAccount.email}
            />
            <InfoRow
              icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
              label="Address"
              value={data.customer.address ?? 'Not provided'}
            />
            <InfoRow
              icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              label="Last login"
              value={formatPortalDateTime(data.portalAccount.lastLoginAt)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Portal Account</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-bold text-slate-400">Login email</dt>
              <dd className="mt-1 break-all font-semibold text-slate-800">
                {data.portalAccount.email}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-slate-400">Status</dt>
              <dd className="mt-1 font-semibold text-slate-800">
                {data.portalAccount.isActive ? 'Active' : 'Inactive'}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-slate-400">Created</dt>
              <dd className="mt-1 font-semibold text-slate-800">
                {formatPortalDateTime(data.portalAccount.createdAt)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ComingSoonItem
          icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          title="Documents"
          description="Customer document upload and download remain reserved for Step 29."
        />
        <ComingSoonItem
          icon={<MessageSquareText className="h-5 w-5" aria-hidden="true" />}
          title="Messages"
          description="Secure customer updates are reserved for a later portal step."
        />
      </section>
    </div>
  )
}
