import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Eye,
  Handshake,
  Lightbulb,
  Scale,
  ShieldCheck,
  Target,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card } from '../components/common/Card'
import { Container } from '../components/common/Container'
import { SectionHeading } from '../components/common/SectionHeading'

const values = [
  {
    key: 'trust',
    icon: ShieldCheck,
  },
  {
    key: 'clarity',
    icon: Lightbulb,
  },
  {
    key: 'responsibility',
    icon: Scale,
  },
  {
    key: 'partnership',
    icon: Handshake,
  },
] as const

const reasons = [
  'multidisciplinary',
  'independent',
  'visible',
  'practical',
] as const

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(37,99,235,.3),transparent_34%)]"
        />
        <Container className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            {t('public.about.eyebrow')}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            {t('public.about.title')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            {t('public.about.description')}
          </p>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              eyebrow={t('public.about.businessEyebrow')}
              title={t('public.about.businessTitle')}
              description={t('public.about.businessDescription')}
            />
            <div className="mt-6 space-y-4 leading-7 text-slate-600">
              <p>{t('public.about.businessParagraph1')}</p>
              <p>{t('public.about.businessParagraph2')}</p>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden rounded-3xl bg-slate-100 p-6 sm:p-8">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,.08),transparent_55%)]"
            />
            <div className="relative ml-auto w-[82%] rounded-2xl bg-slate-950 p-6 text-white shadow-2xl">
              <Compass className="h-8 w-8 text-amber-300" />
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                {t('public.about.pointOfView')}
              </p>
              <p className="mt-3 text-xl font-bold leading-8">
                {t('public.about.pointOfViewQuote')}
              </p>
            </div>
            <div className="relative -mt-3 w-[76%] rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t('public.about.standard')}
                  </p>
                  <p className="font-bold text-slate-950">
                    {t('public.about.standardValue')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20 sm:py-24">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="relative overflow-hidden border-0 bg-blue-700 p-8 text-white sm:p-10">
              <Target className="h-8 w-8 text-amber-300" />
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                {t('public.about.missionEyebrow')}
              </p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                {t('public.about.missionTitle')}
              </h2>
              <p className="mt-4 leading-7 text-blue-100">
                {t('public.about.missionDescription')}
              </p>
            </Card>
            <Card className="p-8 sm:p-10">
              <Eye className="h-8 w-8 text-blue-700" />
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                {t('public.about.visionEyebrow')}
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">
                {t('public.about.visionTitle')}
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                {t('public.about.visionDescription')}
              </p>
            </Card>
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow={t('public.about.valuesEyebrow')}
            title={t('public.about.valuesTitle')}
            description={t('public.about.valuesDescription')}
            center
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {values.map(({ key, icon: Icon }) => (
              <Card
                key={key}
                className="p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  {t(`public.about.values.${key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {t(`public.about.values.${key}.description`)}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-slate-950 py-20 text-white sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              {t('public.about.chooseEyebrow')}
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t('public.about.chooseTitle')}
            </h2>
            <p className="mt-5 leading-7 text-slate-400">
              {t('public.about.chooseDescription')}
            </p>
            <Link
              to="/consultation"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500"
            >
              {t('public.about.talkWithTeam')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {reasons.map((reason) => (
              <li
                key={reason}
                className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm leading-6 text-slate-300"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                {t(`public.about.reasons.${reason}`)}
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  )
}
