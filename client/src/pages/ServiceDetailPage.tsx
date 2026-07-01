import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Container } from '../components/common/Container'
import { services } from '../data/services'
import { NotFoundPage } from './NotFoundPage'

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const service = services.find((item) => item.slug === slug)

  if (!service) {
    return <NotFoundPage />
  }

  const Icon = service.icon

  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,.34),transparent_38%)]"
        />
        <Container className="relative">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All services
          </Link>
          <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <span className="grid h-16 w-16 place-items-center rounded-2xl border border-blue-400/20 bg-blue-500/15 text-blue-300">
                <Icon className="h-8 w-8" />
              </span>
              <h1 className="mt-7 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
                {service.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                {service.shortDescription}
              </p>
            </div>
            <Link
              to="/consultation"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              Book a consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <Container className="grid gap-14 lg:grid-cols-[1fr_.8fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Service overview
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
              Advice grounded in your operating reality
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              {service.description}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              What this engagement brings
            </h2>
            <ul className="mt-6 space-y-4">
              {service.benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex gap-3 text-sm leading-6 text-slate-700"
                >
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20 sm:py-24">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Engagement process
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
              A focused route from question to action
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              We adapt the detail to your situation while keeping every stage
              clear and accountable.
            </p>
          </div>

          <ol className="mt-12 grid gap-5 md:grid-cols-2">
            {service.process.map((step, index) => (
              <li
                key={step}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Stage {index + 1}
                  </p>
                  <p className="mt-1 font-semibold leading-7 text-slate-950">
                    {step}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-blue-700 p-8 text-white sm:p-12">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[45px] border-white/10"
            />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100">
                  <CheckCircle2 className="h-4 w-4 text-amber-300" />
                  Start with a confidential conversation
                </span>
                <h2 className="mt-4 text-3xl font-bold">
                  Ready to discuss {service.title.toLowerCase()}?
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-blue-100">
                  Share your objectives and immediate concerns. We will help you
                  frame the right scope and next step.
                </p>
              </div>
              <Link
                to="/consultation"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-800 transition hover:bg-amber-50"
              >
                Request consultation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
