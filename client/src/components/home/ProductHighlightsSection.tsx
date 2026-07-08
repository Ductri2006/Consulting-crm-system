import { useTranslation } from 'react-i18next'
import { Container } from '../common/Container'

export function ProductHighlightsSection() {
  const { t } = useTranslation()

  const phases = [
    { key: 'intake', label: t('public.home.phases.intake'), desc: t('public.home.phases.intakeDesc') },
    { key: 'triage', label: t('public.home.phases.triage'), desc: t('public.home.phases.triageDesc') },
    { key: 'casework', label: t('public.home.phases.casework'), desc: t('public.home.phases.caseworkDesc') },
    { key: 'documents', label: t('public.home.phases.documents'), desc: t('public.home.phases.documentsDesc') },
    { key: 'portal', label: t('public.home.phases.portal'), desc: t('public.home.phases.portalDesc') },
    { key: 'audit', label: t('public.home.phases.audit'), desc: t('public.home.phases.auditDesc') },
  ] as const

  return (
    <section id="workflow" className="bg-white py-20 sm:py-24">
      <Container>
        <div className="max-w-3xl">
          <div className="editorial-eyebrow mb-3">Operations surface</div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#0b1428] sm:text-4xl">
            {t('public.home.featuresTitle')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {t('public.home.featuresDescription')}
          </p>
        </div>

        {/* Product narrative ledger */}
        <div className="mt-10 border border-slate-200 bg-[#f8f5f0]">
          <div className="border-b border-slate-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Case lifecycle • Tenant-scoped • Full audit trail
          </div>

          <div className="divide-y divide-slate-200">
            {phases.map((phase, idx) => (
              <div key={phase.key} className="grid gap-x-6 gap-y-1 px-5 py-4 md:grid-cols-12 md:items-center">
                <div className="md:col-span-1 font-mono text-xs text-slate-400">0{idx + 1}</div>
                <div className="md:col-span-3 text-sm font-semibold tracking-tight text-[#0b1428]">
                  {phase.label}
                </div>
                <div className="md:col-span-8 text-sm leading-relaxed text-slate-600">
                  {phase.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
          <span className="case-chip">RBAC</span>
          <span className="case-chip">Tenant isolation</span>
          <span className="case-chip">Document guarded</span>
          <span className="case-chip">AI sanitized</span>
          <span className="case-chip">ActivityLog</span>
        </div>
      </Container>
    </section>
  )
}
