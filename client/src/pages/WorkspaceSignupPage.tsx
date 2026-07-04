import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { Container } from '../components/common/Container'
import { useAuth } from '../features/auth'
import {
  signupWorkspace,
  workspaceSignupFormSchema,
  type WorkspaceSignupFormValues,
} from '../features/workspaces'
import { ApiError } from '../lib/apiClient'

const defaultValues: WorkspaceSignupFormValues = {
  workspaceName: '',
  workspaceSlug: '',
  industry: '',
  website: '',
  email: '',
  phone: '',
  address: '',
  ownerFullName: '',
  ownerEmail: '',
  ownerPhone: '',
  password: '',
  confirmPassword: '',
}

function getSignupErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) {
    return 'Workspace signup is currently disabled for this environment.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Workspace signup could not be completed. Please try again.'
}

export function WorkspaceSignupPage() {
  const { acceptSession, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<WorkspaceSignupFormValues>({
    resolver: zodResolver(workspaceSignupFormSchema),
    defaultValues,
  })

  if (!isLoading && isAuthenticated) {
    return <Navigate replace to="/admin/dashboard" />
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      const result = await signupWorkspace(values)
      acceptSession(result.accessToken, result.user)
      navigate('/admin/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(getSignupErrorMessage(error))
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
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            Workspace signup
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Create your CRM workspace
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Set up a private operations space for your team and start with an
            administrator account.
          </p>
        </div>

        <form
          className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-[1fr_0.9fr]"
          noValidate
          onSubmit={onSubmit}
        >
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Workspace information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Name the workspace your team will use.
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="workspace-name">
                    Workspace name
                  </label>
                  <input
                    autoComplete="organization"
                    className="field-input"
                    id="workspace-name"
                    placeholder="Acme Advisory Workspace"
                    type="text"
                    {...register('workspaceName')}
                  />
                  {errors.workspaceName ? (
                    <p className="field-error">{errors.workspaceName.message}</p>
                  ) : null}
                </div>

                <div>
                  <label className="field-label" htmlFor="workspace-slug">
                    Workspace slug <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    autoComplete="off"
                    className="field-input"
                    id="workspace-slug"
                    placeholder="acme-advisory"
                    type="text"
                    {...register('workspaceSlug')}
                  />
                  {errors.workspaceSlug ? (
                    <p className="field-error">{errors.workspaceSlug.message}</p>
                  ) : null}
                </div>

                <div>
                  <label className="field-label" htmlFor="workspace-industry">
                    Industry
                  </label>
                  <input
                    className="field-input"
                    id="workspace-industry"
                    placeholder="Legal consulting"
                    type="text"
                    {...register('industry')}
                  />
                  {errors.industry ? (
                    <p className="field-error">{errors.industry.message}</p>
                  ) : null}
                </div>

                <div>
                  <label className="field-label" htmlFor="workspace-website">
                    Website
                  </label>
                  <input
                    autoComplete="url"
                    className="field-input"
                    id="workspace-website"
                    placeholder="https://example.com"
                    type="url"
                    {...register('website')}
                  />
                  {errors.website ? (
                    <p className="field-error">{errors.website.message}</p>
                  ) : null}
                </div>

                <div>
                  <label className="field-label" htmlFor="workspace-email">
                    Contact email
                  </label>
                  <div className="relative">
                    <Mail
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      autoComplete="email"
                      className="field-input pl-11"
                      id="workspace-email"
                      placeholder="hello@example.com"
                      type="email"
                      {...register('email')}
                    />
                  </div>
                  {errors.email ? (
                    <p className="field-error">{errors.email.message}</p>
                  ) : null}
                </div>

                <div>
                  <label className="field-label" htmlFor="workspace-phone">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      autoComplete="tel"
                      className="field-input pl-11"
                      id="workspace-phone"
                      placeholder="+1 202 555 0100"
                      type="tel"
                      {...register('phone')}
                    />
                  </div>
                  {errors.phone ? (
                    <p className="field-error">{errors.phone.message}</p>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="workspace-address">
                    Address
                  </label>
                  <input
                    autoComplete="street-address"
                    className="field-input"
                    id="workspace-address"
                    placeholder="Office address"
                    type="text"
                    {...register('address')}
                  />
                  {errors.address ? (
                    <p className="field-error">{errors.address.message}</p>
                  ) : null}
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Owner account
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  This user becomes the first administrator.
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <label className="field-label" htmlFor="owner-full-name">
                  Full name
                </label>
                <input
                  autoComplete="name"
                  className="field-input"
                  id="owner-full-name"
                  placeholder="Acme Demo Owner"
                  type="text"
                  {...register('ownerFullName')}
                />
                {errors.ownerFullName ? (
                  <p className="field-error">{errors.ownerFullName.message}</p>
                ) : null}
              </div>

              <div>
                <label className="field-label" htmlFor="owner-email">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoComplete="email"
                    className="field-input pl-11"
                    id="owner-email"
                    placeholder="owner@example.com"
                    type="email"
                    {...register('ownerEmail')}
                  />
                </div>
                {errors.ownerEmail ? (
                  <p className="field-error">{errors.ownerEmail.message}</p>
                ) : null}
              </div>

              <div>
                <label className="field-label" htmlFor="owner-phone">
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
                    id="owner-phone"
                    placeholder="+1 202 555 0101"
                    type="tel"
                    {...register('ownerPhone')}
                  />
                </div>
                {errors.ownerPhone ? (
                  <p className="field-error">{errors.ownerPhone.message}</p>
                ) : null}
              </div>

              <div>
                <label className="field-label" htmlFor="owner-password">
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
                    id="owner-password"
                    placeholder="Create a password"
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
                {errors.password ? (
                  <p className="field-error">{errors.password.message}</p>
                ) : null}
              </div>

              <div>
                <label className="field-label" htmlFor="owner-confirm-password">
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
                    id="owner-confirm-password"
                    placeholder="Confirm password"
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
                {errors.confirmPassword ? (
                  <p className="field-error">
                    {errors.confirmPassword.message}
                  </p>
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
                disabled={isSubmitting || isLoading}
                type="submit"
              >
                {isSubmitting ? 'Creating workspace...' : 'Create workspace'}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
              </button>

              <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-900">
                <p className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Private workspace
                </p>
                <p className="mt-1">
                  You can add manager and staff accounts after signup.
                </p>
              </div>
            </div>
          </section>
        </form>
      </Container>
    </section>
  )
}
