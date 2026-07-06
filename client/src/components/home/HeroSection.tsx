import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileStack,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Container } from '../common/Container'

const highlights = [
  { labelKey: 'multiTenantOperations', icon: ShieldCheck },
  { labelKey: 'securePortal', icon: LockKeyhole },
  { labelKey: 'aiReadyWorkflow', icon: Sparkles },
] as const

const floatingCards = [
  { labelKey: 'newConsultationRequest', icon: MessageSquareText },
  { labelKey: 'aiCaseSummary', icon: Sparkles },
  { labelKey: 'secureDocument', icon: FileStack },
  { labelKey: 'followUpTaskCreated', icon: CheckCircle2 },
] as const

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 py-20 text-white sm:py-24 lg:py-28">
      <div
        aria-hidden="true"
        className="landing-gradient-motion absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_18%,rgba(56,189,248,0.32),transparent_30%),radial-gradient(circle_at_80%_16%,rgba(59,130,246,0.3),transparent_28%),radial-gradient(circle_at_72%_80%,rgba(16,185,129,0.18),transparent_26%),linear-gradient(135deg,#020617,#0f172a_42%,#111827)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(rgba(148,163,184,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.16)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <Container className="grid items-center gap-16 lg:grid-cols-[1.04fr_.96fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-white/10 px-3.5 py-2 text-sm font-medium text-cyan-100 shadow-lg shadow-slate-950/20 backdrop-blur">
            <Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" />
            {t('public.home.heroEyebrow')}
          </div>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            {t('public.home.heroTitlePrefix')}{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-emerald-200 bg-clip-text text-transparent">
              {t('public.home.heroTitleAccent')}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            {t('public.home.heroDescription')}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 shadow-xl shadow-slate-950/25 transition hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              to="/admin"
            >
              {t('public.home.openAdminDemo')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white shadow-lg shadow-slate-950/10 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-200/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              to="/portal"
            >
              {t('public.home.viewCustomerPortal')}
            </Link>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-semibold text-cyan-100 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              href="#features"
            >
              {t('public.home.exploreFeatures')}
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {highlights.map(({ labelKey, icon: Icon }) => (
              <span
                className="inline-flex items-center gap-2 text-sm text-slate-300"
                key={labelKey}
              >
                <Icon className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                {t(`public.home.${labelKey}`)}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mx-0">
          <div
            aria-hidden="true"
            className="absolute -inset-6 rounded-[2.5rem] bg-cyan-400/15 blur-3xl"
          />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-slate-950/60 backdrop-blur-xl sm:p-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {t('public.home.crmWorkspace')}
                  </p>
                  <p className="mt-1 font-semibold">
                    {t('public.home.operationsCommand')}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-300/20">
                  {t('public.home.providerReady')}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 text-slate-950 shadow-xl shadow-slate-950/20 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-500">
                      {t('public.home.casePipeline')}
                    </p>
                    <BarChart3 className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-3xl font-bold">84%</p>
                  <div className="mt-4 h-2 rounded-full bg-slate-100">
                    <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-semibold text-slate-500">
                    <span>{t('public.home.intake')}</span>
                    <span>{t('public.home.cases')}</span>
                    <span>{t('public.home.portal')}</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-400 p-4 text-slate-950 shadow-xl shadow-emerald-950/20">
                  <UserRoundCheck className="h-5 w-5" aria-hidden="true" />
                  <p className="mt-6 text-2xl font-bold">12</p>
                  <p className="text-xs font-semibold">
                    {t('public.home.tasksAutomated')}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900 p-4 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t('public.home.currentCase')}
                    </p>
                    <p className="mt-1 font-bold">
                      {t('public.home.solutionAssessment')}
                    </p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-4 gap-2">
                  {[100, 100, 72, 18].map((width, index) => (
                    <div key={index} className="h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-300"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-5 bottom-5 hidden grid-cols-2 gap-3 sm:grid">
              {floatingCards.map(({ labelKey, icon: Icon }, index) => (
                <div
                  className={`rounded-2xl border border-white/15 bg-white/90 px-3 py-2 text-xs font-bold text-slate-800 shadow-lg shadow-slate-950/20 backdrop-blur ${
                    index % 2 === 0 ? 'landing-float-slow' : 'landing-float-delayed'
                  }`}
                  key={labelKey}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                    {t(`public.home.${labelKey}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -right-2 top-6 hidden max-w-[13rem] rounded-2xl border border-white/15 bg-white/90 p-3 text-xs font-semibold text-slate-700 shadow-xl shadow-slate-950/25 backdrop-blur lg:block">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.16em] text-slate-500">
              {t('public.home.liveSignal')}
            </span>
            {t('public.home.liveSignalDescription')}
          </div>
          <div className="absolute -bottom-5 -left-3 hidden max-w-[14rem] rounded-2xl border border-emerald-200/80 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900 shadow-xl shadow-emerald-950/20 lg:block">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.16em] text-emerald-700">
              {t('public.home.securitySignal')}
            </span>
            {t('public.home.securitySignalDescription')}
          </div>
        </div>
      </Container>
    </section>
  )
}
