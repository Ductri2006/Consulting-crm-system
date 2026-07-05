import { zodResolver } from '@hookform/resolvers/zod'
import type { TFunction } from 'i18next'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Scale } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { LoadingState } from '../../components/admin'
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher'
import { useAuth } from '../../features/auth'

const createLoginSchema = (t: TFunction) =>
  z.object({
    email: z.email(t('validation.email')),
    password: z.string().min(6, t('validation.passwordMin', { count: 6 })),
  })

type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>

interface LoginLocationState {
  from?: {
    pathname?: string
    search?: string
    hash?: string
  }
}

export function AdminLoginPage() {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading, login } = useAuth()
  const loginSchema = useMemo(() => createLoginSchema(t), [t])
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (!isLoading && isAuthenticated) {
    return <Navigate replace to="/admin/dashboard" />
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <LoadingState label={t('auth.adminLogin.restoreSession')} />
      </main>
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      await login(values.email, values.password)
      const state = location.state as LoginLocationState | null
      const destination = state?.from?.pathname
        ? `${state.from.pathname}${state.from.search ?? ''}${state.from.hash ?? ''}`
        : '/admin/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : t('auth.adminLogin.fallbackError'),
      )
    }
  })

  return (
    <main className="relative grid min-h-screen bg-slate-950 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="absolute right-5 top-5 z-20">
        <LanguageSwitcher />
      </div>

      <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 shadow-xl shadow-blue-950">
              <Scale className="h-6 w-6" />
            </span>
            <span className="text-lg font-bold tracking-tight">Advisora CRM</span>
          </div>
        </div>
        <div className="relative max-w-xl pb-12">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.22em] text-blue-400">
            {t('auth.adminLogin.eyebrow')}
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            {t('auth.adminLogin.heading')}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
            {t('auth.adminLogin.subheading')}
          </p>
        </div>
        <p className="relative text-xs text-slate-600">
          {t('auth.adminLogin.footer')}
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-9 lg:hidden">
            <div className="flex items-center gap-3 text-slate-950">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
                <Scale className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">Advisora CRM</span>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-9">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                {t('auth.adminLogin.welcome')}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {t('auth.adminLogin.title')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {t('auth.adminLogin.description')}
              </p>
            </div>

            <form className="mt-8 space-y-5" noValidate onSubmit={onSubmit}>
              <div>
                <label className="field-label" htmlFor="admin-email">
                  {t('auth.adminLogin.emailLabel')}
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoComplete="email"
                    className="field-input pl-11"
                    id="admin-email"
                    placeholder={t('auth.adminLogin.emailPlaceholder')}
                    type="email"
                    {...register('email')}
                  />
                </div>
                {errors.email ? (
                  <p className="field-error">{errors.email.message}</p>
                ) : null}
              </div>

              <div>
                <label className="field-label" htmlFor="admin-password">
                  {t('common.password')}
                </label>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoComplete="current-password"
                    className="field-input px-11"
                    id="admin-password"
                    placeholder={t('auth.adminLogin.passwordPlaceholder')}
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                  />
                  <button
                    aria-label={
                      showPassword
                        ? t('auth.adminLogin.hidePassword')
                        : t('auth.adminLogin.showPassword')
                    }
                    className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
                {errors.password ? (
                  <p className="field-error">{errors.password.message}</p>
                ) : null}
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
                {isSubmitting ? t('auth.adminLogin.signingIn') : t('common.signIn')}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-900">
              <p className="font-bold">{t('auth.adminLogin.portfolioDemo')}</p>
              <p>{t('auth.adminLogin.demoHint')}</p>
            </div>

            <p className="mt-5 text-center text-sm text-slate-500">
              {t('auth.adminLogin.needWorkspace')}{' '}
              <Link
                className="font-bold text-blue-700 underline-offset-4 hover:underline"
                to="/workspace-signup"
              >
                {t('auth.adminLogin.createOne')}
              </Link>
            </p>
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">
            {t('auth.adminLogin.protectedAccess')}
          </p>
        </div>
      </section>
    </main>
  )
}
