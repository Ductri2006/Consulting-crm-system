import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  SearchX,
  Trash2,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import {
  appointmentFormSchema,
  appointmentMethods,
  appointmentStatuses,
  appointmentStatusTransitions,
  appointmentStatusUpdateSchema,
  createAppointment,
  deleteAppointment,
  getAppointment,
  listAppointmentAssignableUsers,
  listAppointmentCases,
  listAppointmentCustomers,
  listAppointments,
  listTodayAppointments,
  toAppointmentCreateInput,
  toAppointmentStatusUpdateInput,
  toAppointmentUpdateInput,
  updateAppointment,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentDetail,
  type AppointmentFormValues,
  type AppointmentMethod,
  type AppointmentStatus,
  type AppointmentStatusUpdateValues,
  type CaseOption,
  type CustomerOption,
  type PaginationMeta,
  type UserOption,
} from '../../features/appointments'
import { useAuth } from '../../features/auth'
import { cn } from '../../utils/cn'

const PAGE_SIZE = 10

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
}

const EMPTY_FORM: AppointmentFormValues = {
  customerId: '',
  caseProfileId: '',
  staffId: '',
  appointmentDate: '',
  startTime: '',
  endTime: '',
  method: 'OFFLINE',
  note: '',
}

interface Feedback {
  type: 'success' | 'error'
  message: string
}

interface LookupState {
  customers: CustomerOption[]
  cases: CaseOption[]
  users: UserOption[]
}

const EMPTY_LOOKUPS: LookupState = {
  customers: [],
  cases: [],
  users: [],
}

const formatLabel = (value: string): string =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

const toDateInputValue = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

const getTodayDateInputValue = (): string => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

const formatDate = (value: string): string => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const formatTimeRange = (appointment: Appointment): string =>
  appointment.endTime
    ? `${appointment.startTime} - ${appointment.endTime}`
    : appointment.startTime

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

function FeedbackBanner({
  feedback,
  onDismiss,
}: {
  feedback: Feedback
  onDismiss: () => void
}) {
  const isSuccess = feedback.type === 'success'

  return (
    <div
      className={cn(
        'mt-5 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm',
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-700',
      )}
      role="status"
    >
      <span className="flex items-start gap-2">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden="true" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden="true" />
        )}
        {feedback.message}
      </span>
      <button
        className="shrink-0 text-xs font-bold uppercase tracking-wide"
        onClick={onDismiss}
        type="button"
      >
        Dismiss
      </button>
    </div>
  )
}

function ModalActions({
  isSubmitting,
  onCancel,
  submitLabel,
  submittingLabel = 'Saving...',
}: {
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
        Cancel
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

function AppointmentMethodBadge({
  method,
}: {
  method: AppointmentMethod
}) {
  const styles: Record<AppointmentMethod, string> = {
    OFFLINE: 'bg-slate-100 text-slate-700 ring-slate-500/20',
    ONLINE: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    PHONE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        styles[method],
      )}
    >
      {formatLabel(method)}
    </span>
  )
}

