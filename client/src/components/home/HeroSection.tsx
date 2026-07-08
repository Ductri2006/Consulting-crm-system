import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Container } from '../common/Container'

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative isolate overflow-hidden py-20 sm:py-24 lg:py-28 landing-paper">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Editorial left */}
          <div className="lg:col-span-7">
            <div className="editorial-eyebrow mb-4">
              {t('public.home.heroEyebrow')}
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.025em] text-[#0b1428] sm:text-5xl lg:text-[56px] lg:leading-[1.05]">
              {t('public.home.heroTitlePrefix')}{' '}
              <span className="landing-emerald">{t('public.home.heroTitleAccent')}</span>
            </h1>

            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              {t('public.home.heroDescription')}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/admin"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1428] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0b1428]"
              >
                {t('public.home.openAdminDemo')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                to="/portal"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-[#0b1428] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
              >
                {t('public.home.viewCustomerPortal')}
              </Link>

              <a
                href="#workflow"
                className="inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold text-slate-600 transition hover:text-[#0b1428]"
              >
                {t('public.home.exploreFeatures')}
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
              <span className="case-chip">{t('public.home.ledger.chips.multiTenant')}</span>
              <span className="case-chip">{t('public.home.ledger.chips.rbacScoped')}</span>
              <span className="case-chip">{t('public.home.ledger.chips.auditReady')}</span>
            </div>
          </div>

          {/* Case Operations Ledger / Board */}
          <div className="lg:col-span-5">
            <div className="ops-ledger rounded-sm p-5 shadow-sm blueprint-grid">
              <div className="mb-3 flex items-center justify-between border-b border-slate-300 pb-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{t('public.home.ledger.board.eyebrow')}</div>
                  <div className="text-sm font-semibold tracking-tight text-[#0b1428]">{t('public.home.ledger.board.title')}</div>
                </div>
                <span className="case-chip case-chip-active">{t('public.home.ledger.chips.liveDemo')}</span>
              </div>

              <div className="space-y-px text-sm">
                {/* Ledger rows - IDs are visual mocks, kept hardcoded */}
                {[
                  { row: 'publicRequest', code: 'REQ-2407-0182', actor: 'tenantA', status: 'logged', active: true },
                  { row: 'followUpTask', code: 'TASK-8821', actor: 'staff', status: 'assigned', active: false },
                  { row: 'caseFile', code: 'CASE-391', actor: 'manager', status: 'inProgress', active: true },
                  { row: 'documentVaulted', code: 'DOC-1147', actor: 'rbac', status: 'guarded', active: false },
                  { row: 'portalUpdate', code: 'UPD-094', actor: 'customer', status: 'dispatched', active: true },
                ].map((item) => {
                  const label = t(`public.home.ledger.rows.${item.row}`);
                  const actor = item.actor === 'rbac' ? 'RBAC' : t(`public.home.ledger.actors.${item.actor}`);
                  const status = t(`public.home.ledger.statuses.${item.status}`);
                  return (
                    <div key={item.row} className="ledger-row grid grid-cols-12 items-center gap-x-3 text-xs">
                      <div className="col-span-4 font-medium text-[#0b1428]">{label}</div>
                      <div className="col-span-3 font-mono text-[11px] text-slate-500">{item.code}</div>
                      <div className="col-span-3"><span className="case-chip">{actor}</span></div>
                      <div className="col-span-2 text-right"><span className={`case-chip ${item.active ? 'case-chip-active' : ''}`}>{status}</span></div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-slate-300 pt-3 text-[10px] text-slate-500">
                {t('public.home.ledger.board.footer')}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
