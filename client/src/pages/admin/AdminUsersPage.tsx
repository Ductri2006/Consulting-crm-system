import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  SearchX,
  UserCheck,
  UserX,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import {
  DataTable,
  EmptyState,
  LoadingState,
  Modal,
  Pagination,
  SearchInput,
  type DataTableColumn,
} from '../../components/admin'
import { useAuth } from '../../features/auth'
import {
  createUser,
  createUserFormSchema,
  editUserFormSchema,
  getUser,
  listUsers,
  resetPasswordFormSchema,
  resetUserPassword,
  updateUser,
  userRoles,
  type CreateTeamMemberInput,
  type CreateUserFormValues,
  type EditUserFormValues,
  type PaginationMeta,
  type ResetPasswordFormValues,
  type TeamMember,
  type TeamMemberRole,
  type UpdateTeamMemberInput,
} from '../../features/users'
import { cn } from '../../utils/cn'

const PAGE_SIZE = 10

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
}

const EMPTY_CREATE_FORM: CreateUserFormValues = {
  fullName: '',
  email: '',
  phone: '',
  role: 'STAFF',
  password: '',
  isActive: true,
}

const EMPTY_RESET_FORM: ResetPasswordFormValues = {
  newPassword: '',
  confirmPassword: '',
}

interface Feedback {
  type: 'success' | 'error'
  message: string
}

type StatusFilter = '' | 'active' | 'inactive'

const formatLabel = (value: string): string =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')

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

