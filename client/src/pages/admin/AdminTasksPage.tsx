import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  RefreshCw,
  SearchX,
  Trash2,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
  createTask,
  deleteTask,
  getTask,
  listOverdueTasks,
  listTaskAssignableUsers,
  listTaskCases,
  listTasks,
  priorities,
  taskFormSchema,
  taskStatuses,
  taskStatusTransitions,
  taskStatusUpdateSchema,
  toDateTimeLocalValue,
  toTaskCreateInput,
  toTaskStatusUpdateInput,
  toTaskUpdateInput,
  updateTask,
  updateTaskStatus,
  type CaseOption,
  type PaginationMeta,
  type Priority,
  type Task,
  type TaskDetail,
  type TaskFormValues,
  type TaskStatus,
  type TaskStatusUpdateValues,
  type UserOption,
} from '../../features/tasks'
import { formatDateTime as formatLocalizedDateTime } from '../../i18n/format'
import { getStatusLabel } from '../../i18n/statusLabels'
import { translateValidationMessage } from '../../i18n/validationMessages'
import { cn } from '../../utils/cn'

const PAGE_SIZE = 10

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
}

const EMPTY_FORM: TaskFormValues = {
  title: '',
  description: '',
  caseProfileId: '',
  assignedToId: '',
  priority: 'MEDIUM',
  deadline: '',
}

interface Feedback {
  type: 'success' | 'error'
  message: string
}

interface LookupState {
  cases: CaseOption[]
  users: UserOption[]
}

const EMPTY_LOOKUPS: LookupState = {
  cases: [],
  users: [],
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

const isTaskOverdue = (task: Task): boolean =>
  Boolean(
    task.deadline &&
      new Date(task.deadline).getTime() < Date.now() &&
      task.status !== 'DONE' &&
      task.status !== 'CANCELLED',
  )

function FieldError({
  id,
  message,
}: {
  id: string
  message?: string
}) {
  const { t } = useTranslation()

  return message ? (
    <p className="field-error" id={id}>
      {translateValidationMessage(t, message)}
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
  const { t } = useTranslation()
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
        {t('common.close')}
      </button>
    </div>
  )
}

function ModalActions({
  isSubmitting,
  onCancel,
  submitLabel,
  submittingLabel,
}: {
  isSubmitting: boolean
  onCancel: () => void
  submitLabel: string
  submittingLabel?: string
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
      <button
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        disabled={isSubmitting}
        onClick={onCancel}
        type="button"
      >
        {t('common.cancel')}
      </button>
      <button
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (submittingLabel ?? t('admin.workspaceSettings.saving')) : submitLabel}
      </button>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useTranslation()
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
      {getStatusLabel(t, 'priority', priority)}
    </span>
  )
}

