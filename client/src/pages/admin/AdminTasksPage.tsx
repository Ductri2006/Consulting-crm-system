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

const formatLabel = (value: string): string =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return 'None'
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
            Loading task options...
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="task-title">
              Title <span aria-hidden="true">*</span>
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
              Case
            </label>
            <select
              className="field-input"
              disabled={isLoadingLookups}
              id="task-case"
              {...register('caseProfileId')}
            >
              <option value="">No linked case</option>
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
                Assigned to
              </label>
              <select
                className="field-input"
                disabled={isLoadingLookups}
                id="task-assignee"
                {...register('assignedToId')}
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
            <input type="hidden" {...register('assignedToId')} />
          )}

          <div>
            <label className="field-label" htmlFor="task-priority">
              Priority
            </label>
            <select
              className="field-input"
              id="task-priority"
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
            <label className="field-label" htmlFor="task-deadline">
              Deadline
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
              Description
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
          <p className="font-bold">Current status</p>
          <div className="mt-2">
            <StatusBadge status={task.status} />
          </div>
        </div>
        <label className="field-label" htmlFor="task-status">
          New status
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
                {formatLabel(status)}
              </option>
            ))}
        </select>
        <FieldError id="task-status-error" message={errors.status?.message} />
      </div>

      <ModalActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel="Update status"
      />
    </form>
  )
}

export function AdminTasksPage() {
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
        setLoadError(getErrorMessage(error, 'Tasks could not be loaded.'))
      }
    } finally {
      if (sequence === listSequence.current) {
        setIsLoading(false)
      }
    }
  }, [assignedToId, overdueOnly, page, priority, search, status])

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
        ? getErrorMessage(casesResult.reason, 'Cases could not load.')
        : '',
      usersResult.status === 'rejected'
        ? getErrorMessage(usersResult.reason, 'Assignees could not load.')
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
        setDetailError(getErrorMessage(error, 'Task details could not load.'))
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
        message: `${created.title} created successfully.`,
      })
      await refreshAfterMutation()
    } catch (error) {
      setCreateError(getErrorMessage(error, 'The task could not be created.'))
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
        message: `${updated.title} updated successfully.`,
      })
      await refreshAfterMutation()
    } catch (error) {
      setDetailError(getErrorMessage(error, 'The task could not be updated.'))
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
        message: `${updated.title} moved to ${formatLabel(updated.status)}.`,
      })
      await refreshAfterMutation()
    } catch (error) {
      setStatusError(
        getErrorMessage(error, 'The task status could not be updated.'),
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
        message: `${title} deleted successfully.`,
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
        message: getErrorMessage(error, 'The task could not be deleted.'),
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
      header: 'Title',
      className: 'max-w-72',
      render: (task) => (
        <div>
          <p className="truncate font-semibold text-slate-900">{task.title}</p>
          {isTaskOverdue(task) ? (
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-rose-700">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              Overdue
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'case',
      header: 'Case',
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
          'No case'
        ),
    },
    {
      key: 'assignedTo',
      header: 'Assigned to',
      render: (task) => task.assignedTo?.fullName ?? 'Unassigned',
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (task) => <PriorityBadge priority={task.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (task) => <StatusBadge status={task.status} />,
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (task) => (
        <span
          className={cn(isTaskOverdue(task) && 'font-bold text-rose-700')}
        >
          {formatDateTime(task.deadline)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (task) => (
        <div className="flex justify-end gap-1">
          <button
            aria-label={`View and edit ${task.title}`}
            className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-50"
            onClick={() => openDetail(task)}
            title="View / Edit"
            type="button"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label={`Update status for ${task.title}`}
            className="rounded-lg p-2 text-violet-700 transition hover:bg-violet-50"
            onClick={() => {
              setStatusError(null)
              setStatusTarget(task)
            }}
            title="Update status"
            type="button"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </button>
          {canManage ? (
            <button
              aria-label={`Delete ${task.title}`}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setDeleteTarget(task)}
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
            Team execution
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Tasks
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage operational work, owners, priorities and deadlines.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:self-auto"
          onClick={openCreate}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Task
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
            label="Search tasks"
            onChange={setSearchInput}
            onSubmit={submitSearch}
            placeholder="Search title, description or case..."
            value={searchInput}
          />
          <select
            aria-label="Filter task status"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
            disabled={overdueOnly}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value as TaskStatus | '')
            }}
            value={status}
          >
            <option value="">All statuses</option>
            {taskStatuses.map((taskStatus) => (
              <option key={taskStatus} value={taskStatus}>
                {formatLabel(taskStatus)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter task priority"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
            disabled={overdueOnly}
            onChange={(event) => {
              setPage(1)
              setPriority(event.target.value as Priority | '')
            }}
            value={priority}
          >
            <option value="">All priorities</option>
            {priorities.map((taskPriority) => (
              <option key={taskPriority} value={taskPriority}>
                {formatLabel(taskPriority)}
              </option>
            ))}
          </select>
          {canManage ? (
            <select
              aria-label="Filter task assignee"
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
              <option value="">All assignees</option>
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
            Overdue
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

        {overdueOnly ? (
          <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Showing unfinished tasks whose deadline has passed.
          </div>
        ) : null}

        {loadError && tasks.length === 0 ? (
          <div className="grid min-h-80 place-items-center p-8 text-center">
            <div>
              <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
              <h2 className="mt-4 font-bold text-slate-900">
                Couldn&apos;t load tasks
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {loadError}
              </p>
              <button
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                onClick={() => void loadTasks()}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        ) : isLoading && tasks.length === 0 ? (
          <LoadingState label="Loading tasks..." />
        ) : tasks.length === 0 ? (
          <EmptyState
            description={
              hasFilters
                ? 'Try changing or clearing the current filters.'
                : 'Create the first task to start assigning operational work.'
            }
            icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
            title={overdueOnly ? 'No overdue tasks' : 'No tasks found'}
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
                  onClick={() => void loadTasks()}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : null}
            <DataTable
              caption={overdueOnly ? 'Overdue tasks' : 'Tasks'}
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
        title="Create Task"
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
          submitLabel="Create task"
        />
      </Modal>

      <Modal
        isDismissible={!isDetailLoading}
        isOpen={detailTarget !== null}
        onClose={closeDetail}
        size="lg"
        title={detailTarget ? `View / Edit ${detailTarget.title}` : 'Task details'}
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
            submitLabel="Save changes"
          />
        ) : (
          <div className="p-6">
            {detailError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {detailError}
              </div>
            ) : (
              <LoadingState label="Loading task details..." />
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
        title="Update Task Status"
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
        message={`Delete task ${deleteTarget?.title ?? ''}? This action cannot be undone.`}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={() => void handleDelete()}
        title="Delete task"
      />
    </div>
  )
}
