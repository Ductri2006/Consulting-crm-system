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
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Container } from '../components/common/Container'
import { LoadingState } from '../components/admin'
import { LanguageSwitcher } from '../components/common/LanguageSwitcher'
import { useAuth } from '../features/auth'
import {
  acceptInvitation,
  acceptInvitationFormSchema,
  previewInvitation,
  type AcceptInvitationFormValues,
  type InvitationPreview,
} from '../features/invitations'
import { formatDateTime } from '../i18n/format'
import { getStatusLabel } from '../i18n/statusLabels'
import { translateValidationMessage } from '../i18n/validationMessages'

const defaultValues: AcceptInvitationFormValues = {
  fullName: '',
  phone: '',
  password: '',
  confirmPassword: '',
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
  const { t } = useTranslation()

  return (
    <section className="bg-slate-50 py-16">
      <Container>
        <div className="mb-8 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <Mail className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            {t('auth.inviteAccept.unavailableTitle')}
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
  const { t } = useTranslation()

  return (
    <section className="bg-slate-50 py-16">
      <Container>
        <div className="mb-8 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            {t('auth.inviteAccept.logoutTitle')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {t('auth.inviteAccept.logoutDescription')}
          </p>
          <button
            className="mt-6 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            onClick={onLogout}
            type="button"
          >
            {t('common.logout')}
          </button>
        </div>
      </Container>
    </section>
  )
}

export function InviteAcceptPage() {
  const { t } = useTranslation()
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
      setPreviewError(t('auth.inviteAccept.missingToken'))
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
              t('auth.inviteAccept.staleInvitation'),
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
  }, [isAuthenticated, isAuthLoading, t, token])

  if (isAuthLoading) {
    return <LoadingState label={t('auth.inviteAccept.checkingSession')} />
  }

  if (isAuthenticated) {
    return <AuthenticatedInviteBlock onLogout={() => void logout()} />
  }

  if (isPreviewLoading) {
    return <LoadingState label={t('auth.inviteAccept.loading')} />
  }

  if (previewError || !preview || !token) {
    return (
      <InvalidInviteState
        message={
          previewError ??
          t('auth.inviteAccept.staleInvitation')
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
        getErrorMessage(error, t('auth.inviteAccept.acceptError')),
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
        <div className="mb-8 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mx-auto max-w-3xl text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Mail className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            {t('auth.inviteAccept.eyebrow')}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            {t('auth.inviteAccept.title', {
              workspace: preview.organization.name,
            })}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
            {t('auth.inviteAccept.description')}
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
                  {t('auth.inviteAccept.detailsTitle')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t('auth.inviteAccept.detailsDescription')}
                </p>
              </div>
            </div>

            <dl className="mt-7 divide-y divide-slate-100 text-sm">
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="font-semibold text-slate-500">
                  {t('navigation.workspace')}
                </dt>
                <dd className="text-right font-bold text-slate-950">
                  {preview.organization.name}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="font-semibold text-slate-500">
                  {t('common.email')}
                </dt>
                <dd className="max-w-72 truncate text-right font-bold text-slate-950">
                  {preview.email}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="font-semibold text-slate-500">
                  {t('auth.inviteAccept.role')}
                </dt>
                <dd className="font-bold text-slate-950">
                  {getStatusLabel(t, 'role', preview.role)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="font-semibold text-slate-500">
                  {t('auth.inviteAccept.expires')}
                </dt>
                <dd className="text-right font-bold text-slate-950">
                  {formatDateTime(preview.expiresAt)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-900">
              <p className="flex items-center gap-2 font-bold">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {t('auth.inviteAccept.scopedAccess')}
              </p>
              <p className="mt-1">
                {t('auth.inviteAccept.scopedAccessDescription')}
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
                  {t('auth.inviteAccept.accountSetup')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t('auth.inviteAccept.accountSetupDescription')}
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <label className="field-label" htmlFor="invite-full-name">
                  {t('admin.customers.fields.fullName')}
                </label>
                <input
                  autoComplete="name"
                  className="field-input"
                  id="invite-full-name"
                  type="text"
                  {...register('fullName')}
                />
                <FieldError
                  message={translateValidationMessage(t, errors.fullName?.message)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="invite-phone">
                  {t('admin.customers.fields.phone')}{' '}
                  <span className="font-normal text-slate-400">
                    ({t('common.optional')})
                  </span>
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
                <FieldError
                  message={translateValidationMessage(t, errors.phone?.message)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="invite-password">
                  {t('common.password')}
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
                    aria-label={
                      showPassword
                        ? t('auth.adminLogin.hidePassword')
                        : t('auth.adminLogin.showPassword')
                    }
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
                <FieldError
                  message={translateValidationMessage(t, errors.password?.message)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="invite-confirm-password">
                  {t('auth.workspaceSignup.fields.confirmPassword')}
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
                      showConfirmPassword
                        ? t('auth.adminLogin.hidePassword')
                        : t('auth.adminLogin.showPassword')
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
                <FieldError
                  message={translateValidationMessage(
                    t,
                    errors.confirmPassword?.message,
                  )}
                />
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
                {isSubmitting
                  ? t('auth.inviteAccept.accepting')
                  : t('auth.inviteAccept.accept')}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
            </div>
          </form>
        </div>
      </Container>
    </section>
  )
}
