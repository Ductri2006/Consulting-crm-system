import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Info,
  RefreshCw,
  RotateCcw,
  Save,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { LoadingState } from '../../components/admin'
import { useAuth } from '../../features/auth'
import {
  getCurrentWorkspace,
  updateCurrentWorkspace,
  workspaceSettingsFormSchema,
  type UpdateWorkspaceInput,
  type WorkspaceProfile,
  type WorkspaceSettingsFormValues,
} from '../../features/workspaces'
import { cn } from '../../utils/cn'

const EMPTY_FORM: WorkspaceSettingsFormValues = {
  name: '',
  slug: '',
  industry: '',
  website: '',
  email: '',
  phone: '',
  address: '',
  logoUrl: '',
}

interface Feedback {
  type: 'success' | 'error'
  message: string
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

const optionalValue = (value: string): string | null => {
  const trimmed = value.trim()
  return trimmed || null
}

const toFormValues = (
  workspace: WorkspaceProfile | null,
): WorkspaceSettingsFormValues => ({
  name: workspace?.name ?? '',
  slug: workspace?.slug ?? '',
  industry: workspace?.industry ?? '',
  website: workspace?.website ?? '',
  email: workspace?.email ?? '',
  phone: workspace?.phone ?? '',
  address: workspace?.address ?? '',
  logoUrl: workspace?.logoUrl ?? '',
})

const toUpdateInput = (
  values: WorkspaceSettingsFormValues,
): UpdateWorkspaceInput => ({
  name: values.name.trim(),
  slug: values.slug.trim(),
  industry: optionalValue(values.industry),
  website: optionalValue(values.website),
  email: optionalValue(values.email),
  phone: optionalValue(values.phone),
  address: optionalValue(values.address),
  logoUrl: optionalValue(values.logoUrl),
})

const formatDateTime = (value?: string): string => {
  if (!value) {
    return 'None'
  }

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

function MetadataItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-all text-sm font-semibold text-slate-800">
        {value || 'None'}
      </dd>
    </div>
  )
}

