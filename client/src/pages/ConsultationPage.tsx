import { CheckCircle2, ClipboardList, MessageSquareText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '../components/common/Card'
import { Container } from '../components/common/Container'
import { ConsultationForm } from '../components/forms/ConsultationForm'

const expectationKeys = [
  'public.consultationPage.expectations.0',
  'public.consultationPage.expectations.1',
  'public.consultationPage.expectations.2',
] as const

export function ConsultationPage() {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div
        className="absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-blue-50 to-transparent"
        aria-hidden="true"
      />
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <MessageSquareText className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            {t('public.consultationPage.eyebrow')}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            {t('public.consultationPage.title')}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            {t('public.consultationPage.description')}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <Card className="h-fit bg-slate-950 text-white">
            <ClipboardList
              className="h-7 w-7 text-blue-300"
              aria-hidden="true"
            />
            <h2 className="mt-5 text-2xl font-bold">
              {t('public.consultationPage.expectationTitle')}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {t('public.consultationPage.expectationDescription')}
            </p>
            <ul className="mt-6 space-y-4">
              {expectationKeys.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-slate-200">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue-300"
                    aria-hidden="true"
                  />
                  {t(item)}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-950">
              {t('public.consultationPage.cardTitle')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t('public.consultationPage.cardDescription')}
            </p>
            <div className="mt-7">
              <ConsultationForm />
            </div>
          </Card>
        </div>
      </Container>
    </section>
  )
}
