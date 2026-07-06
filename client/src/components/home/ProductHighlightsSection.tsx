import {
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileStack,
  GitBranch,
  KeyRound,
  Layers3,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Workflow,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Container } from '../common/Container'
import { SectionHeading } from '../common/SectionHeading'

const capabilities = [
  { labelKey: 'multiTenantWorkspaces', icon: Layers3 },
  { labelKey: 'rbac', icon: KeyRound },
  { labelKey: 'customerPortal', icon: UserRoundCheck },
  { labelKey: 'documentSecurity', icon: FileCheck2 },
  { labelKey: 'aiSummaries', icon: Sparkles },
  { labelKey: 'workflowAutomation', icon: Workflow },
  { labelKey: 'providerReadiness', icon: ShieldCheck },
] as const

const features = [
  { key: 'publicIntake', icon: MessageSquareText },
  { key: 'adminCrm', icon: BriefcaseBusiness },
  { key: 'caseWorkflow', icon: GitBranch },
  { key: 'secureDocuments', icon: FileStack },
  { key: 'customerPortal', icon: UserRoundCheck },
  { key: 'aiCaseSummary', icon: Bot },
  { key: 'automation', icon: ClipboardList },
  { key: 'providerReadiness', icon: ShieldCheck },
] as const

const workflowSteps = [
  { key: 'publicRequest', icon: MessageSquareText },
  { key: 'automatedTask', icon: ClipboardList },
  { key: 'internalCase', icon: BriefcaseBusiness },
  { key: 'documentHandling', icon: FileStack },
  { key: 'portalUpdate', icon: UserRoundCheck },
] as const

const securityItems = [
  { key: 'tokenSeparation', icon: LockKeyhole },
  { key: 'tenantIsolation', icon: Layers3 },
  { key: 'rbac', icon: KeyRound },
  { key: 'redaction', icon: ShieldCheck },
  { key: 'scanPolicy', icon: FileCheck2 },
  { key: 'providerReadiness', icon: CheckCircle2 },
] as const

export function ProductHighlightsSection() {
  const { t } = useTranslation()

  return (
    <section
      className="relative overflow-hidden bg-slate-50 py-20 sm:py-24"
      id="features"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white to-transparent"
      />
      <Container className="relative">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-3 shadow-soft backdrop-blur">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
            {capabilities.map(({ labelKey, icon: Icon }) => (
              <div
                className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200/70"
                key={labelKey}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {t(`public.home.capabilities.${labelKey}`)}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <SectionHeading
            eyebrow={t('public.home.featuresEyebrow')}
            title={t('public.home.featuresTitle')}
            description={t('public.home.featuresDescription')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(({ key, icon: Icon }) => (
              <article
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
                key={key}
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-bold text-slate-950">
                  {t(`public.home.features.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t(`public.home.features.${key}.description`)}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
              {t('public.home.workflowEyebrow')}
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {t('public.home.workflowTitle')}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              {t('public.home.workflowDescription')}
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-5">
              {workflowSteps.map(({ key, icon: Icon }, index) => (
                <div
                  className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  key={key}
                >
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -left-3 top-8 hidden h-px w-6 bg-blue-200 md:block"
                    />
                  ) : null}
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-700 shadow-sm">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-sm font-bold text-slate-950">
                    {t(`public.home.workflowSteps.${key}`)}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-300">
              {t('public.home.securityEyebrow')}
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {t('public.home.securityTitle')}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {t('public.home.securityDescription')}
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {securityItems.map(({ key, icon: Icon }) => (
                <div
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  key={key}
                >
                  <Icon className="h-5 w-5 text-cyan-300" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-slate-100">
                    {t(`public.home.securityItems.${key}`)}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </Container>
    </section>
  )
}
