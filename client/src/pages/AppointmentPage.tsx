import { CalendarDays, Clock3, ShieldCheck } from 'lucide-react'

import { Card } from '../components/common/Card'
import { Container } from '../components/common/Container'
import { AppointmentForm } from '../components/forms/AppointmentForm'

export function AppointmentPage() {
  return (
    <>
      <section className="border-b border-slate-200 bg-white py-16 sm:py-24">
        <Container>
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
                Appointment request
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Choose a time that works for you
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Request an in-person, online, or phone consultation. We will
                review your preference and confirm the appointment with you.
              </p>
            </div>
            <div className="hidden items-center gap-4 rounded-2xl bg-blue-50 p-5 text-blue-900 sm:flex">
              <CalendarDays className="h-8 w-8" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold">Flexible formats</p>
                <p className="mt-1 text-xs text-blue-700">
                  Offline · Online · Phone
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <Card className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-slate-950">
                Appointment details
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Select your preferences below. Submitting this form does not
                confirm the appointment automatically.
              </p>
              <div className="mt-7">
                <AppointmentForm />
              </div>
            </Card>

            <div className="space-y-5">
              <Card>
                <Clock3 className="h-6 w-6 text-blue-600" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-bold text-slate-950">
                  Confirmation
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Our team will contact you to confirm availability or suggest
                  the nearest suitable time.
                </p>
              </Card>
              <Card>
                <ShieldCheck
                  className="h-6 w-6 text-blue-600"
                  aria-hidden="true"
                />
                <h2 className="mt-4 text-lg font-bold text-slate-950">
                  Prepared conversation
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add useful context in your message so we can prepare for a
                  focused first discussion.
                </p>
              </Card>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
