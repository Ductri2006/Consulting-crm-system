import { Clock3, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '../components/common/Card'
import { Container } from '../components/common/Container'
import { ContactForm } from '../components/forms/ContactForm'

type ContactDetail = {
  href?: string
  icon: LucideIcon
  labelKey: string
} & (
  | {
      value: string
      valueKey?: undefined
    }
  | {
      value?: undefined
      valueKey: string
    }
)

const contactDetails: ContactDetail[] = [
  {
    labelKey: 'common.email',
    value: 'hello@advisora.demo',
    href: 'mailto:hello@advisora.demo',
    icon: Mail,
  },
  {
    labelKey: 'public.forms.fields.phone',
    value: '+84 900 000 000',
    href: 'tel:+84900000000',
    icon: Phone,
  },
  {
    labelKey: 'public.contactPage.location',
    valueKey: 'public.contactPage.locationValue',
    icon: MapPin,
  },
  {
    labelKey: 'public.contactPage.businessHours',
    valueKey: 'public.contactPage.businessHoursValue',
    icon: Clock3,
  },
]

export function ContactPage() {
  const { t } = useTranslation()

  return (
    <>
      <section className="bg-slate-950 py-20 text-white sm:py-24">
        <Container>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">
            {t('public.contactPage.eyebrow')}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {t('public.contactPage.title')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            {t('public.contactPage.description')}
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                {t('public.contactPage.reachEyebrow')}
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {t('public.contactPage.reachTitle')}
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                {t('public.contactPage.reachDescription')}
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
                          {t(detail.labelKey)}
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-slate-800">
                          {detail.valueKey ? t(detail.valueKey) : detail.value}
                        </span>
                      </span>
                    </>
                  )

                  return detail.href ? (
                    <a
                      key={detail.labelKey}
                      href={detail.href}
                      className="flex items-center gap-4 rounded-xl p-2 transition hover:bg-white hover:shadow-sm"
                    >
                      {content}
                    </a>
                  ) : (
                    <div
                      key={detail.labelKey}
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
                {t('public.contactPage.cardTitle')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t('public.contactPage.cardDescription')}
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
