import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Copy,
  MailPlus,
  RefreshCw,
  SearchX,
  Send,
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
  createInvitation,
  createInvitationFormSchema,
  invitationRoles,
  invitationStatuses,
  listInvitations,
  resendInvitation,
  revokeInvitation,
  type CreateInvitationFormValues,
  type CreateInvitationInput,
  type EmailDeliveryResult,
  type InvitationRole,
  type InvitationStatus,
  type PaginationMeta,
  type WorkspaceInvitation,
} from '../../features/invitations'
import { cn } from '../../utils/cn'

const PAGE_SIZE = 10

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
}

const EMPTY_CREATE_FORM: CreateInvitationFormValues = {
  email: '',
  role: 'STAFF',
  expiresInDays: 7,
  sendEmail: true,
}

interface Feedback {
  type: 'success' | 'warning' | 'error'
  message: string
  inviteUrl?: string
  emailDelivery?: EmailDeliveryResult
}

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

const formatDateTime = (value: string): string => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

const toCreateInput = (
  values: CreateInvitationFormValues,
): CreateInvitationInput => ({
  email: values.email.trim().toLowerCase(),
  role: values.role,
  expiresInDays: values.expiresInDays,
  sendEmail: values.sendEmail,
})

const getEmailDeliveryMessage = (
  delivery?: EmailDeliveryResult,
): string | null => {
  if (!delivery) {
    return null
  }

  if (delivery.status === 'MOCK_SENT') {
    return 'Email preview generated in console mode.'
  }

  if (delivery.status === 'SENT') {
    return 'Invitation email sent.'
  }

  if (delivery.status === 'FAILED') {
    return `Invitation created, but email delivery failed.${delivery.error ? ` ${delivery.error}` : ''}`
  }

  return 'Email delivery disabled. Copy the link manually.'
}

const getDeliveryFeedbackType = (
  delivery: EmailDeliveryResult,
): Feedback['type'] =>
  delivery.status === 'FAILED' || delivery.status === 'DISABLED'
    ? 'warning'
    : 'success'

