import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileClock,
  History,
  Pencil,
  Plus,
  RefreshCw,
  SearchX,
  Trash2,
  UserRoundCheck,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useForm } from 'react-hook-form'
import {
  ConfirmDialog,
  DataTable,
  EmptyState,
  LoadingState,
  Modal,
  Pagination,
  SearchInput,
  StatusBadge,
  type DataTableColumn,
} from '../../components/admin'
import { useAuth } from '../../features/auth'
import {
  assignCase,
  assignableUserRoles,
  caseAssignSchema,
  caseCreateFormSchema,
  caseEditFormSchema,
  caseStatusTransitions,
  caseStatusUpdateSchema,
  caseStatuses,
  createCase,
  deleteCase,
  getCase,
  getCaseHistory,
  listAssignableUsers,
  listCaseCustomers,
  listCases,
  listCaseServices,
  listOverdueCases,
  priorities,
  toCaseCreateInput,
  toCaseStatusUpdateInput,
  toCaseUpdateInput,
  toDateTimeLocalValue,
  updateCase,
  updateCaseStatus,
  type CaseAssignValues,
  type CaseDetail,
  type CaseEditFormValues,
  type CaseFormValues,
  type CaseHistoryItem,
  type CaseProfile,
  type CaseStatus,
  type CustomerOption,
  type PaginationMeta,
  type Priority,
  type ServiceOption,
  type UserOption,
} from '../../features/cases'
import { ApiError } from '../../lib/apiClient'
import { cn } from '../../utils/cn'

const PAGE_SIZE = 10
const HISTORY_PAGE_SIZE = 10

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
}

const EMPTY_CREATE_FORM: CaseFormValues = {
  customerId: '',
  serviceId: '',
  assignedToId: '',
  title: '',
  description: '',
  note: '',
  priority: 'MEDIUM',
  deadline: '',
}

interface Feedback {
  type: 'success' | 'error'
  message: string
}

interface LookupState {
  customers: CustomerOption[]
  services: ServiceOption[]
  users: UserOption[]
}

const EMPTY_LOOKUPS: LookupState = {
  customers: [],
  services: [],
  users: [],
}

const formatLabel = (value: string): string =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const isOverdue = (caseProfile: CaseProfile): boolean =>
  Boolean(
    caseProfile.deadline &&
      new Date(caseProfile.deadline).getTime() < Date.now() &&
      caseProfile.status !== 'COMPLETED' &&
      caseProfile.status !== 'CANCELLED',
  )

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

function FieldError({
  id,
  message,
}: {
  id: string
  message?: string
}) {
  return message ? (
    <p className="field-error" id={id}>
      {message}
    </p>
  ) : null
}

function FormError({ message }: { message: string | null }) {
  return message ? (
    <div
      className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      role="alert"
    >
      {message}
    </div>
  ) : null
}

function ModalActions({
  cancelLabel = 'Cancel',
  isSubmitting,
  onCancel,
  submitLabel,
  submittingLabel = 'Saving…',
}: {
  cancelLabel?: string
  isSubmitting: boolean
  onCancel: () => void
  submitLabel: string
  submittingLabel?: string
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
      <button
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        disabled={isSubmitting}
        onClick={onCancel}
        type="button"
      >
        {cancelLabel}
      </button>
      <button
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    LOW: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    MEDIUM: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    HIGH: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    URGENT: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        styles[priority],
      )}
    >
      {formatLabel(priority)}
    </span>
  )
}

interface CreateCaseFormProps {
  error: string | null
  isLoadingLookups: boolean
  lookupError: string | null
  lookups: LookupState
  showAssignee: boolean
  onCancel: () => void
  onSubmit: (values: CaseFormValues) => Promise<void>
}

