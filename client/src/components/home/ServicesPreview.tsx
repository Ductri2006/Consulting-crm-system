import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { services } from '../../data/services'
import { getLocalizedService } from '../../i18n/staticContent'
import { Card } from '../common/Card'
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

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => {
            const localizedService = getLocalizedService(t, service)
            const Icon = service.icon

            return (
              <Card
                key={service.id}
                className="group relative flex h-full flex-col overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
              >
                <span className="absolute right-5 top-4 text-5xl font-bold text-slate-100 transition group-hover:text-blue-50">
                  0{index + 1}
                </span>
                <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="relative mt-6 text-xl font-bold text-slate-950">
                  {localizedService.title}
                </h3>
                <p className="relative mt-3 flex-1 text-sm leading-6 text-slate-600">
                  {localizedService.shortDescription}
                </p>
                <Link
                  to={`/services/${localizedService.slug}`}
                  className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition group-hover:gap-3"
                >
                  {t('public.viewService')}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Card>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