export function AdminWorkspaceSettingsPage() {
  const { refreshCurrentUser } = useAuth()
  const [workspace, setWorkspace] = useState<WorkspaceProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const loadSequence = useRef(0)
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<WorkspaceSettingsFormValues>({
    resolver: zodResolver(workspaceSettingsFormSchema),
    defaultValues: EMPTY_FORM,
  })

  const loadWorkspace = useCallback(async () => {
    const sequence = ++loadSequence.current
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await getCurrentWorkspace()

      if (sequence === loadSequence.current) {
        setWorkspace(result)
        reset(toFormValues(result))
      }
    } catch (error) {
      if (sequence === loadSequence.current) {
        setLoadError(getErrorMessage(error, 'Workspace settings could not load.'))
      }
    } finally {
      if (sequence === loadSequence.current) {
        setIsLoading(false)
      }
    }
  }, [reset])

  useEffect(() => {
    void loadWorkspace()
  }, [loadWorkspace])

  const handleDiscard = () => {
    reset(toFormValues(workspace))
    setFeedback(null)
  }

  const handleSave = async (values: WorkspaceSettingsFormValues) => {
    setFeedback(null)

    try {
      const updated = await updateCurrentWorkspace(toUpdateInput(values))
      setWorkspace(updated)
      reset(toFormValues(updated))
      await refreshCurrentUser()
      setFeedback({
        type: 'success',
        message: 'Workspace settings updated successfully.',
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Workspace settings could not be updated.'),
      })
    }
  }

  if (isLoading && !workspace) {
    return <LoadingState label="Loading workspace settings..." />
  }

  if (loadError && !workspace) {
    return (
      <div className="mx-auto grid min-h-96 max-w-2xl place-items-center text-center">
        <div>
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
          <h1 className="mt-4 text-xl font-bold text-slate-950">
            Workspace settings could not load
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{loadError}</p>
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
            onClick={() => void loadWorkspace()}
            type="button"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Workspace administration
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Workspace Settings
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Update the organization profile used by the CRM workspace.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
          disabled={isLoading}
          onClick={() => void loadWorkspace()}
          type="button"
        >
          <RefreshCw
            className={cn('h-4 w-4', isLoading && 'animate-spin')}
            aria-hidden="true"
          />
          Refresh
        </button>
      </header>

      {feedback ? (
        <FeedbackBanner
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      {loadError && workspace ? (
        <div
          className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="alert"
        >
          Refresh failed: {loadError}. Showing cached settings.
        </div>
      ) : null}

      <form
        className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]"
        noValidate
        onSubmit={handleSubmit(handleSave)}
      >
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Workspace profile
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Edit the visible identity and contact details for this workspace.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="workspace-settings-name">
                Workspace name <span aria-hidden="true">*</span>
              </label>
              <input
                aria-describedby={
                  errors.name ? 'workspace-settings-name-error' : undefined
                }
                aria-invalid={Boolean(errors.name)}
                autoComplete="organization"
                className="field-input"
                id="workspace-settings-name"
                {...register('name')}
              />
              <FieldError
                id="workspace-settings-name-error"
                message={errors.name?.message}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="workspace-settings-slug">
                Workspace slug <span aria-hidden="true">*</span>
              </label>
              <input
                aria-describedby={
                  errors.slug ? 'workspace-settings-slug-error' : undefined
                }
                aria-invalid={Boolean(errors.slug)}
                autoComplete="off"
                className="field-input"
                id="workspace-settings-slug"
                {...register('slug')}
              />
              <FieldError
                id="workspace-settings-slug-error"
                message={errors.slug?.message}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="workspace-settings-industry">
                Industry
              </label>
              <input
                aria-describedby={
                  errors.industry
                    ? 'workspace-settings-industry-error'
                    : undefined
                }
                aria-invalid={Boolean(errors.industry)}
                className="field-input"
                id="workspace-settings-industry"
                {...register('industry')}
              />
              <FieldError
                id="workspace-settings-industry-error"
                message={errors.industry?.message}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="workspace-settings-website">
                Website
              </label>
              <input
                aria-describedby={
                  errors.website
                    ? 'workspace-settings-website-error'
                    : undefined
                }
                aria-invalid={Boolean(errors.website)}
                autoComplete="url"
                className="field-input"
                id="workspace-settings-website"
                placeholder="https://example.com"
                type="url"
                {...register('website')}
              />
              <FieldError
                id="workspace-settings-website-error"
                message={errors.website?.message}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="workspace-settings-email">
                Contact email
              </label>
              <input
                aria-describedby={
                  errors.email ? 'workspace-settings-email-error' : undefined
                }
                aria-invalid={Boolean(errors.email)}
                autoComplete="email"
                className="field-input"
                id="workspace-settings-email"
                placeholder="hello@example.com"
                type="email"
                {...register('email')}
              />
              <FieldError
                id="workspace-settings-email-error"
                message={errors.email?.message}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="workspace-settings-phone">
                Phone
              </label>
              <input
                aria-describedby={
                  errors.phone ? 'workspace-settings-phone-error' : undefined
                }
                aria-invalid={Boolean(errors.phone)}
                autoComplete="tel"
                className="field-input"
                id="workspace-settings-phone"
                type="tel"
                {...register('phone')}
              />
              <FieldError
                id="workspace-settings-phone-error"
                message={errors.phone?.message}
              />
            </div>

            <div className="md:col-span-2">
              <label className="field-label" htmlFor="workspace-settings-address">
                Address
              </label>
              <input
                aria-describedby={
                  errors.address
                    ? 'workspace-settings-address-error'
                    : undefined
                }
                aria-invalid={Boolean(errors.address)}
                autoComplete="street-address"
                className="field-input"
                id="workspace-settings-address"
                {...register('address')}
              />
              <FieldError
                id="workspace-settings-address-error"
                message={errors.address?.message}
              />
            </div>

            <div className="md:col-span-2">
              <label className="field-label" htmlFor="workspace-settings-logo-url">
                Logo URL
              </label>
              <input
                aria-describedby={
                  errors.logoUrl
                    ? 'workspace-settings-logo-url-error'
                    : undefined
                }
                aria-invalid={Boolean(errors.logoUrl)}
                className="field-input"
                id="workspace-settings-logo-url"
                placeholder="https://example.com/logo.png"
                type="url"
                {...register('logoUrl')}
              />
              <FieldError
                id="workspace-settings-logo-url-error"
                message={errors.logoUrl?.message}
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting || !isDirty}
              onClick={handleDiscard}
              type="button"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Discard changes
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !isDirty}
              type="submit"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-950">
              Metadata / Read-only info
            </h2>
            <dl className="mt-4 grid gap-3">
              <MetadataItem label="Workspace ID" value={workspace?.id ?? ''} />
              <MetadataItem
                label="Current slug"
                value={workspace?.slug ?? ''}
              />
              <MetadataItem
                label="Created at"
                value={formatDateTime(workspace?.createdAt)}
              />
              <MetadataItem
                label="Updated at"
                value={formatDateTime(workspace?.updatedAt)}
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="font-bold text-amber-950">Workspace notes</h2>
                <p className="mt-2">
                  Workspace slug is used as an internal identifier. Changing it
                  does not change existing data ownership.
                </p>
                <p className="mt-2">
                  Public consultation requests still use the default organization
                  configured by the backend.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </form>
    </div>
  )
}
