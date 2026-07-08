import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { services } from '../../data/services'
import { getLocalizedService } from '../../i18n/staticContent'
import { Container } from '../common/Container'
import { SectionHeading } from '../common/SectionHeading'

export function ServicesPreview() {
  const { t } = useTranslation()

  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow={t('public.home.servicesEyebrow')}
            title={t('public.home.servicesTitle')}
            description={t('public.home.servicesDescription')}
          />
          <Link
            to="/services"
            className="inline-flex shrink-0 items-center gap-2 font-semibold text-blue-700 transition hover:text-blue-900"
          >
            {t('public.exploreAllServices')}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 divide-y divide-slate-200 border border-slate-200 bg-white">
          {services.map((service, index) => {
            const localizedService = getLocalizedService(t, service)

            return (
              <div key={service.id} className="grid items-start gap-x-8 gap-y-2 px-6 py-5 md:grid-cols-12">
                <div className="font-mono text-xs text-slate-400 md:col-span-1">0{index + 1}</div>
                <div className="md:col-span-4">
                  <h3 className="text-base font-semibold tracking-tight text-[#0b1428]">
                    {localizedService.title}
                  </h3>
                </div>
                <div className="text-sm leading-relaxed text-slate-600 md:col-span-5">
                  {localizedService.shortDescription}
                </div>
                <div className="md:col-span-2 md:text-right">
                  <Link
                    to={`/services/${localizedService.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#2a5a49] hover:underline"
                  >
                    {t('public.viewService')}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