const copyText = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.append(textarea)
  textarea.select()

  try {
    if (!document.execCommand('copy')) {
      throw new Error('Copy failed.')
    }
  } finally {
    textarea.remove()
  }
}

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
  onCopy,
  onDismiss,
}: {
  feedback: Feedback
  onCopy: (value: string) => void
  onDismiss: () => void
}) {
  const isSuccess = feedback.type === 'success'
  const isWarning = feedback.type === 'warning'
  const emailDeliveryMessage = getEmailDeliveryMessage(feedback.emailDelivery)

  return (
    <div
      className={cn(
        'mt-5 flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between',
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : isWarning
            ? 'border-amber-200 bg-amber-50 text-amber-800'
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
        <span>
          <span className="block">{feedback.message}</span>
          {emailDeliveryMessage ? (
            <span className="mt-1 block text-xs font-semibold">
              {emailDeliveryMessage}
            </span>
          ) : null}
        </span>
      </span>
      <span className="flex shrink-0 gap-2">
        {feedback.inviteUrl ? (
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
            onClick={() => onCopy(feedback.inviteUrl ?? '')}
            type="button"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy link
          </button>
        ) : null}
        <button
          className="rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition hover:bg-black/5"
          onClick={onDismiss}
          type="button"
        >
          Dismiss
        </button>
      </span>
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

function RoleBadge({ role }: { role: InvitationRole }) {
  const styles: Record<InvitationRole, string> = {
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

function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const styles: Record<InvitationStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    REVOKED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    EXPIRED: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
        styles[status],
      )}
    >
      {formatLabel(status)}
    </span>
  )
}

function CreateInvitationForm({
  error,
  onCancel,
  onSubmit,
}: {
  error: string | null
  onCancel: () => void
  onSubmit: (values: CreateInvitationFormValues) => Promise<void>
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<CreateInvitationFormValues>({
    resolver: zodResolver(createInvitationFormSchema),
    defaultValues: EMPTY_CREATE_FORM,
  })

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="max-h-[calc(100vh-13rem)] overflow-y-auto p-5 sm:p-6">
        <FormError message={error} />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="create-invitation-email">
              Email <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={
                errors.email ? 'create-invitation-email-error' : undefined
              }
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
              className="field-input"
              id="create-invitation-email"
              type="email"
              {...register('email')}
            />
            <FieldError
              id="create-invitation-email-error"
              message={errors.email?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="create-invitation-role">
              Role <span aria-hidden="true">*</span>
            </label>
            <select
              className="field-input"
              id="create-invitation-role"
              {...register('role')}
            >
              {invitationRoles.map((role) => (
                <option key={role} value={role}>
                  {formatLabel(role)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="create-invitation-expiry">
              Expires in days <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={
                errors.expiresInDays
                  ? 'create-invitation-expiry-error'
                  : undefined
              }
              aria-invalid={Boolean(errors.expiresInDays)}
              className="field-input"
              id="create-invitation-expiry"
              max={30}
              min={1}
              type="number"
              {...register('expiresInDays', { valueAsNumber: true })}
            />
            <FieldError
              id="create-invitation-expiry-error"
              message={errors.expiresInDays?.message}
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 sm:col-span-2">
            <input
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              type="checkbox"
              {...register('sendEmail')}
            />
            Send invitation email now
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          The invite link is shown only after this create action. If email
          delivery is disabled or fails, copy it and share it privately.
        </div>
      </div>

      <ModalActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel="Create invitation"
        submittingLabel="Creating..."
      />
    </form>
  )
}

function RevokeInvitationDialog({
  invitation,
  isLoading,
  onCancel,
  onConfirm,
}: {
  invitation: WorkspaceInvitation | null
  isLoading: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!invitation) {
    return null
  }

  return (
    <Modal
      isDismissible={!isLoading}
      isOpen={Boolean(invitation)}
      onClose={onCancel}
      role="alertdialog"
      size="sm"
      title="Revoke invitation"
    >
      <div className="p-5 sm:p-6">
        <div className="flex gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
            <Ban className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="pt-1 text-sm leading-6 text-slate-600">
            Revoke the pending invitation for{' '}
            <span className="font-bold text-slate-900">
              {invitation.email}
            </span>
            ? The current invite link will stop working.
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
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isLoading ? 'Revoking...' : 'Revoke'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ResendInvitationDialog({
  error,
  invitation,
  isLoading,
  onCancel,
  onSubmit,
}: {
  error: string | null
  invitation: WorkspaceInvitation | null
  isLoading: boolean
  onCancel: () => void
  onSubmit: (values: { expiresInDays: number }) => void
}) {
  const [expiresInDays, setExpiresInDays] = useState(7)

  useEffect(() => {
    if (invitation) {
      setExpiresInDays(7)
    }
  }, [invitation])

  if (!invitation) {
    return null
  }

  return (
    <Modal
      isDismissible={!isLoading}
      isOpen={Boolean(invitation)}
      onClose={onCancel}
      role="alertdialog"
      size="sm"
      title="Resend invitation"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({ expiresInDays })
        }}
      >
        <div className="p-5 sm:p-6">
          <div className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
              <Send className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="pt-1 text-sm leading-6 text-slate-600">
              <p>
                Resend the invitation for{' '}
                <span className="font-bold text-slate-900">
                  {invitation.email}
                </span>
                .
              </p>
              <p className="mt-2 font-semibold text-amber-800">
                Resending rotates the invite link. Older links will stop
                working.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <label className="field-label" htmlFor="resend-invitation-expiry">
              Expires in days
            </label>
            <input
              className="field-input"
              id="resend-invitation-expiry"
              max={30}
              min={1}
              onChange={(event) =>
                setExpiresInDays(Number(event.target.value))
              }
              type="number"
              value={expiresInDays}
            />
          </div>
          {error ? (
            <div
              className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {error}
            </div>
          ) : null}
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
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                isLoading ||
                !Number.isInteger(expiresInDays) ||
                expiresInDays < 1 ||
                expiresInDays > 30
              }
              type="submit"
            >
              {isLoading ? 'Resending...' : 'Resend'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export function AdminInvitationsPage() {
  const { user: currentUser } = useAuth()
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<InvitationRole | ''>('')
  const [status, setStatus] = useState<InvitationStatus | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] =
    useState<WorkspaceInvitation | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)
  const [resendTarget, setResendTarget] =
    useState<WorkspaceInvitation | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const listSequence = useRef(0)

  const loadInvitations = useCallback(async () => {
    const sequence = ++listSequence.current
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await listInvitations({
        page,
        limit: PAGE_SIZE,
        search,
        role,
        status,
      })

      if (sequence === listSequence.current) {
        setInvitations(result.items)
        setMeta(result.meta)
      }
    } catch (error) {
      if (sequence === listSequence.current) {
        setLoadError(getErrorMessage(error, 'Invitations could not load.'))
      }
    } finally {
      if (sequence === listSequence.current) {
        setIsLoading(false)
      }
    }
  }, [page, role, search, status])

  useEffect(() => {
    void loadInvitations()
  }, [loadInvitations])

  const refreshFromFirstPage = async () => {
    const shouldReload = page === 1
    setPage(1)

    if (shouldReload) {
      await loadInvitations()
    }
  }

  const submitSearch = () => {
    const nextSearch = searchInput.trim()

    if (page === 1 && search === nextSearch) {
      void loadInvitations()
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
    setCreateError(null)
    setIsCreateOpen(false)
  }

  const handleCopyInviteUrl = async (inviteUrl: string) => {
    try {
      await copyText(inviteUrl)
      setFeedback({
        type: 'success',
        message: 'Invite link copied. Share it privately with the recipient.',
        inviteUrl,
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Invite link could not be copied.'),
        inviteUrl,
      })
    }
  }

  const handleCreate = async (values: CreateInvitationFormValues) => {
    setCreateError(null)

    try {
      const result = await createInvitation(toCreateInput(values))
      closeCreate()
      const emailDeliveryType = getDeliveryFeedbackType(result.emailDelivery)
      setFeedback({
        type: emailDeliveryType,
        message: `Invitation for ${result.invitation.email} created. Copy the invite link now; it will not be shown again.`,
        inviteUrl: result.inviteUrl,
        emailDelivery: result.emailDelivery,
      })
      await refreshFromFirstPage()
    } catch (error) {
      setCreateError(
        getErrorMessage(error, 'The invitation could not be created.'),
      )
    }
  }

  const openResend = (invitation: WorkspaceInvitation) => {
    setResendError(null)
    setResendTarget(invitation)
  }

  const closeResend = () => {
    if (!isResending) {
      setResendTarget(null)
      setResendError(null)
    }
  }

  const handleResend = async (values: { expiresInDays: number }) => {
    if (!resendTarget) {
      return
    }

    setIsResending(true)
    setResendError(null)

    try {
      const result = await resendInvitation(resendTarget.id, {
        expiresInDays: values.expiresInDays,
      })
      setFeedback({
        type: getDeliveryFeedbackType(result.emailDelivery),
        message: `Invitation for ${result.invitation.email} resent. Copy the new link now; older links no longer work.`,
        inviteUrl: result.inviteUrl,
        emailDelivery: result.emailDelivery,
      })
      setResendTarget(null)
      await loadInvitations()
    } catch (error) {
      setResendError(
        getErrorMessage(error, 'The invitation could not be resent.'),
      )
    } finally {
      setIsResending(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) {
      return
    }

    setIsRevoking(true)
    setFeedback(null)

    try {
      const revoked = await revokeInvitation(revokeTarget.id)
      setFeedback({
        type: 'success',
        message: `Invitation for ${revoked.email} was revoked.`,
      })
      setRevokeTarget(null)
      await loadInvitations()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'The invitation could not be revoked.'),
      })
      setRevokeTarget(null)
    } finally {
      setIsRevoking(false)
    }
  }

  const hasFilters = Boolean(search || role || status)
  const workspaceName = currentUser?.organization?.name?.trim()
  const workspaceLabel = workspaceName || 'the current workspace'

  const columns: readonly DataTableColumn<WorkspaceInvitation>[] = [
    {
      key: 'email',
      header: 'Email',
      className: 'min-w-72 max-w-96',
      render: (invitation) => (
        <span className="block truncate font-semibold text-slate-900">
          {invitation.email}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (invitation) => <RoleBadge role={invitation.role} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (invitation) => (
        <InvitationStatusBadge status={invitation.status} />
      ),
    },
    {
      key: 'expiresAt',
      header: 'Expires',
      render: (invitation) => formatDateTime(invitation.expiresAt),
    },
    {
      key: 'invitedBy',
      header: 'Invited by',
      render: (invitation) => invitation.invitedBy?.fullName ?? 'System',
    },
    {
      key: 'acceptedBy',
      header: 'Accepted by',
      render: (invitation) => invitation.acceptedBy?.fullName ?? 'None',
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (invitation) => formatDate(invitation.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (invitation) => (
        <div className="flex justify-end gap-1">
          <button
            aria-label={`Resend invitation for ${invitation.email}`}
            className={cn(
              'rounded-lg p-2 transition',
              invitation.status === 'PENDING' || invitation.status === 'EXPIRED'
                ? 'text-blue-700 hover:bg-blue-50'
                : 'cursor-not-allowed text-slate-300',
            )}
            disabled={
              invitation.status !== 'PENDING' && invitation.status !== 'EXPIRED'
            }
            onClick={() => openResend(invitation)}
            title={
              invitation.status === 'PENDING' || invitation.status === 'EXPIRED'
                ? 'Resend invitation'
                : 'Accepted and revoked invitations cannot be resent'
            }
            type="button"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label={`Revoke invitation for ${invitation.email}`}
            className={cn(
              'rounded-lg p-2 transition',
              invitation.status === 'PENDING'
                ? 'text-rose-700 hover:bg-rose-50'
                : 'cursor-not-allowed text-slate-300',
            )}
            disabled={invitation.status !== 'PENDING'}
            onClick={() => setRevokeTarget(invitation)}
            title={
              invitation.status === 'PENDING'
                ? 'Revoke invitation'
                : 'Only pending invitations can be revoked'
            }
            type="button"
          >
            <Ban className="h-4 w-4" aria-hidden="true" />
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
            Workspace access
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Invitations
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Invite admin, manager and staff accounts into {workspaceLabel}.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:self-auto"
          onClick={openCreate}
          type="button"
        >
          <MailPlus className="h-4 w-4" aria-hidden="true" />
          Create Invitation
        </button>
      </header>

      {feedback ? (
        <FeedbackBanner
          feedback={feedback}
          onCopy={(inviteUrl) => void handleCopyInviteUrl(inviteUrl)}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[minmax(16rem,1fr)_12rem_12rem_auto_auto]">
          <SearchInput
            isDisabled={isLoading}
            label="Search invitations"
            onChange={setSearchInput}
            onSubmit={submitSearch}
            placeholder="Search email or inviter..."
            value={searchInput}
          />
          <select
            aria-label="Filter invitation role"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => {
              setPage(1)
              setRole(event.target.value as InvitationRole | '')
            }}
            value={role}
          >
            <option value="">All roles</option>
            {invitationRoles.map((invitationRole) => (
              <option key={invitationRole} value={invitationRole}>
                {formatLabel(invitationRole)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter invitation status"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value as InvitationStatus | '')
            }}
            value={status}
          >
            <option value="">All statuses</option>
            {invitationStatuses.map((invitationStatus) => (
              <option key={invitationStatus} value={invitationStatus}>
                {formatLabel(invitationStatus)}
              </option>
            ))}
          </select>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            disabled={isLoading}
            onClick={() => void loadInvitations()}
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

        {loadError && invitations.length === 0 ? (
          <div className="grid min-h-80 place-items-center p-8 text-center">
            <div>
              <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
              <h2 className="mt-4 font-bold text-slate-900">
                Invitations could not load
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {loadError}
              </p>
              <button
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                onClick={() => void loadInvitations()}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        ) : isLoading && invitations.length === 0 ? (
          <LoadingState label="Loading invitations..." />
        ) : invitations.length === 0 ? (
          <EmptyState
            description={
              hasFilters
                ? 'Try changing or clearing the current filters.'
                : 'Create an invitation to add an internal workspace user.'
            }
            icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
            title={hasFilters ? 'No matching invitations' : 'No invitations yet'}
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
                  onClick={() => void loadInvitations()}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : null}
            <DataTable
              caption="Workspace invitations"
              columns={columns}
              getRowKey={(invitation) => invitation.id}
              items={invitations}
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
        description="Create a one-time invitation for an internal CRM user."
        isOpen={isCreateOpen}
        onClose={closeCreate}
        size="md"
        title="Create invitation"
      >
        <CreateInvitationForm
          error={createError}
          onCancel={closeCreate}
          onSubmit={handleCreate}
        />
      </Modal>

      <RevokeInvitationDialog
        invitation={revokeTarget}
        isLoading={isRevoking}
        onCancel={() => {
          if (!isRevoking) {
            setRevokeTarget(null)
          }
        }}
        onConfirm={() => void handleRevoke()}
      />

      <ResendInvitationDialog
        error={resendError}
        invitation={resendTarget}
        isLoading={isResending}
        onCancel={closeResend}
        onSubmit={(values) => void handleResend(values)}
      />
    </div>
  )
}