const optionalValue = (value: string): string | undefined => {
  const trimmed = value.trim()
  return trimmed || undefined
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

const toCreateInput = (
  values: CreateUserFormValues,
): CreateTeamMemberInput => ({
  fullName: values.fullName.trim(),
  email: values.email.trim().toLowerCase(),
  phone: optionalValue(values.phone),
  role: values.role,
  password: values.password,
  isActive: values.isActive,
})

const toEditInput = (
  values: EditUserFormValues,
): UpdateTeamMemberInput => ({
  fullName: values.fullName.trim(),
  phone: optionalValue(values.phone),
  avatarUrl: optionalValue(values.avatarUrl),
  role: values.role,
  isActive: values.isActive,
})

const getEditValues = (member: TeamMember): EditUserFormValues => ({
  fullName: member.fullName,
  phone: member.phone ?? '',
  avatarUrl: member.avatarUrl ?? '',
  role: member.role,
  isActive: member.isActive,
})

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
      role={isSuccess ? 'status' : 'alert'}
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

function RoleBadge({ role }: { role: TeamMemberRole }) {
  const styles: Record<TeamMemberRole, string> = {
    ADMIN: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    MANAGER: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    STAFF: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
        styles[role],
      )}
    >
      {formatLabel(role)}
    </span>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
        isActive
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
          : 'bg-rose-50 text-rose-700 ring-rose-600/20',
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

function CreateUserForm({
  error,
  onCancel,
  onSubmit,
}: {
  error: string | null
  onCancel: () => void
  onSubmit: (values: CreateUserFormValues) => Promise<void>
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: EMPTY_CREATE_FORM,
  })

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="max-h-[calc(100vh-13rem)] overflow-y-auto p-5 sm:p-6">
        <FormError message={error} />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="create-user-full-name">
              Full name <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={
                errors.fullName ? 'create-user-full-name-error' : undefined
              }
              aria-invalid={Boolean(errors.fullName)}
              className="field-input"
              id="create-user-full-name"
              {...register('fullName')}
            />
            <FieldError
              id="create-user-full-name-error"
              message={errors.fullName?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="create-user-email">
              Email <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={
                errors.email ? 'create-user-email-error' : undefined
              }
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
              className="field-input"
              id="create-user-email"
              type="email"
              {...register('email')}
            />
            <FieldError
              id="create-user-email-error"
              message={errors.email?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="create-user-phone">
              Phone
            </label>
            <input
              aria-describedby={
                errors.phone ? 'create-user-phone-error' : undefined
              }
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
              className="field-input"
              id="create-user-phone"
              type="tel"
              {...register('phone')}
            />
            <FieldError
              id="create-user-phone-error"
              message={errors.phone?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="create-user-role">
              Role <span aria-hidden="true">*</span>
            </label>
            <select
              className="field-input"
              id="create-user-role"
              {...register('role')}
            >
              {userRoles.map((role) => (
                <option key={role} value={role}>
                  {formatLabel(role)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="create-user-password">
              Temporary password <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={
                errors.password ? 'create-user-password-error' : undefined
              }
              aria-invalid={Boolean(errors.password)}
              autoComplete="new-password"
              className="field-input"
              id="create-user-password"
              type="password"
              {...register('password')}
            />
            <FieldError
              id="create-user-password-error"
              message={errors.password?.message}
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              type="checkbox"
              {...register('isActive')}
            />
            Active account
          </label>
        </div>
      </div>

      <ModalActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel="Create team member"
      />
    </form>
  )
}

function EditUserForm({
  currentUserId,
  error,
  member,
  onCancel,
  onSubmit,
}: {
  currentUserId: string | undefined
  error: string | null
  member: TeamMember
  onCancel: () => void
  onSubmit: (values: EditUserFormValues) => Promise<void>
}) {
  const isCurrentUser = currentUserId === member.id
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: getEditValues(member),
  })

  useEffect(() => {
    reset(getEditValues(member))
  }, [member, reset])

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="max-h-[calc(100vh-13rem)] overflow-y-auto p-5 sm:p-6">
        <FormError message={error} />
        {isCurrentUser ? (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You are editing your own account. The server will prevent changes
            that leave the system without an active administrator.
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="edit-user-full-name">
              Full name <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={
                errors.fullName ? 'edit-user-full-name-error' : undefined
              }
              aria-invalid={Boolean(errors.fullName)}
              className="field-input"
              id="edit-user-full-name"
              {...register('fullName')}
            />
            <FieldError
              id="edit-user-full-name-error"
              message={errors.fullName?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="edit-user-phone">
              Phone
            </label>
            <input
              aria-describedby={
                errors.phone ? 'edit-user-phone-error' : undefined
              }
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
              className="field-input"
              id="edit-user-phone"
              type="tel"
              {...register('phone')}
            />
            <FieldError
              id="edit-user-phone-error"
              message={errors.phone?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="edit-user-role">
              Role <span aria-hidden="true">*</span>
            </label>
            <select
              className="field-input"
              id="edit-user-role"
              {...register('role')}
            >
              {userRoles.map((role) => (
                <option key={role} value={role}>
                  {formatLabel(role)}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              type="checkbox"
              {...register('isActive')}
            />
            Active account
          </label>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="edit-user-avatar-url">
              Avatar URL
            </label>
            <input
              aria-describedby={
                errors.avatarUrl ? 'edit-user-avatar-url-error' : undefined
              }
              aria-invalid={Boolean(errors.avatarUrl)}
              className="field-input"
              id="edit-user-avatar-url"
              placeholder="https://example.com/avatar.png"
              type="url"
              {...register('avatarUrl')}
            />
            <FieldError
              id="edit-user-avatar-url-error"
              message={errors.avatarUrl?.message}
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

function ResetPasswordForm({
  error,
  member,
  onCancel,
  onSubmit,
}: {
  error: string | null
  member: TeamMember
  onCancel: () => void
  onSubmit: (values: ResetPasswordFormValues) => Promise<void>
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: EMPTY_RESET_FORM,
  })

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="p-5 sm:p-6">
        <FormError message={error} />
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This is a temporary admin reset flow for internal CRM users. Share the
          temporary password privately and ask the user to replace it when a
          self-service password-change flow exists.
        </div>
        <div className="mb-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Resetting password for{' '}
          <span className="font-bold text-slate-900">{member.fullName}</span>
          .
        </div>
        <div className="grid gap-5">
          <div>
            <label className="field-label" htmlFor="reset-user-password">
              New temporary password <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={
                errors.newPassword ? 'reset-user-password-error' : undefined
              }
              aria-invalid={Boolean(errors.newPassword)}
              autoComplete="new-password"
              className="field-input"
              id="reset-user-password"
              type="password"
              {...register('newPassword')}
            />
            <FieldError
              id="reset-user-password-error"
              message={errors.newPassword?.message}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="reset-user-confirm-password">
              Confirm password <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={
                errors.confirmPassword
                  ? 'reset-user-confirm-password-error'
                  : undefined
              }
              aria-invalid={Boolean(errors.confirmPassword)}
              autoComplete="new-password"
              className="field-input"
              id="reset-user-confirm-password"
              type="password"
              {...register('confirmPassword')}
            />
            <FieldError
              id="reset-user-confirm-password-error"
              message={errors.confirmPassword?.message}
            />
          </div>
        </div>
      </div>

      <ModalActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel="Reset password"
        submittingLabel="Resetting..."
      />
    </form>
  )
}

function AccountStatusDialog({
  isLoading,
  member,
  onCancel,
  onConfirm,
}: {
  isLoading: boolean
  member: TeamMember | null
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!member) {
    return null
  }

  const willDeactivate = member.isActive

  return (
    <Modal
      isDismissible={!isLoading}
      isOpen={Boolean(member)}
      onClose={onCancel}
      role="alertdialog"
      size="sm"
      title={willDeactivate ? 'Deactivate team member' : 'Activate team member'}
    >
      <div className="p-5 sm:p-6">
        <div className="flex gap-4">
          <span
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-full',
              willDeactivate
                ? 'bg-rose-50 text-rose-600'
                : 'bg-emerald-50 text-emerald-600',
            )}
          >
            {willDeactivate ? (
              <UserX className="h-5 w-5" aria-hidden="true" />
            ) : (
              <UserCheck className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <p className="pt-1 text-sm leading-6 text-slate-600">
            {willDeactivate
              ? `Deactivate ${member.fullName}? They will no longer be able to sign in.`
              : `Activate ${member.fullName}? They will be able to sign in again with their current password.`}
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            disabled={isLoading}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className={cn(
              'rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60',
              willDeactivate
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700',
            )}
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isLoading
              ? 'Saving...'
              : willDeactivate
                ? 'Deactivate'
                : 'Activate'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<TeamMemberRole | ''>('')
  const [status, setStatus] = useState<StatusFilter>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null)
  const [editDetail, setEditDetail] = useState<TeamMember | null>(null)
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<TeamMember | null>(null)
  const [resetError, setResetError] = useState<string | null>(null)
  const [statusTarget, setStatusTarget] = useState<TeamMember | null>(null)
  const [isStatusSaving, setIsStatusSaving] = useState(false)
  const listSequence = useRef(0)
  const detailSequence = useRef(0)

  const statusFilterValue =
    status === 'active' ? true : status === 'inactive' ? false : ''

  const loadMembers = useCallback(async () => {
    const sequence = ++listSequence.current
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await listUsers({
        page,
        limit: PAGE_SIZE,
        search,
        role,
        isActive: statusFilterValue,
      })

      if (sequence === listSequence.current) {
        setMembers(result.items)
        setMeta(result.meta)
      }
    } catch (error) {
      if (sequence === listSequence.current) {
        setLoadError(getErrorMessage(error, 'Team members could not load.'))
      }
    } finally {
      if (sequence === listSequence.current) {
        setIsLoading(false)
      }
    }
  }, [page, role, search, statusFilterValue])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  const refreshFromFirstPage = async () => {
    const shouldReload = page === 1
    setPage(1)

    if (shouldReload) {
      await loadMembers()
    }
  }

  const submitSearch = () => {
    const nextSearch = searchInput.trim()

    if (page === 1 && search === nextSearch) {
      void loadMembers()
      return
    }

    setPage(1)
    setSearch(nextSearch)
  }

  const clearFilters = () => {
    setPage(1)
    setSearch('')
    setSearchInput('')
    setRole('')
    setStatus('')
  }

  const openCreate = () => {
    setCreateError(null)
    setIsCreateOpen(true)
  }

  const closeCreate = () => {
    setIsCreateOpen(false)
    setCreateError(null)
  }

  const handleCreate = async (values: CreateUserFormValues) => {
    setCreateError(null)

    try {
      const created = await createUser(toCreateInput(values))
      closeCreate()
      setFeedback({
        type: 'success',
        message: `${created.fullName} created successfully.`,
      })
      await refreshFromFirstPage()
    } catch (error) {
      setCreateError(
        getErrorMessage(error, 'The team member could not be created.'),
      )
    }
  }

  const loadEditDetail = async (member: TeamMember) => {
    const sequence = ++detailSequence.current
    setIsEditLoading(true)
    setEditError(null)
    setEditDetail(null)

    try {
      const result = await getUser(member.id)

      if (sequence === detailSequence.current) {
        setEditDetail(result)
      }
    } catch (error) {
      if (sequence === detailSequence.current) {
        setEditError(getErrorMessage(error, 'User details could not load.'))
      }
    } finally {
      if (sequence === detailSequence.current) {
        setIsEditLoading(false)
      }
    }
  }

  const openEdit = (member: TeamMember) => {
    setEditTarget(member)
    void loadEditDetail(member)
  }

  const closeEdit = () => {
    detailSequence.current += 1
    setEditTarget(null)
    setEditDetail(null)
    setEditError(null)
    setIsEditLoading(false)
  }

  const handleEdit = async (values: EditUserFormValues) => {
    if (!editDetail) {
      return
    }

    setEditError(null)

    try {
      const updated = await updateUser(editDetail.id, toEditInput(values))
      setEditDetail(updated)
      setFeedback({
        type: 'success',
        message: `${updated.fullName} updated successfully.`,
      })
      closeEdit()
      await loadMembers()
    } catch (error) {
      setEditError(
        getErrorMessage(error, 'The team member could not be updated.'),
      )
    }
  }

  const openResetPassword = (member: TeamMember) => {
    setResetError(null)
    setResetTarget(member)
  }

  const closeResetPassword = () => {
    setResetTarget(null)
    setResetError(null)
  }

  const handleResetPassword = async (values: ResetPasswordFormValues) => {
    if (!resetTarget) {
      return
    }

    setResetError(null)

    try {
      await resetUserPassword(resetTarget.id, {
        newPassword: values.newPassword,
      })
      setFeedback({
        type: 'success',
        message: `${resetTarget.fullName}'s password was reset.`,
      })
      closeResetPassword()
      await loadMembers()
    } catch (error) {
      setResetError(
        getErrorMessage(error, 'The password could not be reset.'),
      )
    }
  }

  const handleStatusToggle = async () => {
    if (!statusTarget) {
      return
    }

    setIsStatusSaving(true)
    setFeedback(null)

    try {
      const updated = await updateUser(statusTarget.id, {
        fullName: statusTarget.fullName,
        phone: statusTarget.phone ?? undefined,
        avatarUrl: statusTarget.avatarUrl ?? undefined,
        role: statusTarget.role,
        isActive: !statusTarget.isActive,
      })
      setStatusTarget(null)
      setFeedback({
        type: 'success',
        message: `${updated.fullName} is now ${
          updated.isActive ? 'active' : 'inactive'
        }.`,
      })
      await loadMembers()
    } catch (error) {
      setStatusTarget(null)
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'The account status could not be changed.',
        ),
      })
    } finally {
      setIsStatusSaving(false)
    }
  }

  const hasFilters = Boolean(search || role || status)

  const columns: readonly DataTableColumn<TeamMember>[] = [
    {
      key: 'name',
      header: 'Full name',
      className: 'min-w-56',
      render: (member) => (
        <div>
          <p className="font-semibold text-slate-900">{member.fullName}</p>
          {member.id === currentUser?.id ? (
            <p className="mt-0.5 text-xs font-semibold text-blue-600">You</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      className: 'max-w-72',
      render: (member) => (
        <span className="block truncate">{member.email}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (member) => member.phone ?? 'None',
    },
    {
      key: 'role',
      header: 'Role',
      render: (member) => <RoleBadge role={member.role} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (member) => <StatusBadge isActive={member.isActive} />,
    },
    {
      key: 'createdAt',
      header: 'Created date',
      render: (member) => formatDate(member.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (member) => (
        <div className="flex justify-end gap-1">
          <button
            aria-label={`Edit ${member.fullName}`}
            className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-50"
            onClick={() => openEdit(member)}
            title="Edit"
            type="button"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label={`Reset password for ${member.fullName}`}
            className="rounded-lg p-2 text-violet-700 transition hover:bg-violet-50"
            onClick={() => openResetPassword(member)}
            title="Reset password"
            type="button"
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label={
              member.isActive
                ? `Deactivate ${member.fullName}`
                : `Activate ${member.fullName}`
            }
            className={cn(
              'rounded-lg p-2 transition',
              member.isActive
                ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-700'
                : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-700',
            )}
            onClick={() => setStatusTarget(member)}
            title={member.isActive ? 'Deactivate' : 'Activate'}
            type="button"
          >
            {member.isActive ? (
              <UserX className="h-4 w-4" aria-hidden="true" />
            ) : (
              <UserCheck className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Internal access
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Team Members
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage internal CRM users, roles, activation and password resets.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:self-auto"
          onClick={openCreate}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Team Member
        </button>
      </header>

      {feedback ? (
        <FeedbackBanner
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[minmax(16rem,1fr)_12rem_12rem_auto_auto]">
          <SearchInput
            isDisabled={isLoading}
            label="Search team members"
            onChange={setSearchInput}
            onSubmit={submitSearch}
            placeholder="Search name, email or phone..."
            value={searchInput}
          />
          <select
            aria-label="Filter team member role"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => {
              setPage(1)
              setRole(event.target.value as TeamMemberRole | '')
            }}
            value={role}
          >
            <option value="">All roles</option>
            {userRoles.map((userRole) => (
              <option key={userRole} value={userRole}>
                {formatLabel(userRole)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter account status"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value as StatusFilter)
            }}
            value={status}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            disabled={isLoading}
            onClick={() => void loadMembers()}
            type="button"
          >
            <RefreshCw
              className={cn('h-4 w-4', isLoading && 'animate-spin')}
              aria-hidden="true"
            />
            Refresh
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

        {loadError && members.length === 0 ? (
          <div className="grid min-h-80 place-items-center p-8 text-center">
            <div>
              <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
              <h2 className="mt-4 font-bold text-slate-900">
                Team members could not load
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {loadError}
              </p>
              <button
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                onClick={() => void loadMembers()}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        ) : isLoading && members.length === 0 ? (
          <LoadingState label="Loading team members..." />
        ) : members.length === 0 ? (
          <EmptyState
            description={
              hasFilters
                ? 'Try changing or clearing the current filters.'
                : 'Create an internal CRM user to start managing team access.'
            }
            icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
            title={hasFilters ? 'No matching team members' : 'No team members yet'}
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
                  onClick={() => void loadMembers()}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : null}
            <DataTable
              caption="Internal team members"
              columns={columns}
              getRowKey={(member) => member.id}
              items={members}
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
        description="Create an internal CRM user. Public visitors do not need accounts."
        isOpen={isCreateOpen}
        onClose={closeCreate}
        size="lg"
        title="Create team member"
      >
        <CreateUserForm
          error={createError}
          onCancel={closeCreate}
          onSubmit={handleCreate}
        />
      </Modal>

      <Modal
        isDismissible={!isEditLoading}
        isOpen={editTarget !== null}
        onClose={closeEdit}
        size="lg"
        title={editTarget ? `Edit ${editTarget.fullName}` : 'Edit team member'}
      >
        {editDetail ? (
          <EditUserForm
            currentUserId={currentUser?.id}
            error={editError}
            member={editDetail}
            onCancel={closeEdit}
            onSubmit={handleEdit}
          />
        ) : (
          <div className="p-6">
            {editError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {editError}
              </div>
            ) : (
              <LoadingState label="Loading team member details..." />
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={resetTarget !== null}
        onClose={closeResetPassword}
        size="md"
        title="Reset password"
      >
        {resetTarget ? (
          <ResetPasswordForm
            error={resetError}
            member={resetTarget}
            onCancel={closeResetPassword}
            onSubmit={handleResetPassword}
          />
        ) : null}
      </Modal>

      <AccountStatusDialog
        isLoading={isStatusSaving}
        member={statusTarget}
        onCancel={() => {
          if (!isStatusSaving) {
            setStatusTarget(null)
          }
        }}
        onConfirm={() => void handleStatusToggle()}
      />
    </div>
  )
}
