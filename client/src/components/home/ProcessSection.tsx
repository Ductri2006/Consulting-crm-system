import { useTranslation } from 'react-i18next'
import { processSteps } from '../../data/processSteps'
import { Container } from '../common/Container'
import { SectionHeading } from '../common/SectionHeading'

export function ProcessSection() {
  const { t } = useTranslation()

  return (
    <section className="bg-[#f8f5f0] py-20 sm:py-24">
      <Container>
        <div className="max-w-2xl">
          <SectionHeading
            eyebrow={t('public.process.eyebrow')}
            title={t('public.process.title')}
            description={t('public.process.description')}
          />
        </div>

        <div className="mt-10 space-y-px border border-slate-200 bg-white">
          {processSteps.map((step, index) => (
            <div key={step.id} className="grid items-start gap-x-6 gap-y-1 border-b border-slate-200 px-5 py-5 last:border-b-0 md:grid-cols-12">
              <div className="font-mono text-xs text-slate-400 md:col-span-1">0{index + 1}</div>
              <div className="text-sm font-semibold tracking-tight text-[#0b1428] md:col-span-3">
                {t(`public.process.steps.${step.id}.title`)}
              </div>
              <div className="text-sm leading-relaxed text-slate-600 md:col-span-8">
                {t(`public.process.steps.${step.id}.description`)}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
