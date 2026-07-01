import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '../common/Container'

const highlights = [
  { label: 'Structured advice', icon: ShieldCheck },
  { label: 'Clear next steps', icon: CheckCircle2 },
]

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 py-20 text-white sm:py-24 lg:py-28">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.32),transparent_35%),radial-gradient(circle_at_85%_70%,rgba(245,158,11,0.13),transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgba(148,163,184,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.16)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <Container className="grid items-center gap-16 lg:grid-cols-[1.04fr_.96fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-400/10 px-3.5 py-2 text-sm font-medium text-blue-100">
            <Sparkles className="h-4 w-4 text-amber-300" />
            Clarity for complex business decisions
          </div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl lg:leading-[1.08]">
            Advisory expertise that turns complexity into{' '}
            <span className="text-blue-400">confident action.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Advisora is a consulting business platform connecting organizations
            with practical guidance across real estate, legal, investment, and
            construction decisions.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/consultation"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              Get Consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/services"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-600 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-slate-400 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              View Services
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {highlights.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 text-sm text-slate-300"
              >
                <Icon className="h-4 w-4 text-blue-400" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mx-0">
          <div
            aria-hidden="true"
            className="absolute -inset-6 rounded-[2.5rem] bg-blue-500/15 blur-3xl"
          />
          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/90 p-4 shadow-2xl shadow-slate-950/60 backdrop-blur sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Advisory workspace
                </p>
                <p className="mt-1 font-semibold">Engagement overview</p>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                On track
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-800 p-4 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">Decision readiness</p>
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                </div>
                <p className="mt-3 text-3xl font-bold">84%</p>
                <div className="mt-4 h-2 rounded-full bg-slate-700">
                  <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                </div>
              </div>
              <div className="rounded-2xl bg-amber-400 p-4 text-slate-950">
                <Clock3 className="h-5 w-5" />
                <p className="mt-6 text-2xl font-bold">12</p>
                <p className="text-xs font-medium">Actions resolved</p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-white p-5 text-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Current stage
                  </p>
                  <p className="mt-1 font-bold">Solution assessment</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {[100, 100, 72, 18].map((width, index) => (
                  <div key={index} className="h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
