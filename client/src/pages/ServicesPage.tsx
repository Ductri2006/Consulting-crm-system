import { ArrowUpRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/common/Card'
import { Container } from '../components/common/Container'
import { SectionHeading } from '../components/common/SectionHeading'
import { CTASection } from '../components/home/CTASection'
import { services } from '../data/services'

export function ServicesPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(37,99,235,.32),transparent_36%)]"
        />
        <Container className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Advisora expertise
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Our Consulting Services
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Multidisciplinary guidance for consequential decisions—delivered
            with rigor, context, and a practical focus on what happens next.
          </p>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Four focused practices"
            title="Choose the expertise your decision needs"
            description="Each practice follows the same Advisora standard: clear scope, transparent analysis, and recommendations built to be acted on."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {services.map((service, index) => {
              const Icon = service.icon

              return (
                <Card
                  key={service.id}
                  className="group flex flex-col p-6 transition duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                      <Icon className="h-7 w-7" />
                    </span>
                    <span className="text-5xl font-bold text-slate-100">
                      0{index + 1}
                    </span>
                  </div>
                  <h2 className="mt-6 text-2xl font-bold text-slate-950">
                    {service.title}
                  </h2>
                  <p className="mt-3 leading-7 text-slate-600">
                    {service.shortDescription}
                  </p>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {service.benefits.slice(0, 2).map((benefit) => (
                      <li
                        key={benefit}
                        className="flex gap-2.5 text-sm leading-6 text-slate-700"
                      >
                        <Check className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={`/services/${service.slug}`}
                    className="mt-7 inline-flex items-center gap-2 self-start font-semibold text-blue-700 transition group-hover:gap-3"
                  >
                    Explore this service
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Card>
              )
            })}
          </div>
        </Container>
      </section>

      <CTASection />
    </>
  )
}
