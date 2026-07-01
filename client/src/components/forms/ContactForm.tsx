import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const contactSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  phone: z.string().trim().min(8, 'Please enter a valid phone number.'),
  message: z
    .string()
    .trim()
    .min(10, 'Please tell us a little more about how we can help.'),
})

type ContactFormValues = z.infer<typeof contactSchema>

export function ContactForm() {
  const [isSuccessful, setIsSuccessful] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      message: '',
    },
  })

  const onSubmit = (values: ContactFormValues) => {
    console.log('Contact request submitted:', values)
    reset()
    setIsSuccessful(true)
  }

  if (isSuccessful) {
    return (
      <div
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center"
        role="status"
      >
        <CheckCircle2
          className="mx-auto h-10 w-10 text-emerald-600"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-xl font-bold text-slate-950">
          Thank you for reaching out
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your message has been recorded. Our team will get back to you soon.
        </p>
        <button
          type="button"
          className="mt-5 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          onClick={() => setIsSuccessful(false)}
        >
          Send another message
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
      <div>
        <label className="field-label" htmlFor="contact-full-name">
          Full name
        </label>
        <input
          id="contact-full-name"
          className="field-input"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={
            errors.fullName ? 'contact-full-name-error' : undefined
          }
          {...register('fullName')}
        />
        {errors.fullName && (
          <p
            id="contact-full-name-error"
            className="field-error"
            role="alert"
          >
            {errors.fullName.message}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="contact-email">
            Email
          </label>
          <input
            id="contact-email"
            className="field-input"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="contact-email-error" className="field-error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="contact-phone">
            Phone
          </label>
          <input
            id="contact-phone"
            className="field-input"
            type="tel"
            autoComplete="tel"
            placeholder="+84 900 000 000"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
            {...register('phone')}
          />
          {errors.phone && (
            <p id="contact-phone-error" className="field-error" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          className="field-input min-h-36 resize-y"
          placeholder="Tell us about your goals or current challenge."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? 'contact-message-error' : undefined
          }
          {...register('message')}
        />
        {errors.message && (
          <p id="contact-message-error" className="field-error" role="alert">
            {errors.message.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        Send message
      </button>
    </form>
  )
}
