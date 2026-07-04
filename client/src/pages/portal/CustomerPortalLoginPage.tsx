import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  portalLoginFormSchema,
  type PortalLoginFormValues,
  usePortalAuth,
} from '../../features/customerPortal'

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
  const { isAuthenticated, login } = usePortalAuth()
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
          : 'Portal login failed. Please try again.',
      )
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,28rem)]">
        <section className="hidden lg:block">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
            Advisora customer portal
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-slate-950">
            Secure access for your consulting workspace
          </h1>
          <div className="mt-8 grid max-w-2xl gap-3 text-sm font-medium text-slate-600">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              View your workspace and profile details.
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              Case tracking, documents, and messages are prepared for the next
              portal steps.
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900"
              to="/"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Public site
            </Link>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Customer Portal
                </h2>
                <p className="text-sm text-slate-500">
                  Sign in with your workspace details.
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
                  Workspace slug
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
                  placeholder="advisora-demo"
                  {...register('workspaceSlug')}
                />
                <FieldError
                  id="portal-workspace-slug-error"
                  message={errors.workspaceSlug?.message}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="portal-email">
                  Email
                </label>
                <input
                  aria-describedby={
                    errors.email ? 'portal-email-error' : undefined
                  }
                  aria-invalid={Boolean(errors.email)}
                  autoComplete="email"
                  className="field-input"
                  id="portal-email"
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
                  Password
                </label>
                <input
                  aria-describedby={
                    errors.password ? 'portal-password-error' : undefined
                  }
                  aria-invalid={Boolean(errors.password)}
                  autoComplete="current-password"
                  className="field-input"
                  id="portal-password"
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
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
