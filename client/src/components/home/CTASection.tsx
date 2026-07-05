import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Container } from '../common/Container'

export function CTASection() {
  const { t } = useTranslation()

  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-blue-700 px-6 py-12 text-white shadow-2xl shadow-blue-950/15 sm:px-10 lg:px-16 lg:py-16">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-32 h-80 w-80 rounded-full border-[55px] border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-36 right-1/3 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl"
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                <CheckCircle2 className="h-4 w-4 text-amber-300" />
                {t('public.cta.eyebrow')}
              </span>
              <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
                {t('public.cta.title')}
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-blue-100">
                {t('public.cta.description')}
              </p>
            </div>
            <Link
              to="/consultation"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-800 shadow-lg transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {t('public.cta.button')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
