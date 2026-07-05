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
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  EmptyState,
  ErrorState,
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
import { formatDate as formatLocalizedDate } from '../../i18n/format'
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

const formatDate = (value: string): string => formatLocalizedDate(value)

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
  const { t } = useTranslation()
  const translatedMessage = translateValidationMessage(t, message)

  return message ? (
    <p className="field-error" id={id}>
      {translatedMessage}
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
        {isSubmitting
          ? (submittingLabel ?? t('admin.users.saving'))
          : submitLabel}
      </button>
    </div>
  )
}

function RoleBadge({ role }: { role: TeamMemberRole }) {
  const { t } = useTranslation()
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
      {getStatusLabel(t, 'role', role)}
    </span>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
        isActive
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
          : 'bg-rose-50 text-rose-700 ring-rose-600/20',
      )}
    >
      {isActive ? t('common.active') : t('common.inactive')}
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
  const { t } = useTranslation()
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
              {t('admin.users.fields.fullName')} <span aria-hidden="true">*</span>
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
              {t('common.email')} <span aria-hidden="true">*</span>
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
              {t('admin.users.fields.phone')}
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
              {t('admin.users.fields.role')} <span aria-hidden="true">*</span>
            </label>
            <select
              className="field-input"
              id="create-user-role"
              {...register('role')}
            >
              {userRoles.map((role) => (
                <option key={role} value={role}>
                  {getStatusLabel(t, 'role', role)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="create-user-password">
              {t('admin.users.fields.temporaryPassword')} <span aria-hidden="true">*</span>
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
            {t('admin.users.activeAccount')}
          </label>
        </div>
      </div>

      <ModalActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel={t('admin.users.createTeamMember')}
        submittingLabel={t('admin.users.creating')}
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
  const { t } = useTranslation()
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
            {t('admin.users.selfEditWarning')}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="edit-user-full-name">
              {t('admin.users.fields.fullName')} <span aria-hidden="true">*</span>
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
              {t('admin.users.fields.phone')}
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
              {t('admin.users.fields.role')} <span aria-hidden="true">*</span>
            </label>
            <select
              className="field-input"
              id="edit-user-role"
              {...register('role')}
            >
              {userRoles.map((role) => (
                <option key={role} value={role}>
                  {getStatusLabel(t, 'role', role)}
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
            {t('admin.users.activeAccount')}
          </label>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="edit-user-avatar-url">
              {t('admin.users.fields.avatarUrl')}
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
        submitLabel={t('common.saveChanges')}
        submittingLabel={t('admin.users.saving')}
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
  const { t } = useTranslation()
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
          {t('admin.users.resetPasswordWarning')}
        </div>
        <div className="mb-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t('admin.users.resettingPasswordFor', { name: member.fullName })}
        </div>
        <div className="grid gap-5">
          <div>
            <label className="field-label" htmlFor="reset-user-password">
              {t('admin.users.fields.newTemporaryPassword')} <span aria-hidden="true">*</span>
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
              {t('auth.workspaceSignup.fields.confirmPassword')} <span aria-hidden="true">*</span>
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
        submitLabel={t('admin.users.resetPassword')}
        submittingLabel={t('admin.users.resetting')}
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
  const { t } = useTranslation()

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
      title={
        willDeactivate
          ? t('admin.users.deactivateTitle')
          : t('admin.users.activateTitle')
      }
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
              ? t('admin.users.deactivateConfirm', { name: member.fullName })
              : t('admin.users.activateConfirm', { name: member.fullName })}
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            disabled={isLoading}
            onClick={onCancel}
            type="button"
          >
            {t('common.cancel')}
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
              ? t('admin.users.saving')
              : willDeactivate
                ? t('common.deactivate')
                : t('common.activate')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function AdminUsersPage() {
  const { t } = useTranslation()
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
        setLoadError(getErrorMessage(error, t('admin.users.loadError')))
      }
    } finally {
      if (sequence === listSequence.current) {
        setIsLoading(false)
      }
    }
  }, [page, role, search, statusFilterValue, t])

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
        message: t('admin.users.createdFeedback', { name: created.fullName }),
      })
      await refreshFromFirstPage()
    } catch (error) {
      setCreateError(
        getErrorMessage(error, t('admin.users.createError')),
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
        setEditError(getErrorMessage(error, t('admin.users.detailsLoadError')))
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
        message: t('admin.users.updatedFeedback', { name: updated.fullName }),
      })
      closeEdit()
      await loadMembers()
    } catch (error) {
      setEditError(
        getErrorMessage(error, t('admin.users.updateError')),
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
        message: t('admin.users.passwordResetFeedback', {
          name: resetTarget.fullName,
        }),
      })
      closeResetPassword()
      await loadMembers()
    } catch (error) {
      setResetError(
        getErrorMessage(error, t('admin.users.passwordResetError')),
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
        message: t('admin.users.statusFeedback', {
          name: updated.fullName,
          status: updated.isActive ? t('common.active') : t('common.inactive'),
        }),
      })
      await loadMembers()
    } catch (error) {
      setStatusTarget(null)
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          t('admin.users.statusUpdateError'),
        ),
      })
    } finally {
      setIsStatusSaving(false)
    }
  }

  const hasFilters = Boolean(search || role || status)
  const workspaceName = currentUser?.organization?.name?.trim()
  const workspaceLabel = workspaceName || t('admin.users.currentWorkspace')

  const columns: readonly DataTableColumn<TeamMember>[] = [
    {
      key: 'name',
      header: t('admin.users.fields.fullName'),
      className: 'min-w-56',
      render: (member) => (
        <div>
          <p className="font-semibold text-slate-900">{member.fullName}</p>
          {member.id === currentUser?.id ? (
            <p className="mt-0.5 text-xs font-semibold text-blue-600">
              {t('admin.users.you')}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'email',
      header: t('common.email'),
      className: 'max-w-72',
      render: (member) => (
        <span className="block truncate">{member.email}</span>
      ),
    },
    {
      key: 'phone',
      header: t('admin.users.fields.phone'),
      render: (member) => member.phone ?? t('common.notProvided'),
    },
    {
      key: 'role',
      header: t('admin.users.fields.role'),
      render: (member) => <RoleBadge role={member.role} />,
    },
    {
      key: 'status',
      header: t('admin.cases.fields.status'),
      render: (member) => <StatusBadge isActive={member.isActive} />,
    },
    {
      key: 'createdAt',
      header: t('admin.users.fields.createdDate'),
      render: (member) => formatDate(member.createdAt),
    },
    {
      key: 'actions',
      header: t('admin.customers.actions.label'),
      headerClassName: 'text-right',
      className: 'text-right',
      render: (member) => (
        <div className="flex justify-end gap-1">
          <button
            aria-label={t('admin.users.actions.editAria', {
              name: member.fullName,
            })}
            className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-50"
            onClick={() => openEdit(member)}
            title={t('common.edit')}
            type="button"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label={t('admin.users.actions.resetPasswordAria', {
              name: member.fullName,
            })}
            className="rounded-lg p-2 text-violet-700 transition hover:bg-violet-50"
            onClick={() => openResetPassword(member)}
            title={t('admin.users.resetPassword')}
            type="button"
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label={
              member.isActive
                ? t('admin.users.actions.deactivateAria', {
                    name: member.fullName,
                  })
                : t('admin.users.actions.activateAria', {
                    name: member.fullName,
                  })
            }
            className={cn(
              'rounded-lg p-2 transition',
              member.isActive
                ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-700'
                : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-700',
            )}
            onClick={() => setStatusTarget(member)}
            title={
              member.isActive ? t('common.deactivate') : t('common.activate')
            }
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
            {t('admin.users.eyebrow')}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {t('navigation.teamMembers')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('admin.users.description')}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {t('admin.users.workspaceScope', { workspace: workspaceLabel })}
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:self-auto"
          onClick={openCreate}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('admin.users.createTeamMember')}
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
            label={t('admin.users.searchLabel')}
            onChange={setSearchInput}
            onSubmit={submitSearch}
            placeholder={t('admin.users.searchPlaceholder')}
            value={searchInput}
          />
          <select
            aria-label={t('admin.users.filterRole')}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => {
              setPage(1)
              setRole(event.target.value as TeamMemberRole | '')
            }}
            value={role}
          >
            <option value="">{t('admin.users.allRoles')}</option>
            {userRoles.map((userRole) => (
              <option key={userRole} value={userRole}>
                {getStatusLabel(t, 'role', userRole)}
              </option>
            ))}
          </select>
          <select
            aria-label={t('admin.users.filterStatus')}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value as StatusFilter)
            }}
            value={status}
          >
            <option value="">{t('admin.cases.allStatuses')}</option>
            <option value="active">{t('common.active')}</option>
            <option value="inactive">{t('common.inactive')}</option>
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
            {t('common.refresh')}
          </button>
          <button
            className="min-h-11 rounded-xl px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!hasFilters}
            onClick={clearFilters}
            type="button"
          >
            {t('admin.cases.clearFilters')}
          </button>
        </div>

        {loadError && members.length === 0 ? (
          <ErrorState
            className="min-h-80 rounded-none border-0 shadow-none"
            description={loadError}
            onRetry={() => void loadMembers()}
            title={t('admin.users.loadErrorTitle')}
          />
        ) : isLoading && members.length === 0 ? (
          <LoadingState label={t('admin.users.loading')} />
        ) : members.length === 0 ? (
          <EmptyState
            description={
              hasFilters
                ? t('admin.users.emptyFiltered')
                : t('admin.users.emptyDefault')
            }
            icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
            title={
              hasFilters
                ? t('admin.users.emptyFilteredTitle')
                : t('admin.users.emptyTitle')
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
                  {t('admin.users.refreshFailed', { message: loadError })}
                </span>
                <button
                  className="shrink-0 font-bold underline"
                  onClick={() => void loadMembers()}
                  type="button"
                >
                  {t('admin.appointments.retry')}
                </button>
              </div>
            ) : null}
            <DataTable
              caption={t('admin.users.tableCaption')}
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
        description={t('admin.users.createDescription')}
        isOpen={isCreateOpen}
        onClose={closeCreate}
        size="lg"
        title={t('admin.users.createTeamMember')}
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
        title={
          editTarget
            ? t('admin.users.editTitleWithName', { name: editTarget.fullName })
            : t('admin.users.editTitle')
        }
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
              <LoadingState label={t('admin.users.loadingDetails')} />
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={resetTarget !== null}
        onClose={closeResetPassword}
        size="md"
        title={t('admin.users.resetPassword')}
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
