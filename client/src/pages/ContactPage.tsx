import { Clock3, Mail, MapPin, Phone } from 'lucide-react'

import { Card } from '../components/common/Card'
import { Container } from '../components/common/Container'
import { ContactForm } from '../components/forms/ContactForm'

const contactDetails = [
  {
    label: 'Email',
    value: 'hello@advisora.demo',
    href: 'mailto:hello@advisora.demo',
    icon: Mail,
  },
  {
    label: 'Phone',
    value: '+84 900 000 000',
    href: 'tel:+84900000000',
    icon: Phone,
  },
  {
    label: 'Location',
    value: 'Ho Chi Minh City, Vietnam',
    icon: MapPin,
  },
  {
    label: 'Business hours',
    value: 'Monday–Friday, 8:30–17:30',
    icon: Clock3,
  },
]

export function ContactPage() {
  return (
    <>
      <section className="bg-slate-950 py-20 text-white sm:py-24">
        <Container>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">
            Contact
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Start with a clear conversation
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Tell us what you are working through. We will listen, ask the right
            questions, and help identify a practical next step.
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Reach our team
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                We are ready when you are
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                Use the details below or send a message. We typically respond
                during the next business day.
              </p>

              <div className="mt-8 space-y-4">
                {contactDetails.map((detail) => {
                  const Icon = detail.icon
                  const content = (
                    <>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                          {detail.label}
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-slate-800">
                          {detail.value}
                        </span>
                      </span>
                    </>
                  )

                  return detail.href ? (
                    <a
                      key={detail.label}
                      href={detail.href}
                      className="flex items-center gap-4 rounded-xl p-2 transition hover:bg-white hover:shadow-sm"
                    >
                      {content}
                    </a>
                  ) : (
                    <div
                      key={detail.label}
                      className="flex items-center gap-4 p-2"
                    >
                      {content}
                    </div>
                  )
                })}
              </div>
            </div>

            <Card className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-slate-950">
                Send us a message
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                All fields are required. This demo records submissions locally
                and does not send data to a server.
              </p>
              <div className="mt-7">
                <ContactForm />
              </div>
            </Card>
          </div>
        </Container>
      </section>
    </>
  )
}