function CreateCaseForm({
  error,
  isLoadingLookups,
  lookupError,
  lookups,
  showAssignee,
  onCancel,
  onSubmit,
}: CreateCaseFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<CaseFormValues>({
    resolver: zodResolver(caseCreateFormSchema),
    defaultValues: EMPTY_CREATE_FORM,
  })

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="max-h-[calc(100vh-13rem)] overflow-y-auto p-5 sm:p-6">
        <FormError message={error} />
        {lookupError ? (
          <div
            className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            role="alert"
          >
            {lookupError}
          </div>
        ) : null}
        {isLoadingLookups ? (
          <div className="mb-5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
            Loading customer, service and staff options…
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="case-customer">
              Customer <span aria-hidden="true">*</span>
            </label>
            <select
              aria-describedby={
                errors.customerId ? 'case-customer-error' : undefined
              }
              aria-invalid={Boolean(errors.customerId)}
              className="field-input"
              disabled={isLoadingLookups}
              id="case-customer"
              {...register('customerId')}
            >
              <option value="">Select a customer</option>
              {lookups.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName} · {customer.phone}
                </option>
              ))}
            </select>
            <FieldError
              id="case-customer-error"
              message={errors.customerId?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="case-service">
              Service <span aria-hidden="true">*</span>
            </label>
            <select
              aria-describedby={
                errors.serviceId ? 'case-service-error' : undefined
              }
              aria-invalid={Boolean(errors.serviceId)}
              className="field-input"
              disabled={isLoadingLookups}
              id="case-service"
              {...register('serviceId')}
            >
              <option value="">Select a service</option>
              {lookups.services
                .filter((service) => service.isActive)
                .map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
            </select>
            <FieldError
              id="case-service-error"
              message={errors.serviceId?.message}
            />
          </div>

          {showAssignee ? (
            <div>
              <label className="field-label" htmlFor="case-assignee">
                Assigned to
              </label>
              <select
                className="field-input"
                disabled={isLoadingLookups}
                id="case-assignee"
                {...register('assignedToId')}
              >
                <option value="">Leave unassigned</option>
                {lookups.users.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName} · {formatLabel(staff.role)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="field-label" htmlFor="case-priority">
              Priority
            </label>
            <select
              className="field-input"
              id="case-priority"
              {...register('priority')}
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {formatLabel(priority)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="case-title">
              Title <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={
                errors.title ? 'case-title-error' : undefined
              }
              aria-invalid={Boolean(errors.title)}
              className="field-input"
              id="case-title"
              {...register('title')}
            />
            <FieldError
              id="case-title-error"
              message={errors.title?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="case-description">
              Description
            </label>
            <textarea
              className="field-input min-h-24 resize-y"
              id="case-description"
              rows={3}
              {...register('description')}
            />
            <FieldError
              id="case-description-error"
              message={errors.description?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="case-note">
              Internal note
            </label>
            <textarea
              className="field-input min-h-20 resize-y"
              id="case-note"
              rows={2}
              {...register('note')}
            />
            <FieldError
              id="case-note-error"
              message={errors.note?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="case-deadline">
              Deadline
            </label>
            <input
              aria-describedby={
                errors.deadline ? 'case-deadline-error' : undefined
              }
              aria-invalid={Boolean(errors.deadline)}
              className="field-input"
              id="case-deadline"
              type="datetime-local"
              {...register('deadline')}
            />
            <FieldError
              id="case-deadline-error"
              message={errors.deadline?.message}
            />
          </div>
        </div>
      </div>

      <ModalActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel="Create case"
        submittingLabel="Creating…"
      />
    </form>
  )
}

interface CaseDetailFormProps {
  caseDetail: CaseDetail
  error: string | null
  onCancel: () => void
  onSubmit: (values: CaseEditFormValues) => Promise<void>
}

function CaseDetailForm({
  caseDetail,
  error,
  onCancel,
  onSubmit,
}: CaseDetailFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<CaseEditFormValues>({
    resolver: zodResolver(caseEditFormSchema),
    defaultValues: {
      title: caseDetail.title,
      description: caseDetail.description ?? '',
      note: caseDetail.note ?? '',
      priority: caseDetail.priority,
      deadline: toDateTimeLocalValue(caseDetail.deadline),
    },
  })

  useEffect(() => {
    reset({
      title: caseDetail.title,
      description: caseDetail.description ?? '',
      note: caseDetail.note ?? '',
      priority: caseDetail.priority,
      deadline: toDateTimeLocalValue(caseDetail.deadline),
    })
  }, [caseDetail, reset])

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="max-h-[calc(100vh-13rem)] overflow-y-auto p-5 sm:p-6">
        <FormError message={error} />

        <section className="mb-6 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Case code
            </p>
            <p className="mt-1 font-bold text-slate-900">
              {caseDetail.caseCode}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Status
            </p>
            <div className="mt-1">
              <StatusBadge status={caseDetail.status} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Customer
            </p>
            <p className="mt-1 font-semibold text-slate-800">
              {caseDetail.customer.fullName}
            </p>
            <p className="text-xs text-slate-500">
              {caseDetail.customer.phone}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Service
            </p>
            <p className="mt-1 font-semibold text-slate-800">
              {caseDetail.service.name}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Assigned to
            </p>
            <p className="mt-1 font-semibold text-slate-800">
              {caseDetail.assignedTo?.fullName ?? 'Unassigned'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Completed
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {formatDateTime(caseDetail.completedAt)}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Related records
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {caseDetail._count.documents} documents ·{' '}
              {caseDetail._count.tasks} tasks ·{' '}
              {caseDetail._count.appointments} appointments
            </p>
          </div>
        </section>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="case-edit-title">
              Title
            </label>
            <input
              aria-describedby={
                errors.title ? 'case-edit-title-error' : undefined
              }
              aria-invalid={Boolean(errors.title)}
              className="field-input"
              id="case-edit-title"
              {...register('title')}
            />
            <FieldError
              id="case-edit-title-error"
              message={errors.title?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="case-edit-description">
              Description
            </label>
            <textarea
              className="field-input min-h-24 resize-y"
              id="case-edit-description"
              rows={3}
              {...register('description')}
            />
            <FieldError
              id="case-edit-description-error"
              message={errors.description?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="case-edit-note">
              Internal note
            </label>
            <textarea
              className="field-input min-h-20 resize-y"
              id="case-edit-note"
              rows={2}
              {...register('note')}
            />
            <FieldError
              id="case-edit-note-error"
              message={errors.note?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="case-edit-priority">
              Priority
            </label>
            <select
              className="field-input"
              id="case-edit-priority"
              {...register('priority')}
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {formatLabel(priority)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="case-edit-deadline">
              Deadline
            </label>
            <input
              aria-describedby={
                errors.deadline ? 'case-edit-deadline-error' : undefined
              }
              aria-invalid={Boolean(errors.deadline)}
              className="field-input"
              id="case-edit-deadline"
              type="datetime-local"
              {...register('deadline')}
            />
            <FieldError
              id="case-edit-deadline-error"
              message={errors.deadline?.message}
            />
          </div>
        </div>
      </div>

      <ModalActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel="Save changes"
      />
    </form>
  )
}

interface StatusFormProps {
  caseProfile: CaseProfile
  error: string | null
  onCancel: () => void
  onSubmit: (values: {
    status: CaseStatus
    note: string
  }) => Promise<void>
}

function StatusForm({
  caseProfile,
  error,
  onCancel,
  onSubmit,
}: StatusFormProps) {
  const expectedStatuses = caseStatusTransitions[caseProfile.status]
  const defaultStatus = expectedStatuses[0] ?? caseProfile.status
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<{ status: CaseStatus; note: string }>({
    resolver: zodResolver(caseStatusUpdateSchema),
    defaultValues: {
      status: defaultStatus,
      note: '',
    },
  })

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="p-5 sm:p-6">
        <FormError message={error} />
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-bold">Workflow</p>
          <p className="mt-1 leading-6">
            Received → Verifying → Proposing Solution → Processing → Completed.
            An unfinished case can be cancelled.
          </p>
          <p className="mt-2 text-xs font-semibold">
            Expected next:{' '}
            {expectedStatuses.length > 0
              ? expectedStatuses.map(formatLabel).join(' or ')
              : 'This is a terminal status'}
          </p>
        </div>

        <label className="field-label" htmlFor="case-status">
          New status
        </label>
        <select
          className="field-input"
          id="case-status"
          {...register('status')}
        >
          {caseStatuses.map((status) => (
            <option key={status} value={status}>
              {formatLabel(status)}
            </option>
          ))}
        </select>

        <label className="field-label mt-5" htmlFor="case-status-note">
          Note
        </label>
        <textarea
          className="field-input min-h-24 resize-y"
          id="case-status-note"
          rows={3}
          {...register('note')}
        />
        <FieldError
          id="case-status-note-error"
          message={errors.note?.message}
        />
      </div>

      <ModalActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel="Update status"
        submittingLabel="Updating…"
      />
    </form>
  )
}

interface AssignFormProps {
  caseProfile: CaseProfile
  error: string | null
  isLoadingUsers: boolean
  users: UserOption[]
  onCancel: () => void
  onRetry: () => void
  onSubmit: (values: CaseAssignValues) => Promise<void>
}

function AssignForm({
  caseProfile,
  error,
  isLoadingUsers,
  users,
  onCancel,
  onRetry,
  onSubmit,
}: AssignFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<CaseAssignValues>({
    resolver: zodResolver(caseAssignSchema),
    defaultValues: {
      assignedToId: caseProfile.assignedToId ?? '',
    },
  })

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="p-5 sm:p-6">
        <FormError message={error} />
        <p className="mb-5 text-sm text-slate-500">
          Assign <strong className="text-slate-800">{caseProfile.caseCode}</strong>{' '}
          to an active CRM team member.
        </p>
        <label className="field-label" htmlFor="case-assign-user">
          Assigned staff
        </label>
        <select
          aria-describedby={
            errors.assignedToId ? 'case-assign-user-error' : undefined
          }
          aria-invalid={Boolean(errors.assignedToId)}
          className="field-input"
          disabled={isLoadingUsers || users.length === 0}
          id="case-assign-user"
          {...register('assignedToId')}
        >
          <option value="">Select a team member</option>
          {users.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.fullName} · {formatLabel(staff.role)}
            </option>
          ))}
        </select>
        <FieldError
          id="case-assign-user-error"
          message={errors.assignedToId?.message}
        />
        {isLoadingUsers ? (
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Loading team members…
          </p>
        ) : users.length === 0 ? (
          <button
            className="mt-3 text-sm font-bold text-blue-700 hover:underline"
            onClick={onRetry}
            type="button"
          >
            Retry loading team members
          </button>
        ) : null}
      </div>

      <ModalActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel="Assign case"
        submittingLabel="Assigning…"
      />
    </form>
  )
}

function DetailLoading({
  error,
  onRetry,
}: {
  error: string | null
  onRetry: () => void
}) {
  if (!error) {
    return <LoadingState label="Loading case details…" />
  }

  return (
    <div className="grid min-h-72 place-items-center p-8 text-center">
      <div>
        <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
        <p className="mt-3 text-sm text-rose-700">{error}</p>
        <button
          className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

interface HistoryTimelineProps {
  error: string | null
  items: CaseHistoryItem[]
  isLoading: boolean
  meta: PaginationMeta
  onPageChange: (page: number) => void
  onRetry: () => void
}

function HistoryTimeline({
  error,
  items,
  isLoading,
  meta,
  onPageChange,
  onRetry,
}: HistoryTimelineProps) {
  if (isLoading && items.length === 0) {
    return <LoadingState label="Loading case history…" />
  }

  if (error && items.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center p-8 text-center">
        <div>
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
          <p className="mt-3 text-sm text-rose-700">{error}</p>
          <button
            className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
            onClick={onRetry}
            type="button"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        description="Changes to this case will appear here."
        icon={<FileClock className="h-6 w-6" aria-hidden="true" />}
        title="No history yet"
      />
    )
  }

  return (
    <>
      {error ? (
        <div
          className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800"
          role="alert"
        >
          Refresh failed: {error}
        </div>
      ) : null}
      <ol className="max-h-[calc(100vh-20rem)] overflow-y-auto p-5 sm:p-6">
        {items.map((item, index) => (
          <li className="relative flex gap-4 pb-6 last:pb-0" key={item.id}>
            {index < items.length - 1 ? (
              <span className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-slate-200" />
            ) : null}
            <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 ring-4 ring-white">
              <History className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <p className="font-bold text-slate-900">
                  {formatLabel(item.action)}
                </p>
                <time
                  className="text-xs font-medium text-slate-400"
                  dateTime={item.createdAt}
                >
                  {formatDateTime(item.createdAt)}
                </time>
              </div>
              {item.oldStatus || item.newStatus ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {item.oldStatus ? (
                    <StatusBadge status={item.oldStatus} />
                  ) : null}
                  {item.oldStatus && item.newStatus ? (
                    <span className="text-slate-400">→</span>
                  ) : null}
                  {item.newStatus ? (
                    <StatusBadge status={item.newStatus} />
                  ) : null}
                </div>
              ) : null}
              {item.note ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {item.note}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-400">
                By {item.user?.fullName ?? item.user?.email ?? 'System'}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <Pagination
        isDisabled={isLoading}
        onPageChange={onPageChange}
        page={meta.page}
        totalItems={meta.total}
        totalPages={meta.totalPages}
      />
    </>
  )
}

function FeedbackBanner({
  feedback,
  onDismiss,
}: {
  feedback: Feedback
  onDismiss: () => void
}) {
  const icon: ReactNode =
    feedback.type === 'success' ? (
      <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
    ) : (
      <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
    )

  return (
    <div
      className={cn(
        'mt-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
        feedback.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-800',
      )}
      role={feedback.type === 'error' ? 'alert' : 'status'}
    >
      {icon}
      <span className="flex-1">{feedback.message}</span>
      <button
        className="font-bold underline"
        onClick={onDismiss}
        type="button"
      >
        Dismiss
      </button>
    </div>
  )
}

export function AdminCasesPage() {
  const { user } = useAuth()
  const [cases, setCases] = useState<CaseProfile[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CaseStatus | ''>('')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [lookups, setLookups] = useState<LookupState>(EMPTY_LOOKUPS)
  const [isLoadingLookups, setIsLoadingLookups] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  const [detailTarget, setDetailTarget] = useState<CaseProfile | null>(null)
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [statusTarget, setStatusTarget] = useState<CaseProfile | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<CaseProfile | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)

  const [historyTarget, setHistoryTarget] =
    useState<CaseProfile | null>(null)
  const [historyItems, setHistoryItems] = useState<CaseHistoryItem[]>([])
  const [historyMeta, setHistoryMeta] =
    useState<PaginationMeta>(EMPTY_META)
  const [historyPage, setHistoryPage] = useState(1)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<CaseProfile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const listSequence = useRef(0)
  const lookupSequence = useRef(0)
  const detailSequence = useRef(0)
  const historySequence = useRef(0)

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const loadCases = useCallback(async () => {
    const sequence = ++listSequence.current
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = overdueOnly
        ? await listOverdueCases({ page, limit: PAGE_SIZE })
        : await listCases({
            page,
            limit: PAGE_SIZE,
            search: search || undefined,
            status: status || undefined,
            priority: priority || undefined,
          })

      if (sequence !== listSequence.current) {
        return
      }

      setCases(result.items)
      setMeta(result.meta)
    } catch (error) {
      if (sequence !== listSequence.current) {
        return
      }

      setLoadError(
        getErrorMessage(
          error,
          overdueOnly
            ? 'Overdue cases could not be loaded.'
            : 'Cases could not be loaded.',
        ),
      )
    } finally {
      if (sequence === listSequence.current) {
        setIsLoading(false)
      }
    }
  }, [overdueOnly, page, priority, search, status])

  useEffect(() => {
    void loadCases()
  }, [loadCases])

  const loadLookups = useCallback(async () => {
    const sequence = ++lookupSequence.current
    setIsLoadingLookups(true)
    setLookupError(null)

    const [customerResult, serviceResult, userResult] =
      await Promise.allSettled([
        listCaseCustomers(),
        listCaseServices(),
        canManage ? listAssignableUsers() : Promise.resolve({ users: [] }),
      ])

    if (sequence !== lookupSequence.current) {
      return
    }

    setLookups({
      customers:
        customerResult.status === 'fulfilled'
          ? customerResult.value.items
          : [],
      services:
        serviceResult.status === 'fulfilled'
          ? serviceResult.value.items
          : [],
      users:
        userResult.status === 'fulfilled'
          ? userResult.value.users.filter(
              (teamUser) =>
                teamUser.isActive &&
                assignableUserRoles.some((role) => role === teamUser.role),
            )
          : [],
    })

    const errors = [
      customerResult.status === 'rejected'
        ? getErrorMessage(customerResult.reason, 'customers')
        : null,
      serviceResult.status === 'rejected'
        ? getErrorMessage(serviceResult.reason, 'services')
        : null,
      userResult.status === 'rejected'
        ? getErrorMessage(userResult.reason, 'team members')
        : null,
    ].filter((message): message is string => message !== null)

    setLookupError(
      errors.length > 0
        ? `Some options could not be loaded: ${errors.join('; ')}`
        : null,
    )
    setIsLoadingLookups(false)
  }, [canManage])

  const loadDetail = useCallback(async (target: CaseProfile) => {
    const sequence = ++detailSequence.current
    setIsDetailLoading(true)
    setDetailError(null)
    setCaseDetail(null)

    try {
      const result = await getCase(target.id)

      if (sequence === detailSequence.current) {
        setCaseDetail(result)
      }
    } catch (error) {
      if (sequence === detailSequence.current) {
        setDetailError(
          getErrorMessage(error, 'Case details could not be loaded.'),
        )
      }
    } finally {
      if (sequence === detailSequence.current) {
        setIsDetailLoading(false)
      }
    }
  }, [])

  const loadHistory = useCallback(async () => {
    if (!historyTarget) {
      return
    }

    const sequence = ++historySequence.current
    setIsHistoryLoading(true)
    setHistoryError(null)

    try {
      const result = await getCaseHistory(historyTarget.id, {
        page: historyPage,
        limit: HISTORY_PAGE_SIZE,
      })

      if (sequence === historySequence.current) {
        setHistoryItems(result.items)
        setHistoryMeta(result.meta)
      }
    } catch (error) {
      if (sequence === historySequence.current) {
        setHistoryError(
          getErrorMessage(error, 'Case history could not be loaded.'),
        )
      }
    } finally {
      if (sequence === historySequence.current) {
        setIsHistoryLoading(false)
      }
    }
  }, [historyPage, historyTarget])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const refreshAfterMutation = async () => {
    await loadCases()
  }

  const openCreate = () => {
    setCreateError(null)
    setLookupError(null)
    setIsCreateOpen(true)
    void loadLookups()
  }

  const closeCreate = () => {
    lookupSequence.current += 1
    setIsCreateOpen(false)
    setCreateError(null)
    setIsLoadingLookups(false)
  }

  const handleCreate = async (values: CaseFormValues) => {
    setCreateError(null)

    try {
      await createCase(toCaseCreateInput(values))
      closeCreate()
      setFeedback({
        type: 'success',
        message: 'Case created successfully.',
      })

      if (page !== 1) {
        setPage(1)
      } else {
        await refreshAfterMutation()
      }
    } catch (error) {
      setCreateError(getErrorMessage(error, 'The case could not be created.'))
    }
  }

  const openDetail = (target: CaseProfile) => {
    setDetailTarget(target)
    void loadDetail(target)
  }

  const closeDetail = () => {
    detailSequence.current += 1
    setDetailTarget(null)
    setCaseDetail(null)
    setDetailError(null)
    setIsDetailLoading(false)
  }

  const handleEdit = async (values: CaseEditFormValues) => {
    if (!caseDetail) {
      return
    }

    setDetailError(null)

    try {
      const updated = await updateCase(
        caseDetail.id,
        toCaseUpdateInput(values),
      )
      setCaseDetail((current) =>
        current ? { ...current, ...updated } : current,
      )
      setFeedback({
        type: 'success',
        message: `${updated.caseCode} updated successfully.`,
      })
      await refreshAfterMutation()
    } catch (error) {
      setDetailError(getErrorMessage(error, 'The case could not be updated.'))
    }
  }

  const handleStatusUpdate = async (values: {
    status: CaseStatus
    note: string
  }) => {
    if (!statusTarget) {
      return
    }

    setStatusError(null)

    try {
      const updated = await updateCaseStatus(
        statusTarget.id,
        toCaseStatusUpdateInput(values),
      )
      setStatusTarget(null)
      setFeedback({
        type: 'success',
        message: `${updated.caseCode} moved to ${formatLabel(updated.status)}.`,
      })
      await refreshAfterMutation()
    } catch (error) {
      setStatusError(
        getErrorMessage(error, 'The case status could not be updated.'),
      )
    }
  }

  const loadUsersForAssignment = async () => {
    const sequence = ++lookupSequence.current
    setIsLoadingLookups(true)
    setAssignError(null)

    try {
      const result = await listAssignableUsers()

      if (sequence === lookupSequence.current) {
        setLookups((current) => ({
          ...current,
          users: result.users.filter(
            (teamUser) =>
              teamUser.isActive &&
              assignableUserRoles.some((role) => role === teamUser.role),
          ),
        }))
      }
    } catch (error) {
      if (sequence === lookupSequence.current) {
        setAssignError(
          getErrorMessage(error, 'Team members could not be loaded.'),
        )
      }
    } finally {
      if (sequence === lookupSequence.current) {
        setIsLoadingLookups(false)
      }
    }
  }

  const openAssign = (target: CaseProfile) => {
    setAssignTarget(target)
    setAssignError(null)
    void loadUsersForAssignment()
  }

  const closeAssign = () => {
    lookupSequence.current += 1
    setAssignTarget(null)
    setAssignError(null)
    setIsLoadingLookups(false)
  }

  const handleAssign = async (values: CaseAssignValues) => {
    if (!assignTarget) {
      return
    }

    setAssignError(null)

    try {
      const updated = await assignCase(assignTarget.id, values)
      closeAssign()
      setFeedback({
        type: 'success',
        message: `${updated.caseCode} assigned to ${updated.assignedTo?.fullName ?? 'the selected team member'}.`,
      })
      await refreshAfterMutation()
    } catch (error) {
      setAssignError(getErrorMessage(error, 'The case could not be assigned.'))
    }
  }

  const openHistory = (target: CaseProfile) => {
    historySequence.current += 1
    setHistoryTarget(target)
    setHistoryItems([])
    setHistoryMeta(EMPTY_META)
    setHistoryError(null)
    setHistoryPage(1)
  }

  const closeHistory = () => {
    historySequence.current += 1
    setHistoryTarget(null)
    setHistoryItems([])
    setHistoryError(null)
    setIsHistoryLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    setIsDeleting(true)
    setFeedback(null)

    try {
      const deletedCode = deleteTarget.caseCode
      await deleteCase(deleteTarget.id)
      setDeleteTarget(null)
      setFeedback({
        type: 'success',
        message: `${deletedCode} deleted successfully.`,
      })

      if (cases.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await refreshAfterMutation()
      }
    } catch (error) {
      setDeleteTarget(null)
      setFeedback({
        type: 'error',
        message:
          error instanceof ApiError && error.status === 409
            ? 'This case cannot be deleted because related records exist.'
            : getErrorMessage(error, 'The case could not be deleted.'),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const clearFilters = () => {
    setPage(1)
    setSearch('')
    setSearchInput('')
    setStatus('')
    setPriority('')
    setOverdueOnly(false)
  }

  const submitSearch = () => {
    const nextSearch = searchInput.trim()

    if (page === 1 && search === nextSearch) {
      void loadCases()
      return
    }

    setPage(1)
    setSearch(nextSearch)
  }

  const columns: readonly DataTableColumn<CaseProfile>[] = [
    {
      key: 'caseCode',
      header: 'Case code',
      render: (caseProfile) => (
        <div>
          <p className="font-bold text-slate-900">{caseProfile.caseCode}</p>
          {isOverdue(caseProfile) ? (
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-rose-700">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              Overdue
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      className: 'max-w-64',
      render: (caseProfile) => (
        <span className="block truncate font-semibold text-slate-800">
          {caseProfile.title}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (caseProfile) => (
        <div>
          <p className="font-semibold text-slate-800">
            {caseProfile.customer.fullName}
          </p>
          <p className="text-xs text-slate-400">
            {caseProfile.customer.phone}
          </p>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      className: 'max-w-52',
      render: (caseProfile) => (
        <span className="block truncate">{caseProfile.service.name}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (caseProfile) => <StatusBadge status={caseProfile.status} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (caseProfile) => (
        <PriorityBadge priority={caseProfile.priority} />
      ),
    },
    {
      key: 'assigned',
      header: 'Assigned to',
      render: (caseProfile) => caseProfile.assignedTo?.fullName ?? 'Unassigned',
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (caseProfile) => (
        <span
          className={cn(
            isOverdue(caseProfile) && 'font-bold text-rose-700',
          )}
        >
          {formatDateTime(caseProfile.deadline)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (caseProfile) => (
        <div className="flex justify-end gap-1">
          <button
            aria-label={`View and edit ${caseProfile.caseCode}`}
            className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-50"
            onClick={() => openDetail(caseProfile)}
            title="View / Edit"
            type="button"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label={`Update status for ${caseProfile.caseCode}`}
            className="rounded-lg p-2 text-violet-700 transition hover:bg-violet-50"
            onClick={() => {
              setStatusError(null)
              setStatusTarget(caseProfile)
            }}
            title="Update status"
            type="button"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </button>
          {canManage ? (
            <button
              aria-label={`Assign ${caseProfile.caseCode}`}
              className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50"
              onClick={() => openAssign(caseProfile)}
              title="Assign staff"
              type="button"
            >
              <UserRoundCheck className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
          <button
            aria-label={`View history for ${caseProfile.caseCode}`}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            onClick={() => openHistory(caseProfile)}
            title="View history"
            type="button"
          >
            <History className="h-4 w-4" aria-hidden="true" />
          </button>
          {canManage ? (
            <button
              aria-label={`Delete ${caseProfile.caseCode}`}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setDeleteTarget(caseProfile)}
              title="Delete"
              type="button"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  const hasFilters = Boolean(search || status || priority || overdueOnly)

  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">Case workflow</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Cases
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track client matters, ownership, deadlines and workflow history.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:self-auto"
          onClick={openCreate}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Case
        </button>
      </header>

      {feedback ? (
        <FeedbackBanner
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(16rem,1fr)_13rem_12rem_auto_auto]">
          <SearchInput
            isDisabled={isLoading || overdueOnly}
            label="Search cases"
            onChange={setSearchInput}
            onSubmit={submitSearch}
            placeholder="Search code, title, customer or service…"
            value={searchInput}
          />
          <label>
            <span className="sr-only">Filter by status</span>
            <select
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
              disabled={overdueOnly}
              onChange={(event) => {
                setPage(1)
                setStatus(event.target.value as CaseStatus | '')
              }}
              value={status}
            >
              <option value="">All statuses</option>
              {caseStatuses.map((caseStatus) => (
                <option key={caseStatus} value={caseStatus}>
                  {formatLabel(caseStatus)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by priority</span>
            <select
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
              disabled={overdueOnly}
              onChange={(event) => {
                setPage(1)
                setPriority(event.target.value as Priority | '')
              }}
              value={priority}
            >
              <option value="">All priorities</option>
              {priorities.map((casePriority) => (
                <option key={casePriority} value={casePriority}>
                  {formatLabel(casePriority)}
                </option>
              ))}
            </select>
          </label>
          <button
            aria-pressed={overdueOnly}
            className={cn(
              'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition',
              overdueOnly
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-700',
            )}
            onClick={() => {
              setPage(1)
              setOverdueOnly((current) => !current)
            }}
            type="button"
          >
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {overdueOnly ? 'Showing overdue' : 'View overdue'}
          </button>
          <button
            className="min-h-11 rounded-xl px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!hasFilters}
            onClick={clearFilters}
            type="button"
          >
            Clear filters
          </button>
        </div>

        {overdueOnly ? (
          <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Showing unfinished cases whose deadline has passed.
          </div>
        ) : null}

        {loadError && cases.length === 0 ? (
          <div className="grid min-h-80 place-items-center p-8 text-center">
            <div>
              <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
              <h2 className="mt-4 font-bold text-slate-900">
                Couldn&apos;t load cases
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {loadError}
              </p>
              <button
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                onClick={() => void loadCases()}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        ) : isLoading && cases.length === 0 ? (
          <LoadingState label="Loading cases…" />
        ) : cases.length === 0 ? (
          <EmptyState
            description={
              hasFilters
                ? 'Try changing or clearing the current filters.'
                : 'Create the first case profile to start tracking work.'
            }
            icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
            title={overdueOnly ? 'No overdue cases' : 'No cases found'}
          />
        ) : (
          <>
            {loadError ? (
              <div
                className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800"
                role="alert"
              >
                <span>Refresh failed: {loadError}. Showing cached data.</span>
                <button
                  className="shrink-0 font-bold underline"
                  onClick={() => void loadCases()}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : null}
            <DataTable
              caption={overdueOnly ? 'Overdue cases' : 'Case profiles'}
              columns={columns}
              getRowKey={(caseProfile) => caseProfile.id}
              items={cases}
            />
            <Pagination
              isDisabled={isLoading}
              onPageChange={setPage}
              page={meta.page}
              totalItems={meta.total}
              totalPages={meta.totalPages}
            />
          </>
        )}
      </section>

      <Modal
        isDismissible={!isLoadingLookups}
        isOpen={isCreateOpen}
        onClose={closeCreate}
        size="lg"
        title="Create Case"
        description="Create a case profile using an existing customer and service."
      >
        <CreateCaseForm
          error={createError}
          isLoadingLookups={isLoadingLookups}
          lookupError={lookupError}
          lookups={lookups}
          onCancel={closeCreate}
          onSubmit={handleCreate}
          showAssignee={canManage}
        />
      </Modal>

      <Modal
        isDismissible={!isDetailLoading}
        isOpen={detailTarget !== null}
        onClose={closeDetail}
        size="xl"
        title={
          detailTarget ? `View / Edit ${detailTarget.caseCode}` : 'Case details'
        }
        description="Review immutable associations and update basic case information."
      >
        {caseDetail ? (
          <CaseDetailForm
            caseDetail={caseDetail}
            error={detailError}
            onCancel={closeDetail}
            onSubmit={handleEdit}
          />
        ) : (
          <DetailLoading
            error={detailError}
            onRetry={() => {
              if (detailTarget) {
                void loadDetail(detailTarget)
              }
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={statusTarget !== null}
        onClose={() => {
          setStatusTarget(null)
          setStatusError(null)
        }}
        size="md"
        title={
          statusTarget
            ? `Update status · ${statusTarget.caseCode}`
            : 'Update case status'
        }
      >
        {statusTarget ? (
          <StatusForm
            caseProfile={statusTarget}
            error={statusError}
            onCancel={() => {
              setStatusTarget(null)
              setStatusError(null)
            }}
            onSubmit={handleStatusUpdate}
          />
        ) : null}
      </Modal>

      <Modal
        isDismissible={!isLoadingLookups}
        isOpen={assignTarget !== null}
        onClose={closeAssign}
        size="sm"
        title="Assign Staff"
      >
        {assignTarget ? (
          <AssignForm
            caseProfile={assignTarget}
            error={assignError}
            isLoadingUsers={isLoadingLookups}
            onCancel={closeAssign}
            onRetry={() => void loadUsersForAssignment()}
            onSubmit={handleAssign}
            users={lookups.users}
          />
        ) : null}
      </Modal>

      <Modal
        isOpen={historyTarget !== null}
        onClose={closeHistory}
        size="lg"
        title={
          historyTarget
            ? `History · ${historyTarget.caseCode}`
            : 'Case history'
        }
        description="Newest workflow activity appears first."
      >
        <HistoryTimeline
          error={historyError}
          isLoading={isHistoryLoading}
          items={historyItems}
          meta={historyMeta}
          onPageChange={setHistoryPage}
          onRetry={() => void loadHistory()}
        />
      </Modal>

      <ConfirmDialog
        isLoading={isDeleting}
        isOpen={deleteTarget !== null}
        message={`Delete case ${deleteTarget?.caseCode ?? ''}? This action cannot be undone.`}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={() => void handleDelete()}
        title="Delete case"
      />
    </div>
  )
}
