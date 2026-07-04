import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { Container } from '../components/common/Container'
import { LoadingState } from '../components/admin'
import { useAuth } from '../features/auth'
import {
  acceptInvitation,
  acceptInvitationFormSchema,
  previewInvitation,
  type AcceptInvitationFormValues,
  type InvitationPreview,
} from '../features/invitations'

const defaultValues: AcceptInvitationFormValues = {
  fullName: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

const formatLabel = (value: string): string =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')

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

function FieldError({
  message,
}: {
  message?: string
}) {
  return message ? <p className="field-error">{message}</p> : null
}

function InvalidInviteState({
  message,
}: {
  message: string
}) {
  return (
    <section className="bg-slate-50 py-16">
      <Container>
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <Mail className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            Invitation unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        </div>
      </Container>
    </section>
  )
}

function AuthenticatedInviteBlock({
  onLogout,
}: {
  onLogout: () => void
}) {
  return (
    <section className="bg-slate-50 py-16">
      <Container>
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            Please log out before accepting an invitation
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Invitations create a new workspace account for the invited email.
            Finish your current session first so the invite is accepted by the
            right person.
          </p>
          <button
            className="mt-6 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            onClick={onLogout}
            type="button"
          >
            Log out
          </button>
        </div>
      </Container>
    </section>
  )
}

export function InviteAcceptPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const {
    acceptSession,
    isAuthenticated,
    isLoading: isAuthLoading,
    logout,
  } = useAuth()
  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(true)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<AcceptInvitationFormValues>({
    resolver: zodResolver(acceptInvitationFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isAuthLoading || isAuthenticated) {
      return
    }

    if (!token) {
      setPreview(null)
      setPreviewError('This invitation link is missing a token.')
      setIsPreviewLoading(false)
      return
    }

    let isActive = true
    setIsPreviewLoading(true)
    setPreviewError(null)

    previewInvitation(token)
      .then((result) => {
        if (isActive) {
          setPreview(result)
        }
      })
      .catch((error) => {
        if (isActive) {
          setPreview(null)
          setPreviewError(
            getErrorMessage(
              error,
              'This invitation is invalid, expired, revoked, or already accepted.',
            ),
          )
        }
      })
      .finally(() => {
        if (isActive) {
          setIsPreviewLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [isAuthenticated, isAuthLoading, token])

  if (isAuthLoading) {
    return <LoadingState label="Checking session..." />
  }

  if (isAuthenticated) {
    return <AuthenticatedInviteBlock onLogout={() => void logout()} />
  }

  if (isPreviewLoading) {
    return <LoadingState label="Loading invitation..." />
  }

  if (previewError || !preview || !token) {
    return (
      <InvalidInviteState
        message={
          previewError ??
          'This invitation is invalid, expired, revoked, or already accepted.'
        }
      />
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      const result = await acceptInvitation(token, values)
      acceptSession(result.accessToken, result.user)
      navigate('/admin/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(
        getErrorMessage(error, 'Invitation could not be accepted.'),
      )
    }
  })

  return (
    <section className="relative overflow-hidden bg-slate-50 py-12 sm:py-16">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-blue-50 to-transparent"
      />
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Mail className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            Workspace invitation
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Join {preview.organization.name}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Complete your account for the invited email and enter the CRM
            workspace.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Invitation details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Access is scoped to this workspace.
                </p>
              </div>
            </div>

            <dl className="mt-7 divide-y divide-slate-100 text-sm">
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="font-semibold text-slate-500">Workspace</dt>
                <dd className="text-right font-bold text-slate-950">
                  {preview.organization.name}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="font-semibold text-slate-500">Email</dt>
                <dd className="max-w-72 truncate text-right font-bold text-slate-950">
                  {preview.email}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="font-semibold text-slate-500">Role</dt>
                <dd className="font-bold text-slate-950">
                  {formatLabel(preview.role)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="font-semibold text-slate-500">Expires</dt>
                <dd className="text-right font-bold text-slate-950">
                  {formatDateTime(preview.expiresAt)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-900">
              <p className="flex items-center gap-2 font-bold">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Invitation-scoped access
              </p>
              <p className="mt-1">
                Your role and workspace come from the invitation.
              </p>
            </div>
          </section>

          <form
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
            noValidate
            onSubmit={onSubmit}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Account setup
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create the login attached to the invited email.
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <label className="field-label" htmlFor="invite-full-name">
                  Full name
                </label>
                <input
                  autoComplete="name"
                  className="field-input"
                  id="invite-full-name"
                  type="text"
                  {...register('fullName')}
                />
                <FieldError message={errors.fullName?.message} />
              </div>

              <div>
                <label className="field-label" htmlFor="invite-phone">
                  Phone <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <Phone
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoComplete="tel"
                    className="field-input pl-11"
                    id="invite-phone"
                    type="tel"
                    {...register('phone')}
                  />
                </div>
                <FieldError message={errors.phone?.message} />
              </div>

              <div>
                <label className="field-label" htmlFor="invite-password">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoComplete="new-password"
                    className="field-input px-11"
                    id="invite-password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <FieldError message={errors.password?.message} />
              </div>

              <div>
                <label className="field-label" htmlFor="invite-confirm-password">
                  Confirm password
                </label>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoComplete="new-password"
                    className="field-input px-11"
                    id="invite-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                  />
                  <button
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    type="button"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <FieldError message={errors.confirmPassword?.message} />
              </div>

              {submitError ? (
                <div
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                  role="alert"
                >
                  {submitError}
                </div>
              ) : null}

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Accepting invitation...' : 'Accept invitation'}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
            </div>
          </form>
        </div>
      </Container>
    </section>
  )
}
