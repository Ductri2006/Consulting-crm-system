import { zodResolver } from '@hookform/resolvers/zod'
import type { TFunction } from 'i18next'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher'
import { usePortalAuth } from '../../features/customerPortal'

const createPortalLoginFormSchema = (t: TFunction) =>
  z.object({
    workspaceSlug: z
      .string()
      .trim()
      .min(1, t('validation.workspaceSlugRequired'))
      .max(50, t('validation.workspaceSlugMax'))
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('validation.workspaceSlugFormat')),
    email: z
      .string()
      .trim()
      .min(1, t('validation.emailRequired'))
      .email(t('validation.email')),
    password: z.string().min(1, t('validation.passwordRequired')),
  })

type PortalLoginFormValues = z.infer<ReturnType<typeof createPortalLoginFormSchema>>

const DEFAULT_VALUES: PortalLoginFormValues = {
  workspaceSlug: '',
  email: '',
  password: '',
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

const getRedirectPath = (state: unknown): string => {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof state.from === 'object' &&
    state.from !== null &&
    'pathname' in state.from &&
    typeof state.from.pathname === 'string' &&
    state.from.pathname.startsWith('/portal')
  ) {
    const search =
      'search' in state.from && typeof state.from.search === 'string'
        ? state.from.search
        : ''
    const hash =
      'hash' in state.from && typeof state.from.hash === 'string'
        ? state.from.hash
        : ''

    return `${state.from.pathname}${search}${hash}`
  }

  return '/portal/dashboard'
}

export function CustomerPortalLoginPage() {
  const { t } = useTranslation()
  const { isAuthenticated, login } = usePortalAuth()
  const portalLoginFormSchema = useMemo(
    () => createPortalLoginFormSchema(t),
    [t],
  )
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<PortalLoginFormValues>({
    resolver: zodResolver(portalLoginFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  if (isAuthenticated) {
    return <Navigate replace to="/portal/dashboard" />
  }

  const onSubmit = async (values: PortalLoginFormValues) => {
    setFormError(null)

    try {
      await login(values)
      navigate(getRedirectPath(location.state), { replace: true })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : t('auth.portalLogin.fallbackError'),
      )
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,28rem)]">
        <section className="hidden lg:block">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
              {t('auth.portalLogin.eyebrow')}
            </p>
            <LanguageSwitcher />
          </div>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-slate-950">
            {t('auth.portalLogin.heading')}
          </h1>
          <div className="mt-8 grid max-w-2xl gap-3 text-sm font-medium text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              {t('auth.portalLogin.profileCard')}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              {t('auth.portalLogin.caseCard')}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <Link
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900"
                to="/"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t('auth.portalLogin.backHome')}
              </Link>
              <LanguageSwitcher compact className="lg:hidden" />
            </div>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {t('auth.portalLogin.title')}
                </h2>
                <p className="text-sm text-slate-500">
                  {t('auth.portalLogin.subtitle')}
                </p>
              </div>
            </div>
          </div>

          <form noValidate onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-5 p-5 sm:p-6">
              {formError ? (
                <div
                  className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                  role="alert"
                >
                  {formError}
                </div>
              ) : null}

              <div>
                <label className="field-label" htmlFor="portal-workspace-slug">
                  {t('auth.portalLogin.workspaceSlug')}
                </label>
                <input
                  aria-describedby={
                    errors.workspaceSlug
                      ? 'portal-workspace-slug-error'
                      : undefined
                  }
                  aria-invalid={Boolean(errors.workspaceSlug)}
                  autoComplete="organization"
                  className="field-input"
                  id="portal-workspace-slug"
                  placeholder={t('auth.portalLogin.workspaceSlugPlaceholder')}
                  {...register('workspaceSlug')}
                />
                <FieldError
                  id="portal-workspace-slug-error"
                  message={errors.workspaceSlug?.message}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="portal-email">
                  {t('common.email')}
                </label>
                <input
                  aria-describedby={
                    errors.email ? 'portal-email-error' : undefined
                  }
                  aria-invalid={Boolean(errors.email)}
                  autoComplete="email"
                  className="field-input"
                  id="portal-email"
                  placeholder={t('auth.portalLogin.emailPlaceholder')}
                  type="email"
                  {...register('email')}
                />
                <FieldError
                  id="portal-email-error"
                  message={errors.email?.message}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="portal-password">
                  {t('common.password')}
                </label>
                <input
                  aria-describedby={
                    errors.password ? 'portal-password-error' : undefined
                  }
                  aria-invalid={Boolean(errors.password)}
                  autoComplete="current-password"
                  className="field-input"
                  id="portal-password"
                  placeholder={t('auth.portalLogin.passwordPlaceholder')}
                  type="password"
                  {...register('password')}
                />
                <FieldError
                  id="portal-password-error"
                  message={errors.password?.message}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
              <button
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? t('auth.portalLogin.signingIn')
                  : t('auth.portalLogin.signIn')}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
