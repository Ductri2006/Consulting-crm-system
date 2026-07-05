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
import { useTranslation } from 'react-i18next'
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
import { formatDateTime as formatLocalizedDateTime } from '../../i18n/format'
import { translateValidationMessage } from '../../i18n/validationMessages'
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

function FieldError({
  id,
  message,
}: {
  id: string
  message?: string
}) {
  const { t } = useTranslation()

  return message ? (
    <p className="field-error" id={id}>
      {translateValidationMessage(t, message)}
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

function MetadataItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-all text-sm font-semibold text-slate-800">
        {value || t('common.notProvided')}
      </dd>
    </div>
  )
}

export function AdminWorkspaceSettingsPage() {
  const { t } = useTranslation()
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
        setLoadError(getErrorMessage(error, t('admin.workspaceSettings.loadError')))
      }
    } finally {
      if (sequence === loadSequence.current) {
        setIsLoading(false)
      }
    }
  }, [reset, t])

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
        message: t('admin.workspaceSettings.updatedFeedback'),
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, t('admin.workspaceSettings.updateError')),
      })
    }
  }

  if (isLoading && !workspace) {
    return <LoadingState label={t('admin.workspaceSettings.loading')} />
  }

  if (loadError && !workspace) {
    return (
      <div className="mx-auto grid min-h-96 max-w-2xl place-items-center text-center">
        <div>
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
          <h1 className="mt-4 text-xl font-bold text-slate-950">
            {t('admin.workspaceSettings.loadErrorTitle')}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{loadError}</p>
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
            onClick={() => void loadWorkspace()}
            type="button"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('common.tryAgain')}
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
            {t('admin.workspaceSettings.eyebrow')}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {t('admin.workspaceSettings.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('admin.workspaceSettings.description')}
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
          {t('common.refresh')}
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
          {t('admin.workspaceSettings.refreshFailed', {
            message: loadError,
          })}
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
                {t('admin.workspaceSettings.profileTitle')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('admin.workspaceSettings.profileDescription')}
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="workspace-settings-name">
                {t('auth.workspaceSignup.fields.workspaceName')}{' '}
                <span aria-hidden="true">*</span>
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
                {t('auth.workspaceSignup.fields.workspaceSlug')}{' '}
                <span aria-hidden="true">*</span>
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
                {t('auth.workspaceSignup.fields.industry')}
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
                {t('auth.workspaceSignup.fields.website')}
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
                {t('auth.workspaceSignup.fields.contactEmail')}
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
                {t('admin.customers.fields.phone')}
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
                {t('admin.customers.fields.address')}
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
                {t('admin.workspaceSettings.logoUrl')}
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
              {t('admin.workspaceSettings.discardChanges')}
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
              {isSubmitting ? t('admin.workspaceSettings.saving') : t('common.saveChanges')}
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-950">
              {t('admin.workspaceSettings.metadataTitle')}
            </h2>
            <dl className="mt-4 grid gap-3">
              <MetadataItem
                label={t('admin.workspaceSettings.workspaceId')}
                value={workspace?.id ?? ''}
              />
              <MetadataItem
                label={t('admin.workspaceSettings.currentSlug')}
                value={workspace?.slug ?? ''}
              />
              <MetadataItem
                label={t('admin.workspaceSettings.createdAt')}
                value={formatLocalizedDateTime(workspace?.createdAt ?? null)}
              />
              <MetadataItem
                label={t('admin.workspaceSettings.updatedAt')}
                value={formatLocalizedDateTime(workspace?.updatedAt ?? null)}
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="font-bold text-amber-950">
                  {t('admin.workspaceSettings.notesTitle')}
                </h2>
                <p className="mt-2">
                  {t('admin.workspaceSettings.slugNote')}
                </p>
                <p className="mt-2">
                  {t('admin.workspaceSettings.defaultOrgNote')}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </form>
    </div>
  )
}