function TaskForm({
  canAssign,
  error,
  initialValues,
  isLoadingLookups,
  lookupError,
  lookups,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  canAssign: boolean
  error: string | null
  initialValues: TaskFormValues
  isLoadingLookups: boolean
  lookupError: string | null
  lookups: LookupState
  onCancel: () => void
  onSubmit: (values: TaskFormValues) => Promise<void>
  submitLabel: string
}) {
  const { t } = useTranslation()
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: initialValues,
  })

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
            {t('admin.tasks.loadingOptions')}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="task-title">
              {t('admin.tasks.titleField')} <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={errors.title ? 'task-title-error' : undefined}
              aria-invalid={Boolean(errors.title)}
              className="field-input"
              id="task-title"
              {...register('title')}
            />
            <FieldError id="task-title-error" message={errors.title?.message} />
          </div>

          <div>
            <label className="field-label" htmlFor="task-case">
              {t('navigation.cases')}
            </label>
            <select
              className="field-input"
              disabled={isLoadingLookups}
              id="task-case"
              {...register('caseProfileId')}
            >
              <option value="">{t('admin.appointments.noLinkedCase')}</option>
              {lookups.cases.map((caseProfile) => (
                <option key={caseProfile.id} value={caseProfile.id}>
                  {caseProfile.caseCode} - {caseProfile.title}
                </option>
              ))}
            </select>
          </div>

          {canAssign ? (
            <div>
              <label className="field-label" htmlFor="task-assignee">
                {t('admin.tasks.assignedTo')}
              </label>
              <select
                className="field-input"
                disabled={isLoadingLookups}
                id="task-assignee"
                {...register('assignedToId')}
              >
                <option value="">{t('common.notAssigned')}</option>
                {lookups.users.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName} - {getStatusLabel(t, 'role', staff.role)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" {...register('assignedToId')} />
          )}

          <div>
            <label className="field-label" htmlFor="task-priority">
              {t('admin.tasks.priority')}
            </label>
            <select
              className="field-input"
              id="task-priority"
              {...register('priority')}
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {getStatusLabel(t, 'priority', priority)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="task-deadline">
              {t('admin.tasks.deadline')}
            </label>
            <input
              aria-describedby={
                errors.deadline ? 'task-deadline-error' : undefined
              }
              aria-invalid={Boolean(errors.deadline)}
              className="field-input"
              id="task-deadline"
              type="datetime-local"
              {...register('deadline')}
            />
            <FieldError
              id="task-deadline-error"
              message={errors.deadline?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="task-description">
              {t('admin.tasks.descriptionField')}
            </label>
            <textarea
              className="field-input min-h-28 resize-y"
              id="task-description"
              rows={4}
              {...register('description')}
            />
            <FieldError
              id="task-description-error"
              message={errors.description?.message}
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
  error,
  onCancel,
  onSubmit,
  task,
}: {
  error: string | null
  onCancel: () => void
  onSubmit: (values: TaskStatusUpdateValues) => Promise<void>
  task: Task
}) {
  const { t } = useTranslation()
  const defaultStatus =
    taskStatusTransitions[task.status][0] ??
    taskStatuses.find((status) => status !== task.status) ??
    task.status
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<TaskStatusUpdateValues>({
    resolver: zodResolver(taskStatusUpdateSchema),
    defaultValues: {
      status: defaultStatus,
    },
  })

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="p-5 sm:p-6">
        <FormError message={error} />
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-bold">{t('admin.tasks.currentStatus')}</p>
          <div className="mt-2">
            <StatusBadge namespace="task" status={task.status} />
          </div>
        </div>
        <label className="field-label" htmlFor="task-status">
          {t('admin.tasks.newStatus')}
        </label>
        <select
          aria-describedby={errors.status ? 'task-status-error' : undefined}
          aria-invalid={Boolean(errors.status)}
          className="field-input"
          id="task-status"
          {...register('status')}
        >
          {taskStatuses
            .filter((status) => status !== task.status)
            .map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(t, 'task', status)}
              </option>
            ))}
        </select>
        <FieldError id="task-status-error" message={errors.status?.message} />
      </div>

      <ModalActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel={t('admin.tasks.updateStatus')}
      />
    </form>
  )
}

