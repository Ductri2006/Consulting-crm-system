import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarCheck2, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { translateValidationMessage } from '../../i18n/validationMessages'

const appointmentSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name.'),
  phone: z.string().trim().min(8, 'Please enter a valid phone number.'),
  email: z
    .union([
      z.literal(''),
      z.string().trim().email('Please enter a valid email address.'),
    ])
    .optional(),
  preferredDate: z.string().min(1, 'Please select a preferred date.'),
  preferredTime: z.string().min(1, 'Please select a preferred time.'),
  method: z.enum(['Offline', 'Online', 'Phone'], {
    error: 'Please select a consultation method.',
  }),
  message: z.string().trim(),
})

type AppointmentFormValues = z.infer<typeof appointmentSchema>

const consultationMethods = ['Offline', 'Online', 'Phone'] as const

export function AppointmentForm() {
  const { t } = useTranslation()
  const [isSuccessful, setIsSuccessful] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      preferredDate: '',
      preferredTime: '',
      method: undefined,
      message: '',
    },
  })

  const onSubmit = () => {
    reset()
    setIsSuccessful(true)
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
          {t('public.forms.appointment.successTitle')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {t('public.forms.appointment.successDescription')}
        </p>
        <button
          type="button"
          className="mt-5 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          onClick={() => setIsSuccessful(false)}
        >
          {t('public.forms.appointment.requestAnother')}
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
          <label className="field-label" htmlFor="appointment-full-name">
            {t('public.forms.fields.fullName')}
          </label>
          <input
            id="appointment-full-name"
            className="field-input"
            type="text"
            autoComplete="name"
            placeholder={t('public.forms.placeholders.fullName')}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={
              errors.fullName ? 'appointment-full-name-error' : undefined
            }
            {...register('fullName')}
          />
          {errors.fullName && (
            <p
              id="appointment-full-name-error"
              className="field-error"
              role="alert"
            >
              {translateValidationMessage(t, errors.fullName.message)}
            </p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="appointment-phone">
            {t('public.forms.fields.phone')}
          </label>
          <input
            id="appointment-phone"
            className="field-input"
            type="tel"
            autoComplete="tel"
            placeholder="+84 900 000 000"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={
              errors.phone ? 'appointment-phone-error' : undefined
            }
            {...register('phone')}
          />
          {errors.phone && (
            <p
              id="appointment-phone-error"
              className="field-error"
              role="alert"
            >
              {translateValidationMessage(t, errors.phone.message)}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="appointment-email">
          {t('common.email')}{' '}
          <span className="font-normal text-slate-400">
            ({t('common.optional')})
          </span>
        </label>
        <input
          id="appointment-email"
          className="field-input"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={
            errors.email ? 'appointment-email-error' : undefined
          }
          {...register('email')}
        />
        {errors.email && (
          <p id="appointment-email-error" className="field-error" role="alert">
            {translateValidationMessage(t, errors.email.message)}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="appointment-date">
            {t('public.forms.appointment.preferredDate')}
          </label>
          <input
            id="appointment-date"
            className="field-input"
            type="date"
            aria-invalid={Boolean(errors.preferredDate)}
            aria-describedby={
              errors.preferredDate ? 'appointment-date-error' : undefined
            }
            {...register('preferredDate')}
          />
          {errors.preferredDate && (
            <p
              id="appointment-date-error"
              className="field-error"
              role="alert"
            >
              {translateValidationMessage(t, errors.preferredDate.message)}
            </p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="appointment-time">
            {t('public.forms.appointment.preferredTime')}
          </label>
          <input
            id="appointment-time"
            className="field-input"
            type="time"
            aria-invalid={Boolean(errors.preferredTime)}
            aria-describedby={
              errors.preferredTime ? 'appointment-time-error' : undefined
            }
            {...register('preferredTime')}
          />
          {errors.preferredTime && (
            <p
              id="appointment-time-error"
              className="field-error"
              role="alert"
            >
              {translateValidationMessage(t, errors.preferredTime.message)}
            </p>
          )}
        </div>
      </div>

      <fieldset>
        <legend className="field-label">
          {t('public.forms.appointment.method')}
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {consultationMethods.map((method) => (
            <label
              key={method}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <input
                type="radio"
                value={method}
                className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                aria-invalid={Boolean(errors.method)}
                aria-describedby={
                  errors.method ? 'appointment-method-error' : undefined
                }
                {...register('method')}
              />
              {t(`public.forms.methods.${method}`)}
            </label>
          ))}
        </div>
        {errors.method && (
          <p id="appointment-method-error" className="field-error" role="alert">
            {translateValidationMessage(t, errors.method.message)}
          </p>
        )}
      </fieldset>

      <div>
        <label className="field-label" htmlFor="appointment-message">
          {t('public.forms.contact.messageLabel')}{' '}
          <span className="font-normal text-slate-400">
            ({t('common.optional')})
          </span>
        </label>
        <textarea
          id="appointment-message"
          className="field-input min-h-28 resize-y"
          placeholder={t('public.forms.appointment.messagePlaceholder')}
          {...register('message')}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
        {t('public.forms.appointment.button')}
      </button>
    </form>
  )
}
