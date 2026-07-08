import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Container } from '../common/Container'

export function CTASection() {
  const { t } = useTranslation()

  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <div className="border border-slate-200 bg-[#f8f5f0] px-6 py-12 sm:px-10 lg:px-12 lg:py-14">
          <div className="ops-rule mb-6" />

          <div className="grid items-start gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="editorial-eyebrow">{t('public.cta.eyebrow')}</div>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-[#0b1428] sm:text-4xl">
                {t('public.cta.title')}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
                {t('public.cta.description')}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
              <Link
                to="/consultation"
                className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1428] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 lg:w-auto"
              >
                {t('public.cta.button')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
                <Link
                  to="/admin"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-[#0b1428] transition hover:bg-slate-50"
                >
                  {t('public.cta.adminDemo')}
                </Link>
                <Link
                  to="/portal"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-[#0b1428] transition hover:bg-slate-50"
                >
                  {t('public.cta.customerPortal')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
