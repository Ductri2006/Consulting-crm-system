import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  RefreshCw,
  UserRound,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import {
  getPortalCase,
  type PortalCaseDetail,
} from '../../features/customerPortal'
import {
  PortalPriorityBadge,
  PortalStatusBadge,
} from '../../features/customerPortal/portalCases.display'
import {
  formatPortalDate,
  formatPortalDateTime,
  formatPortalFileSize,
  formatPortalLabel,
} from '../../features/customerPortal/portalCases.format'
import { getStatusLabel } from '../../i18n/statusLabels'

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

function DetailField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <dt className="text-xs font-bold uppercase text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </dd>
    </div>
  )
}

function SectionTitle({
  icon,
  title,
}: {
  icon: ReactNode
  title: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
        {icon}
      </span>
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
    </div>
  )
}

export function CustomerPortalCaseDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [caseDetail, setCaseDetail] = useState<PortalCaseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadCase = useCallback(async () => {
    if (!id) {
      setLoadError(t('portal.caseDetail.missingCaseId', {
        defaultValue: 'Case id is missing.',
      }))
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      setCaseDetail(await getPortalCase(id))
    } catch (error) {
      setLoadError(
        getErrorMessage(
          error,
          t('portal.caseDetail.loadErrorFallback', {
            defaultValue: 'Case details could not be loaded.',
          }),
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    void loadCase()
  }, [loadCase])

  if (isLoading && !caseDetail) {
    return (
      <section className="grid min-h-72 place-items-center rounded-lg border border-slate-200 bg-white p-8 text-center">
        <div>
          <BriefcaseBusiness className="mx-auto h-8 w-8 animate-pulse text-emerald-600" />
          <p className="mt-4 text-sm font-bold text-slate-600">
            {t('portal.caseDetail.loading')}
          </p>
        </div>
      </section>
    )
  }

  if (loadError && !caseDetail) {
    return (
      <section
        className="grid min-h-72 place-items-center rounded-lg border border-rose-200 bg-rose-50 p-8 text-center"
        role="alert"
      >
        <div>
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
          <h1 className="mt-4 font-bold text-slate-950">
            {t('portal.caseDetail.loadErrorTitle')}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-rose-700">
            {loadError}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600"
              to="/portal/cases"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('portal.caseDetail.backToCases')}
            </Link>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-bold text-white"
              onClick={() => void loadCase()}
              type="button"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t('common.tryAgain')}
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (!caseDetail) {
    return null
  }

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
              to="/portal/cases"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('portal.caseDetail.backToCases')}
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-emerald-700">
                {caseDetail.caseCode}
              </span>
              <PortalStatusBadge status={caseDetail.status} />
              <PortalPriorityBadge priority={caseDetail.priority} />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">
              {caseDetail.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {caseDetail.description ?? t('portal.caseDetail.noPublicDescription')}
            </p>
          </div>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            disabled={isLoading}
            onClick={() => void loadCase()}
            type="button"
          >
            <RefreshCw
              className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
              aria-hidden="true"
            />
            {t('common.refresh')}
          </button>
        </div>
      </header>

      {loadError ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="alert"
        >
          {t('portal.caseDetail.refreshFailed', { message: loadError })}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle
          icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />}
          title={t('portal.caseDetail.overview')}
        />
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField
            label={t('portal.caseDetail.service')}
            value={caseDetail.service.name}
          />
          <DetailField
            label={t('portal.caseDetail.assignedConsultant')}
            value={caseDetail.assignedStaff?.fullName ?? t('common.notAssigned')}
          />
          <DetailField
            label={t('common.created')}
            value={formatPortalDateTime(caseDetail.createdAt)}
          />
          <DetailField
            label={t('common.updated')}
            value={formatPortalDateTime(caseDetail.updatedAt)}
          />
          <DetailField
            label={t('portal.caseDetail.deadline')}
            value={formatPortalDateTime(caseDetail.deadline)}
          />
          <DetailField
            label={t('common.completed')}
            value={formatPortalDateTime(caseDetail.completedAt)}
          />
          <DetailField
            label={t('portal.caseDetail.customer')}
            value={caseDetail.customer.fullName}
          />
          <DetailField
            label={t('portal.caseDetail.relatedRecords')}
            value={t('portal.caseDetail.relatedRecordsValue', {
              appointments: caseDetail.counts.appointments,
              documents: caseDetail.counts.documents,
              tasks: caseDetail.counts.tasks,
              defaultValue:
                '{{documents}} documents, {{tasks}} tasks, {{appointments}} appointments',
            })}
          />
        </dl>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle
            icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
            title={t('portal.caseDetail.timeline')}
          />
          {caseDetail.timeline.length === 0 ? (
            <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              {t('portal.caseDetail.noTimeline')}
            </p>
          ) : (
            <ol className="mt-5 space-y-4">
              {caseDetail.timeline.map((item) => (
                <li className="flex gap-3" key={item.id}>
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {item.description ?? formatPortalLabel(item.action)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatPortalDateTime(item.createdAt)}
                      {item.user
                        ? t('portal.caseDetail.byUser', {
                            defaultValue: ' by {{name}}',
                            name: item.user.fullName,
                          })
                        : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle
            icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />}
            title={t('portal.caseDetail.appointments')}
          />
          {caseDetail.appointments.length === 0 ? (
            <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              {t('portal.caseDetail.noAppointments')}
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {caseDetail.appointments.map((appointment) => (
                <article
                  className="rounded-lg border border-slate-200 p-4"
                  key={appointment.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">
                        {formatPortalDate(appointment.appointmentDate)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {appointment.startTime}
                        {appointment.endTime
                          ? ` - ${appointment.endTime}`
                          : ''}{' '}
                        - {getStatusLabel(t, 'method', appointment.method)}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      {getStatusLabel(t, 'appointment', appointment.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    {t('portal.caseDetail.staff')}:{' '}
                    {appointment.staff?.fullName ?? t('common.notAssigned')}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle
            icon={<FileText className="h-5 w-5" aria-hidden="true" />}
            title={t('portal.caseDetail.documents')}
          />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            {t('portal.caseDetail.documentsFuture')}
          </p>
          {caseDetail.documents.length === 0 ? (
            <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              {t('portal.caseDetail.noDocuments')}
            </p>
          ) : (
            <div className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {caseDetail.documents.map((document) => (
                <div className="p-4" key={document.id}>
                  <p className="break-words text-sm font-bold text-slate-950">
                    {document.fileName}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {getStatusLabel(t, 'document', document.fileType)} -{' '}
                    {document.mimeType ??
                      t('portal.caseDetail.unknownType', {
                        defaultValue: 'Unknown type',
                      })}{' '}
                    -{' '}
                    {formatPortalFileSize(document.size)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {t('portal.caseDetail.added', {
                      date: formatPortalDateTime(document.createdAt),
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle
            icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
            title={t('portal.caseDetail.tasks')}
          />
          {caseDetail.tasks.length === 0 ? (
            <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              {t('portal.caseDetail.noTasks')}
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {caseDetail.tasks.map((task) => (
                <article
                  className="rounded-lg border border-slate-200 p-4"
                  key={task.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-bold text-slate-950">
                        {task.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {t('portal.caseDetail.due', {
                          date: formatPortalDateTime(task.deadline),
                        })}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      {getStatusLabel(t, 'task', task.status)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle
          icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
          title={t('portal.caseDetail.customerSummary')}
        />
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField
            label={t('portal.caseDetail.name')}
            value={caseDetail.customer.fullName}
          />
          <DetailField
            label={t('portal.dashboard.phone')}
            value={caseDetail.customer.phone}
          />
          <DetailField
            label={t('common.email')}
            value={caseDetail.customer.email ?? t('common.notProvided')}
          />
          <DetailField
            label={t('portal.dashboard.address')}
            value={caseDetail.customer.address ?? t('common.notProvided')}
          />
        </dl>
      </section>
    </div>
  )
}