function AppointmentForm({
  error,
  initialValues,
  canAssign,
  isCustomerLocked,
  isLoadingLookups,
  lookupError,
  lookups,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  error: string | null
  initialValues: AppointmentFormValues
  canAssign: boolean
  isCustomerLocked: boolean
  isLoadingLookups: boolean
  lookupError: string | null
  lookups: LookupState
  onCancel: () => void
  onSubmit: (values: AppointmentFormValues) => Promise<void>
  submitLabel: string
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: initialValues,
  })
  const selectedCustomerId = watch('customerId')
  const selectedCaseId = watch('caseProfileId')
  const caseOptions = useMemo(
    () =>
      lookups.cases.filter(
        (caseProfile) =>
          !caseProfile.customerId ||
          !selectedCustomerId ||
          caseProfile.customerId === selectedCustomerId ||
          caseProfile.id === selectedCaseId,
      ),
    [lookups.cases, selectedCaseId, selectedCustomerId],
  )

  useEffect(() => {
    reset(initialValues)
  }, [initialValues, reset])

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
            Loading appointment options...
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="appointment-customer">
              Customer <span aria-hidden="true">*</span>
            </label>
            {isCustomerLocked ? (
              <>
                <input type="hidden" {...register('customerId')} />
                <select
                  className="field-input"
                  disabled
                  id="appointment-customer"
                  value={initialValues.customerId}
                >
                  {lookups.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName} - {customer.phone}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <select
                aria-describedby={
                  errors.customerId ? 'appointment-customer-error' : undefined
                }
                aria-invalid={Boolean(errors.customerId)}
                className="field-input"
                disabled={isLoadingLookups}
                id="appointment-customer"
                {...register('customerId')}
              >
                <option value="">Select a customer</option>
                {lookups.customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName} - {customer.phone}
                  </option>
                ))}
              </select>
            )}
            <FieldError
              id="appointment-customer-error"
              message={errors.customerId?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="appointment-case">
              Case
            </label>
            <select
              className="field-input"
              disabled={isLoadingLookups}
              id="appointment-case"
              {...register('caseProfileId')}
            >
              <option value="">No linked case</option>
              {caseOptions.map((caseProfile) => (
                <option key={caseProfile.id} value={caseProfile.id}>
                  {caseProfile.caseCode} - {caseProfile.title}
                </option>
              ))}
            </select>
          </div>

          {canAssign ? (
            <div>
              <label className="field-label" htmlFor="appointment-staff">
                Staff
              </label>
              <select
                className="field-input"
                disabled={isLoadingLookups}
                id="appointment-staff"
                {...register('staffId')}
              >
                <option value="">Unassigned</option>
                {lookups.users.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName} - {formatLabel(staff.role)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" {...register('staffId')} />
          )}

          <div>
            <label className="field-label" htmlFor="appointment-method">
              Method
            </label>
            <select
              className="field-input"
              id="appointment-method"
              {...register('method')}
            >
              {appointmentMethods.map((method) => (
                <option key={method} value={method}>
                  {formatLabel(method)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="appointment-date">
              Date <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={
                errors.appointmentDate
                  ? 'appointment-date-error'
                  : undefined
              }
              aria-invalid={Boolean(errors.appointmentDate)}
              className="field-input"
              id="appointment-date"
              type="date"
              {...register('appointmentDate')}
            />
            <FieldError
              id="appointment-date-error"
              message={errors.appointmentDate?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="appointment-start">
                Start <span aria-hidden="true">*</span>
              </label>
              <input
                aria-describedby={
                  errors.startTime ? 'appointment-start-error' : undefined
                }
                aria-invalid={Boolean(errors.startTime)}
                className="field-input"
                id="appointment-start"
                type="time"
                {...register('startTime')}
              />
              <FieldError
                id="appointment-start-error"
                message={errors.startTime?.message}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="appointment-end">
                End
              </label>
              <input
                aria-describedby={
                  errors.endTime ? 'appointment-end-error' : undefined
                }
                aria-invalid={Boolean(errors.endTime)}
                className="field-input"
                id="appointment-end"
                type="time"
                {...register('endTime')}
              />
              <FieldError
                id="appointment-end-error"
                message={errors.endTime?.message}
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="appointment-note">
              Note
            </label>
            <textarea
              className="field-input min-h-24 resize-y"
              id="appointment-note"
              rows={3}
              {...register('note')}
            />
            <FieldError
              id="appointment-note-error"
              message={errors.note?.message}
            />
          </div>
        </div>
      </div>

      <ModalActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel={submitLabel}
      />
    </form>
  )
}

function StatusForm({
  appointment,
  error,
  onCancel,
  onSubmit,
}: {
  appointment: Appointment
  error: string | null
  onCancel: () => void
  onSubmit: (values: AppointmentStatusUpdateValues) => Promise<void>
}) {
  const defaultStatus =
    appointmentStatusTransitions[appointment.status][0] ??
    appointmentStatuses.find((status) => status !== appointment.status) ??
    appointment.status
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<AppointmentStatusUpdateValues>({
    resolver: zodResolver(appointmentStatusUpdateSchema),
    defaultValues: {
      status: defaultStatus,
    },
  })

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="p-5 sm:p-6">
        <FormError message={error} />
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-bold">Current status</p>
          <div className="mt-2">
            <StatusBadge status={appointment.status} />
          </div>
        </div>
        <label className="field-label" htmlFor="appointment-status">
          New status
        </label>
        <select
          aria-describedby={
            errors.status ? 'appointment-status-error' : undefined
          }
          aria-invalid={Boolean(errors.status)}
          className="field-input"
          id="appointment-status"
          {...register('status')}
        >
          {appointmentStatuses
            .filter((status) => status !== appointment.status)
            .map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
        </select>
        <FieldError
          id="appointment-status-error"
          message={errors.status?.message}
        />
      </div>

      <ModalActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel="Update status"
      />
    </form>
  )
}

export function AdminAppointmentsPage() {
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState<AppointmentStatus | ''>('')
  const [method, setMethod] = useState<AppointmentMethod | ''>('')
  const [staffId, setStaffId] = useState('')
  const [date, setDate] = useState('')
  const [todayOnly, setTodayOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [lookups, setLookups] = useState<LookupState>(EMPTY_LOOKUPS)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isLoadingLookups, setIsLoadingLookups] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null)
  const [appointmentDetail, setAppointmentDetail] =
    useState<AppointmentDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState<Appointment | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const listSequence = useRef(0)
  const lookupSequence = useRef(0)
  const detailSequence = useRef(0)

  const loadAppointments = useCallback(async () => {
    const sequence = ++listSequence.current
    setIsLoading(true)
    setLoadError(null)

    try {
      if (todayOnly) {
        const result = await listTodayAppointments({ staffId })

        if (sequence === listSequence.current) {
          setAppointments(result.items)
          setMeta({
            page: 1,
            limit: result.items.length || PAGE_SIZE,
            total: result.items.length,
            totalPages: result.items.length > 0 ? 1 : 0,
          })
        }

        return
      }

      const result = await listAppointments({
        page,
        limit: PAGE_SIZE,
        search,
        status: status || undefined,
        method: method || undefined,
        staffId,
        date,
      })

      if (sequence === listSequence.current) {
        setAppointments(result.items)
        setMeta(result.meta)
      }
    } catch (error) {
      if (sequence === listSequence.current) {
        setLoadError(
          getErrorMessage(error, 'Appointments could not be loaded.'),
        )
      }
    } finally {
      if (sequence === listSequence.current) {
        setIsLoading(false)
      }
    }
  }, [date, method, page, search, staffId, status, todayOnly])

  useEffect(() => {
    void loadAppointments()
  }, [loadAppointments])

  const loadLookups = async () => {
    const sequence = ++lookupSequence.current
    setIsLoadingLookups(true)
    setLookupError(null)

    const [customersResult, casesResult, usersResult] =
      await Promise.allSettled([
        listAppointmentCustomers(),
        listAppointmentCases(),
        canManage
          ? listAppointmentAssignableUsers()
          : Promise.resolve({ users: [] as UserOption[] }),
      ])

    if (sequence !== lookupSequence.current) {
      return
    }

    setLookups({
      customers:
        customersResult.status === 'fulfilled'
          ? customersResult.value.items
          : [],
      cases:
        casesResult.status === 'fulfilled' ? casesResult.value.items : [],
      users:
        usersResult.status === 'fulfilled'
          ? usersResult.value.users.filter((teamUser) => teamUser.isActive)
          : [],
    })

    const warnings = [
      customersResult.status === 'rejected'
        ? getErrorMessage(customersResult.reason, 'Customers could not load.')
        : '',
      casesResult.status === 'rejected'
        ? getErrorMessage(casesResult.reason, 'Cases could not load.')
        : '',
      usersResult.status === 'rejected'
        ? getErrorMessage(usersResult.reason, 'Staff options could not load.')
        : '',
    ].filter(Boolean)

    setLookupError(warnings.length > 0 ? warnings.join(' ') : null)
    setIsLoadingLookups(false)
  }

  const refreshAfterMutation = async () => {
    await loadAppointments()
  }

  const openCreate = () => {
    setCreateError(null)
    setIsCreateOpen(true)
    void loadLookups()
  }

  const closeCreate = () => {
    lookupSequence.current += 1
    setIsCreateOpen(false)
    setCreateError(null)
    setIsLoadingLookups(false)
  }

  const loadDetail = async (target: Appointment) => {
    const sequence = ++detailSequence.current
    setIsDetailLoading(true)
    setDetailError(null)
    setAppointmentDetail(null)

    try {
      const result = await getAppointment(target.id)

      if (sequence === detailSequence.current) {
        setAppointmentDetail(result)
      }
    } catch (error) {
      if (sequence === detailSequence.current) {
        setDetailError(
          getErrorMessage(error, 'Appointment details could not be loaded.'),
        )
      }
    } finally {
      if (sequence === detailSequence.current) {
        setIsDetailLoading(false)
      }
    }
  }

  const openDetail = (target: Appointment) => {
    setDetailTarget(target)
    void loadLookups()
    void loadDetail(target)
  }

  const closeDetail = () => {
    detailSequence.current += 1
    lookupSequence.current += 1
    setDetailTarget(null)
    setAppointmentDetail(null)
    setDetailError(null)
    setIsDetailLoading(false)
    setIsLoadingLookups(false)
  }

  const handleCreate = async (values: AppointmentFormValues) => {
    setCreateError(null)

    try {
      const created = await createAppointment(
        toAppointmentCreateInput(values),
      )
      closeCreate()
      setFeedback({
        type: 'success',
        message: `Appointment for ${created.customer.fullName} created.`,
      })
      await refreshAfterMutation()
    } catch (error) {
      setCreateError(
        getErrorMessage(error, 'The appointment could not be created.'),
      )
    }
  }

  const handleEdit = async (values: AppointmentFormValues) => {
    if (!appointmentDetail) {
      return
    }

    setDetailError(null)

    try {
      const updated = await updateAppointment(
        appointmentDetail.id,
        toAppointmentUpdateInput(values),
      )
      setAppointmentDetail(updated)
      setFeedback({
        type: 'success',
        message: `Appointment for ${updated.customer.fullName} updated.`,
      })
      await refreshAfterMutation()
    } catch (error) {
      setDetailError(
        getErrorMessage(error, 'The appointment could not be updated.'),
      )
    }
  }

  const handleStatusUpdate = async (
    values: AppointmentStatusUpdateValues,
  ) => {
    if (!statusTarget) {
      return
    }

    setStatusError(null)

    try {
      const updated = await updateAppointmentStatus(
        statusTarget.id,
        toAppointmentStatusUpdateInput(values),
      )
      setStatusTarget(null)
      setFeedback({
        type: 'success',
        message: `Appointment moved to ${formatLabel(updated.status)}.`,
      })
      await refreshAfterMutation()
    } catch (error) {
      setStatusError(
        getErrorMessage(
          error,
          'The appointment status could not be updated.',
        ),
      )
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    setIsDeleting(true)
    setFeedback(null)

    try {
      const customerName = deleteTarget.customer.fullName
      await deleteAppointment(deleteTarget.id)
      setDeleteTarget(null)
      setFeedback({
        type: 'success',
        message: `Appointment for ${customerName} deleted.`,
      })

      if (!todayOnly && appointments.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await refreshAfterMutation()
      }
    } catch (error) {
      setDeleteTarget(null)
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'The appointment could not be deleted.',
        ),
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
    setMethod('')
    setStaffId('')
    setDate('')
    setTodayOnly(false)
  }

  const submitSearch = () => {
    const nextSearch = searchInput.trim()

    if (page === 1 && search === nextSearch) {
      void loadAppointments()
      return
    }

    setPage(1)
    setSearch(nextSearch)
  }

  const createInitialValues = EMPTY_FORM
  const detailInitialValues: AppointmentFormValues = appointmentDetail
    ? {
        customerId: appointmentDetail.customerId,
        caseProfileId: appointmentDetail.caseProfileId ?? '',
        staffId: appointmentDetail.staffId ?? '',
        appointmentDate: toDateInputValue(appointmentDetail.appointmentDate),
        startTime: appointmentDetail.startTime,
        endTime: appointmentDetail.endTime ?? '',
        method: appointmentDetail.method,
        note: appointmentDetail.note ?? '',
      }
    : EMPTY_FORM

  const hasFilters = Boolean(
    search || status || method || staffId || date || todayOnly,
  )

  const columns: readonly DataTableColumn<Appointment>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (appointment) => (
        <span className="font-semibold text-slate-800">
          {formatDate(appointment.appointmentDate)}
        </span>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      render: (appointment) => formatTimeRange(appointment),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (appointment) => (
        <div>
          <p className="font-semibold text-slate-800">
            {appointment.customer.fullName}
          </p>
          <p className="text-xs text-slate-400">
            {appointment.customer.phone}
          </p>
        </div>
      ),
    },
    {
      key: 'case',
      header: 'Case',
      className: 'max-w-56',
      render: (appointment) =>
        appointment.caseProfile ? (
          <div>
            <p className="font-semibold text-slate-800">
              {appointment.caseProfile.caseCode}
            </p>
            <p className="truncate text-xs text-slate-400">
              {appointment.caseProfile.title}
            </p>
          </div>
        ) : (
          'No case'
        ),
    },
    {
      key: 'staff',
      header: 'Staff',
      render: (appointment) => appointment.staff?.fullName ?? 'Unassigned',
    },
    {
      key: 'method',
      header: 'Method',
      render: (appointment) => (
        <AppointmentMethodBadge method={appointment.method} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (appointment) => <StatusBadge status={appointment.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (appointment) => (
        <div className="flex justify-end gap-1">
          <button
            aria-label={`View and edit appointment for ${appointment.customer.fullName}`}
            className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-50"
            onClick={() => openDetail(appointment)}
            title="View / Edit"
            type="button"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label={`Update status for appointment with ${appointment.customer.fullName}`}
            className="rounded-lg p-2 text-violet-700 transition hover:bg-violet-50"
            onClick={() => {
              setStatusError(null)
              setStatusTarget(appointment)
            }}
            title="Update status"
            type="button"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </button>
          {canManage ? (
            <button
              aria-label={`Delete appointment for ${appointment.customer.fullName}`}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setDeleteTarget(appointment)}
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

  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Appointment schedule
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Appointments
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Coordinate consultation dates, meeting channels and team ownership.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:self-auto"
          onClick={openCreate}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Appointment
        </button>
      </header>

      {feedback ? (
        <FeedbackBanner
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[minmax(16rem,1fr)_11rem_11rem_12rem_12rem_auto_auto]">
          <SearchInput
            isDisabled={isLoading || todayOnly}
            label="Search appointments"
            onChange={setSearchInput}
            onSubmit={submitSearch}
            placeholder="Search customer, phone or note..."
            value={searchInput}
          />
          <input
            aria-label="Filter appointment date"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
            disabled={todayOnly}
            onChange={(event) => {
              setPage(1)
              setDate(event.target.value)
            }}
            type="date"
            value={date}
          />
          <select
            aria-label="Filter appointment status"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
            disabled={todayOnly}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value as AppointmentStatus | '')
            }}
            value={status}
          >
            <option value="">All statuses</option>
            {appointmentStatuses.map((appointmentStatus) => (
              <option key={appointmentStatus} value={appointmentStatus}>
                {formatLabel(appointmentStatus)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter appointment method"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
            disabled={todayOnly}
            onChange={(event) => {
              setPage(1)
              setMethod(event.target.value as AppointmentMethod | '')
            }}
            value={method}
          >
            <option value="">All methods</option>
            {appointmentMethods.map((appointmentMethod) => (
              <option key={appointmentMethod} value={appointmentMethod}>
                {formatLabel(appointmentMethod)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter appointment staff"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => {
              setPage(1)
              setStaffId(event.target.value)
            }}
            onFocus={() => {
              if (lookups.users.length === 0 && !isLoadingLookups) {
                void loadLookups()
              }
            }}
            value={staffId}
          >
            <option value="">All staff</option>
            {lookups.users.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.fullName}
              </option>
            ))}
          </select>
          <button
            aria-pressed={todayOnly}
            className={cn(
              'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition',
              todayOnly
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700',
            )}
            onClick={() => {
              setPage(1)
              setDate(todayOnly ? '' : getTodayDateInputValue())
              setTodayOnly((current) => !current)
            }}
            type="button"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Today
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

        {lookupError ? (
          <div
            className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800"
            role="alert"
          >
            {lookupError}
          </div>
        ) : null}

        {todayOnly ? (
          <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-800">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Showing active appointments scheduled for today.
          </div>
        ) : null}

        {loadError && appointments.length === 0 ? (
          <div className="grid min-h-80 place-items-center p-8 text-center">
            <div>
              <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
              <h2 className="mt-4 font-bold text-slate-900">
                Couldn&apos;t load appointments
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {loadError}
              </p>
              <button
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                onClick={() => void loadAppointments()}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        ) : isLoading && appointments.length === 0 ? (
          <LoadingState label="Loading appointments..." />
        ) : appointments.length === 0 ? (
          <EmptyState
            description={
              hasFilters
                ? 'Try changing or clearing the current filters.'
                : 'Create the first appointment to start coordinating schedules.'
            }
            icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
            title="No appointments found"
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
                  onClick={() => void loadAppointments()}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : null}
            <DataTable
              caption="Appointments"
              columns={columns}
              getRowKey={(appointment) => appointment.id}
              items={appointments}
            />
            <Pagination
              isDisabled={isLoading || todayOnly}
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
        title="Create Appointment"
      >
        <AppointmentForm
          canAssign={canManage}
          error={createError}
          initialValues={createInitialValues}
          isCustomerLocked={false}
          isLoadingLookups={isLoadingLookups}
          lookupError={lookupError}
          lookups={lookups}
          onCancel={closeCreate}
          onSubmit={handleCreate}
          submitLabel="Create appointment"
        />
      </Modal>

      <Modal
        isDismissible={!isDetailLoading}
        isOpen={detailTarget !== null}
        onClose={closeDetail}
        size="lg"
        title={
          detailTarget
            ? `View / Edit ${detailTarget.customer.fullName}`
            : 'Appointment details'
        }
      >
        {appointmentDetail ? (
          <AppointmentForm
            canAssign={canManage}
            error={detailError}
            initialValues={detailInitialValues}
            isCustomerLocked
            isLoadingLookups={isLoadingLookups}
            lookupError={lookupError}
            lookups={lookups}
            onCancel={closeDetail}
            onSubmit={handleEdit}
            submitLabel="Save changes"
          />
        ) : (
          <div className="p-6">
            {detailError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {detailError}
              </div>
            ) : (
              <LoadingState label="Loading appointment details..." />
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={statusTarget !== null}
        onClose={() => {
          setStatusTarget(null)
          setStatusError(null)
        }}
        size="sm"
        title="Update Appointment Status"
      >
        {statusTarget ? (
          <StatusForm
            appointment={statusTarget}
            error={statusError}
            onCancel={() => {
              setStatusTarget(null)
              setStatusError(null)
            }}
            onSubmit={handleStatusUpdate}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        isLoading={isDeleting}
        isOpen={deleteTarget !== null}
        message={`Delete appointment for ${deleteTarget?.customer.fullName ?? ''}? This action cannot be undone.`}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={() => void handleDelete()}
        title="Delete appointment"
      />
    </div>
  )
}
