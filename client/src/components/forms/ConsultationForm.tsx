import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { translateValidationMessage } from '../../i18n/validationMessages'
import { apiClient } from '../../lib/apiClient'

const consultationSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name.'),
  phone: z.string().trim().min(8, 'Please enter a valid phone number.'),
  email: z
    .union([
      z.literal(''),
      z.string().trim().email('Please enter a valid email address.'),
    ])
    .optional(),
  serviceType: z.string().min(1, 'Please select a service.'),
  message: z
    .string()
    .trim()
    .min(10, 'Please provide a brief description of your needs.'),
})

type ConsultationFormValues = z.infer<typeof consultationSchema>

const serviceOptions = [
  {
    labelKey: 'public.forms.services.realEstate',
    value: 'Real Estate Consulting',
  },
  {
    labelKey: 'public.forms.services.legal',
    value: 'Legal Consulting',
  },
  {
    labelKey: 'public.forms.services.investment',
    value: 'Investment Consulting',
  },
  {
    labelKey: 'public.forms.services.construction',
    value: 'Construction Consulting',
  },
] as const

export function ConsultationForm() {
  const { t } = useTranslation()
  const [isSuccessful, setIsSuccessful] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      serviceType: '',
      message: '',
    },
  })

  const onSubmit = async (values: ConsultationFormValues) => {
    setSubmitError(null)

    try {
      await apiClient.post('/public/consultation-requests', {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        message: `Service type: ${values.serviceType}\n\n${values.message}`,
      })
      reset()
      setIsSuccessful(true)
    } catch {
      setSubmitError(t('public.forms.consultation.submitError'))
    }
  }

  if (isSuccessful) {
    return (
      <div
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center"
        role="status"
      >
        <CheckCircle2
          className="mx-auto h-11 w-11 text-emerald-600"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-xl font-bold text-slate-950">
          {t('public.forms.consultation.successTitle')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {t('public.forms.consultation.successDescription')}
        </p>
        <button
          type="button"
          className="mt-5 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          onClick={() => setIsSuccessful(false)}
        >
          {t('public.forms.consultation.submitAnother')}
        </button>
      </div>
    )
  }

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="consultation-full-name">
            {t('public.forms.fields.fullName')}
          </label>
          <input
            id="consultation-full-name"
            className="field-input"
            type="text"
            autoComplete="name"
            placeholder={t('public.forms.placeholders.fullName')}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={
              errors.fullName ? 'consultation-full-name-error' : undefined
            }
            {...register('fullName')}
          />
          {errors.fullName && (
            <p
              id="consultation-full-name-error"
              className="field-error"
              role="alert"
            >
              {translateValidationMessage(t, errors.fullName.message)}
            </p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="consultation-phone">
            {t('public.forms.fields.phone')}
          </label>
          <input
            id="consultation-phone"
            className="field-input"
            type="tel"
            autoComplete="tel"
            placeholder="+84 900 000 000"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={
              errors.phone ? 'consultation-phone-error' : undefined
            }
            {...register('phone')}
          />
          {errors.phone && (
            <p
              id="consultation-phone-error"
              className="field-error"
              role="alert"
            >
              {translateValidationMessage(t, errors.phone.message)}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="consultation-email">
            {t('common.email')}{' '}
            <span className="font-normal text-slate-400">
              ({t('common.optional')})
            </span>
          </label>
          <input
            id="consultation-email"
            className="field-input"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email ? 'consultation-email-error' : undefined
            }
            {...register('email')}
          />
          {errors.email && (
            <p
              id="consultation-email-error"
              className="field-error"
              role="alert"
            >
              {translateValidationMessage(t, errors.email.message)}
            </p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="consultation-service">
            {t('public.forms.consultation.serviceType')}
          </label>
          <select
            id="consultation-service"
            className="field-input"
            aria-invalid={Boolean(errors.serviceType)}
            aria-describedby={
              errors.serviceType ? 'consultation-service-error' : undefined
            }
            {...register('serviceType')}
          >
            <option value="">{t('public.forms.consultation.selectService')}</option>
            {serviceOptions.map((service) => (
              <option key={service.value} value={service.value}>
                {t(service.labelKey)}
              </option>
            ))}
          </select>
          {errors.serviceType && (
            <p
              id="consultation-service-error"
              className="field-error"
              role="alert"
            >
              {translateValidationMessage(t, errors.serviceType.message)}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="consultation-message">
          {t('public.forms.consultation.helpLabel')}
        </label>
        <textarea
          id="consultation-message"
          className="field-input min-h-36 resize-y"
          placeholder={t('public.forms.consultation.messagePlaceholder')}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? 'consultation-message-error' : undefined
          }
          {...register('message')}
        />
        {errors.message && (
          <p
            id="consultation-message-error"
            className="field-error"
            role="alert"
          >
            {translateValidationMessage(t, errors.message.message)}
          </p>
        )}
      </div>

      {submitError ? (
        <p className="field-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {t('public.forms.consultation.button')}
      </button>
    </form>
  )
}