export function AdminTasksPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const [tasks, setTasks] = useState<Task[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [assignedToId, setAssignedToId] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [lookups, setLookups] = useState<LookupState>(EMPTY_LOOKUPS)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isLoadingLookups, setIsLoadingLookups] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [detailTarget, setDetailTarget] = useState<Task | null>(null)
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState<Task | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const listSequence = useRef(0)
  const lookupSequence = useRef(0)
  const detailSequence = useRef(0)

  const loadTasks = useCallback(async () => {
    const sequence = ++listSequence.current
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = overdueOnly
        ? await listOverdueTasks({
            page,
            limit: PAGE_SIZE,
            assignedToId,
          })
        : await listTasks({
            page,
            limit: PAGE_SIZE,
            search,
            status: status || undefined,
            priority: priority || undefined,
            assignedToId,
          })

      if (sequence === listSequence.current) {
        setTasks(result.items)
        setMeta(result.meta)
      }
    } catch (error) {
      if (sequence === listSequence.current) {
        setLoadError(getErrorMessage(error, t('admin.tasks.loadError')))
      }
    } finally {
      if (sequence === listSequence.current) {
        setIsLoading(false)
      }
    }
  }, [assignedToId, overdueOnly, page, priority, search, status, t])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  const loadLookups = async () => {
    const sequence = ++lookupSequence.current
    setIsLoadingLookups(true)
    setLookupError(null)

    const [casesResult, usersResult] = await Promise.allSettled([
      listTaskCases(),
      canManage
        ? listTaskAssignableUsers()
        : Promise.resolve({ users: [] as UserOption[] }),
    ])

    if (sequence !== lookupSequence.current) {
      return
    }

    setLookups({
      cases: casesResult.status === 'fulfilled' ? casesResult.value.items : [],
      users:
        usersResult.status === 'fulfilled'
          ? usersResult.value.users.filter((teamUser) => teamUser.isActive)
          : [],
    })

    const warnings = [
      casesResult.status === 'rejected'
        ? getErrorMessage(casesResult.reason, t('admin.appointments.casesLoadError'))
        : '',
      usersResult.status === 'rejected'
        ? getErrorMessage(usersResult.reason, t('admin.tasks.assigneesLoadError'))
        : '',
    ].filter(Boolean)

    setLookupError(warnings.length > 0 ? warnings.join(' ') : null)
    setIsLoadingLookups(false)
  }

  const refreshAfterMutation = async () => {
    await loadTasks()
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

  const loadDetail = async (target: Task) => {
    const sequence = ++detailSequence.current
    setIsDetailLoading(true)
    setDetailError(null)
    setTaskDetail(null)

    try {
      const result = await getTask(target.id)

      if (sequence === detailSequence.current) {
        setTaskDetail(result)
      }
    } catch (error) {
      if (sequence === detailSequence.current) {
        setDetailError(getErrorMessage(error, t('admin.tasks.detailsLoadError')))
      }
    } finally {
      if (sequence === detailSequence.current) {
        setIsDetailLoading(false)
      }
    }
  }

  const openDetail = (target: Task) => {
    setDetailTarget(target)
    void loadLookups()
    void loadDetail(target)
  }

  const closeDetail = () => {
    detailSequence.current += 1
    lookupSequence.current += 1
    setDetailTarget(null)
    setTaskDetail(null)
    setDetailError(null)
    setIsDetailLoading(false)
    setIsLoadingLookups(false)
  }

  const handleCreate = async (values: TaskFormValues) => {
    setCreateError(null)

    try {
      const created = await createTask(toTaskCreateInput(values))
      closeCreate()
      setFeedback({
        type: 'success',
        message: t('admin.tasks.createdFeedback', { title: created.title }),
      })
      await refreshAfterMutation()
    } catch (error) {
      setCreateError(getErrorMessage(error, t('admin.tasks.createError')))
    }
  }

  const handleEdit = async (values: TaskFormValues) => {
    if (!taskDetail) {
      return
    }

    setDetailError(null)

    try {
      const updated = await updateTask(
        taskDetail.id,
        toTaskUpdateInput(values, canManage),
      )
      setTaskDetail(updated)
      setFeedback({
        type: 'success',
        message: t('admin.tasks.updatedFeedback', { title: updated.title }),
      })
      await refreshAfterMutation()
    } catch (error) {
      setDetailError(getErrorMessage(error, t('admin.tasks.updateError')))
    }
  }

  const handleStatusUpdate = async (values: TaskStatusUpdateValues) => {
    if (!statusTarget) {
      return
    }

    setStatusError(null)

    try {
      const updated = await updateTaskStatus(
        statusTarget.id,
        toTaskStatusUpdateInput(values),
      )
      setStatusTarget(null)
      setFeedback({
        type: 'success',
        message: t('admin.tasks.statusFeedback', {
          status: getStatusLabel(t, 'task', updated.status),
          title: updated.title,
        }),
      })
      await refreshAfterMutation()
    } catch (error) {
      setStatusError(
        getErrorMessage(error, t('admin.tasks.statusUpdateError')),
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
      const title = deleteTarget.title
      await deleteTask(deleteTarget.id)
      setDeleteTarget(null)
      setFeedback({
        type: 'success',
        message: t('admin.tasks.deletedFeedback', { title }),
      })

      if (tasks.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await refreshAfterMutation()
      }
    } catch (error) {
      setDeleteTarget(null)
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, t('admin.tasks.deleteError')),
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
    setAssignedToId('')
    setOverdueOnly(false)
  }

  const submitSearch = () => {
    const nextSearch = searchInput.trim()

    if (page === 1 && search === nextSearch) {
      void loadTasks()
      return
    }

    setPage(1)
    setSearch(nextSearch)
  }

  const detailInitialValues: TaskFormValues = taskDetail
    ? {
        title: taskDetail.title,
        description: taskDetail.description ?? '',
        caseProfileId: taskDetail.caseProfileId ?? '',
        assignedToId: taskDetail.assignedToId ?? '',
        priority: taskDetail.priority,
        deadline: toDateTimeLocalValue(taskDetail.deadline),
      }
    : EMPTY_FORM

  const hasFilters = Boolean(
    search || status || priority || assignedToId || overdueOnly,
  )

  const columns: readonly DataTableColumn<Task>[] = [
    {
      key: 'title',
      header: t('admin.tasks.titleField'),
      className: 'max-w-72',
      render: (task) => (
        <div>
          <p className="truncate font-semibold text-slate-900">{task.title}</p>
          {isTaskOverdue(task) ? (
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-rose-700">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('admin.tasks.overdue')}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'case',
      header: t('navigation.cases'),
      className: 'max-w-56',
      render: (task) =>
        task.caseProfile ? (
          <div>
            <p className="font-semibold text-slate-800">
              {task.caseProfile.caseCode}
            </p>
            <p className="truncate text-xs text-slate-400">
              {task.caseProfile.title}
            </p>
          </div>
        ) : (
          t('admin.appointments.noCase')
        ),
    },
    {
      key: 'assignedTo',
      header: t('admin.tasks.assignedTo'),
      render: (task) => task.assignedTo?.fullName ?? t('common.notAssigned'),
    },
    {
      key: 'priority',
      header: t('admin.tasks.priority'),
      render: (task) => <PriorityBadge priority={task.priority} />,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (task) => <StatusBadge namespace="task" status={task.status} />,
    },
    {
      key: 'deadline',
      header: t('admin.tasks.deadline'),
      render: (task) => (
        <span
          className={cn(isTaskOverdue(task) && 'font-bold text-rose-700')}
        >
          {formatLocalizedDateTime(task.deadline)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('admin.customers.actions.label'),
      headerClassName: 'text-right',
      className: 'text-right',
      render: (task) => (
        <div className="flex justify-end gap-1">
          <button
            aria-label={t('admin.tasks.viewEditAria', { title: task.title })}
            className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-50"
            onClick={() => openDetail(task)}
            title={t('admin.customers.actions.viewEdit')}
            type="button"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label={t('admin.tasks.updateStatusAria', { title: task.title })}
            className="rounded-lg p-2 text-violet-700 transition hover:bg-violet-50"
            onClick={() => {
              setStatusError(null)
              setStatusTarget(task)
            }}
            title={t('admin.tasks.updateStatus')}
            type="button"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </button>
          {canManage ? (
            <button
              aria-label={t('admin.tasks.deleteAria', { title: task.title })}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setDeleteTarget(task)}
              title={t('common.delete')}
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
            {t('admin.tasks.eyebrow')}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {t('navigation.tasks')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('admin.tasks.pageDescription')}
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:self-auto"
          onClick={openCreate}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('admin.tasks.createTask')}
        </button>
      </header>

      {feedback ? (
        <FeedbackBanner
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[minmax(16rem,1fr)_12rem_12rem_13rem_auto_auto]">
          <SearchInput
            isDisabled={isLoading || overdueOnly}
            label={t('admin.tasks.searchLabel')}
            onChange={setSearchInput}
            onSubmit={submitSearch}
            placeholder={t('admin.tasks.searchPlaceholder')}
            value={searchInput}
          />
          <select
            aria-label={t('admin.tasks.filterStatus')}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
            disabled={overdueOnly}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value as TaskStatus | '')
            }}
            value={status}
          >
            <option value="">{t('admin.tasks.allStatuses')}</option>
            {taskStatuses.map((taskStatus) => (
              <option key={taskStatus} value={taskStatus}>
                {getStatusLabel(t, 'task', taskStatus)}
              </option>
            ))}
          </select>
          <select
            aria-label={t('admin.tasks.filterPriority')}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
            disabled={overdueOnly}
            onChange={(event) => {
              setPage(1)
              setPriority(event.target.value as Priority | '')
            }}
            value={priority}
          >
            <option value="">{t('admin.tasks.allPriorities')}</option>
            {priorities.map((taskPriority) => (
              <option key={taskPriority} value={taskPriority}>
                {getStatusLabel(t, 'priority', taskPriority)}
              </option>
            ))}
          </select>
          {canManage ? (
            <select
              aria-label={t('admin.tasks.filterAssignee')}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              onChange={(event) => {
                setPage(1)
                setAssignedToId(event.target.value)
              }}
              onFocus={() => {
                if (lookups.users.length === 0 && !isLoadingLookups) {
                  void loadLookups()
                }
              }}
              value={assignedToId}
            >
              <option value="">{t('admin.tasks.allAssignees')}</option>
              {lookups.users.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.fullName}
                </option>
              ))}
            </select>
          ) : null}
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
            {t('admin.tasks.overdue')}
          </button>
          <button
            className="min-h-11 rounded-xl px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!hasFilters}
            onClick={clearFilters}
            type="button"
          >
            {t('admin.appointments.clearFilters')}
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

        {overdueOnly ? (
          <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {t('admin.tasks.overdueBanner')}
          </div>
        ) : null}

        {loadError && tasks.length === 0 ? (
          <div className="grid min-h-80 place-items-center p-8 text-center">
            <div>
              <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
              <h2 className="mt-4 font-bold text-slate-900">
                {t('admin.tasks.loadErrorTitle')}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {loadError}
              </p>
              <button
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                onClick={() => void loadTasks()}
                type="button"
              >
                {t('common.tryAgain')}
              </button>
            </div>
          </div>
        ) : isLoading && tasks.length === 0 ? (
          <LoadingState label={t('admin.tasks.loading')} />
        ) : tasks.length === 0 ? (
          <EmptyState
            description={
              hasFilters
                ? t('admin.tasks.emptyFiltered')
                : t('admin.tasks.emptyDefault')
            }
            icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
            title={
              overdueOnly ? t('admin.tasks.noOverdue') : t('admin.tasks.emptyTitle')
            }
          />
        ) : (
          <>
            {loadError ? (
              <div
                className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800"
                role="alert"
              >
                <span>
                  {t('admin.tasks.refreshFailed', {
                    message: loadError,
                  })}
                </span>
                <button
                  className="shrink-0 font-bold underline"
                  onClick={() => void loadTasks()}
                  type="button"
                >
                  {t('common.tryAgain')}
                </button>
              </div>
            ) : null}
            <DataTable
              caption={
                overdueOnly ? t('admin.tasks.overdueTasks') : t('navigation.tasks')
              }
              columns={columns}
              getRowKey={(task) => task.id}
              items={tasks}
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
        title={t('admin.tasks.createTask')}
      >
        <TaskForm
          canAssign={canManage}
          error={createError}
          initialValues={EMPTY_FORM}
          isLoadingLookups={isLoadingLookups}
          lookupError={lookupError}
          lookups={lookups}
          onCancel={closeCreate}
          onSubmit={handleCreate}
          submitLabel={t('admin.tasks.createTask')}
        />
      </Modal>

      <Modal
        isDismissible={!isDetailLoading}
        isOpen={detailTarget !== null}
        onClose={closeDetail}
        size="lg"
        title={
          detailTarget
            ? t('admin.tasks.viewEditTitle', { title: detailTarget.title })
            : t('admin.tasks.detailsTitle')
        }
      >
        {taskDetail ? (
          <TaskForm
            canAssign={canManage}
            error={detailError}
            initialValues={detailInitialValues}
            isLoadingLookups={isLoadingLookups}
            lookupError={lookupError}
            lookups={lookups}
            onCancel={closeDetail}
            onSubmit={handleEdit}
            submitLabel={t('common.saveChanges')}
          />
        ) : (
          <div className="p-6">
            {detailError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {detailError}
              </div>
            ) : (
              <LoadingState label={t('admin.tasks.loadingDetails')} />
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
        title={t('admin.tasks.updateStatusTitle')}
      >
        {statusTarget ? (
          <StatusForm
            error={statusError}
            onCancel={() => {
              setStatusTarget(null)
              setStatusError(null)
            }}
            onSubmit={handleStatusUpdate}
            task={statusTarget}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        isLoading={isDeleting}
        isOpen={deleteTarget !== null}
        message={t('admin.tasks.deleteConfirm', {
          title: deleteTarget?.title ?? '',
        })}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={() => void handleDelete()}
        title={t('admin.tasks.deleteTitle')}
      />
    </div>
  )
}
