import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { processSteps } from '../../data/processSteps'
import { Container } from '../common/Container'
import { SectionHeading } from '../common/SectionHeading'

export function ProcessSection() {
  const { t } = useTranslation()

  return (
    <section className="overflow-hidden bg-slate-50 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow={t('public.process.eyebrow')}
          title={t('public.process.title')}
          description={t('public.process.description')}
          center
        />

        <ol className="relative mt-14 grid gap-5 md:grid-cols-5">
          <div
            aria-hidden="true"
            className="absolute left-[10%] right-[10%] top-7 hidden border-t-2 border-dashed border-blue-200 md:block"
          />
          {processSteps.map((step, index) => (
            <li
              key={step.id}
              className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:border-0 md:bg-transparent md:p-0 md:text-center md:shadow-none"
            >
              <div className="flex items-center gap-4 md:flex-col">
                <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-4 border-slate-50 bg-slate-950 font-bold text-white shadow-md">
                  {index === processSteps.length - 1 ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </span>
                <div className="md:mt-3">
                  <h3 className="font-bold text-slate-950">
                    {t(`public.process.steps.${step.id}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {t(`public.process.steps.${step.id}.description`)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
