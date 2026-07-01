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
import { Link } from 'react-router-dom'
import { Card } from '../components/common/Card'
import { Container } from '../components/common/Container'
import { SectionHeading } from '../components/common/SectionHeading'

const values = [
  {
    title: 'Trust',
    description:
      'We earn confidence through honest analysis, discretion, and consistent follow-through.',
    icon: ShieldCheck,
  },
  {
    title: 'Clarity',
    description:
      'We turn complex information into language, choices, and actions people can understand.',
    icon: Lightbulb,
  },
  {
    title: 'Responsibility',
    description:
      'We own the quality of our work and remain attentive to the impact of every recommendation.',
    icon: Scale,
  },
  {
    title: 'Long-term Partnership',
    description:
      'We optimize for durable outcomes and relationships—not quick answers that create future problems.',
    icon: Handshake,
  },
]

const reasons = [
  'Multidisciplinary perspective across high-stakes business decisions',
  'Independent analysis grounded in evidence and commercial reality',
  'Visible process, clear communication, and practical deliverables',
  'Recommendations designed around your organization’s capacity to act',
]

export function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(37,99,235,.3),transparent_34%)]"
        />
        <Container className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            About Advisora
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            Clear thinking for organizations building what comes next.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            We are a multidisciplinary consulting team helping decision-makers
            navigate complex property, legal, investment, and construction
            challenges with confidence.
          </p>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Our business"
              title="Advice designed to be understood—and used"
              description="Advisora exists to close the distance between expert analysis and practical action."
            />
            <div className="mt-6 space-y-4 leading-7 text-slate-600">
              <p>
                Business decisions rarely fit into a single discipline. A
                property choice can involve investment assumptions, legal
                requirements, delivery constraints, and long-term operational
                consequences.
              </p>
              <p>
                We bring those perspectives into one structured engagement. Our
                role is to make the important questions visible, test the
                evidence, and give leaders a path they can act on.
              </p>
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
                Our point of view
              </p>
              <p className="mt-3 text-xl font-bold leading-8">
                The best advice makes a difficult decision easier to see, own,
                and execute.
              </p>
            </div>
            <div className="relative -mt-3 w-[76%] rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Our standard
                  </p>
                  <p className="font-bold text-slate-950">
                    Clear, practical, accountable
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
                Our mission
              </p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Make expert guidance more useful at the moment decisions matter.
              </h2>
              <p className="mt-4 leading-7 text-blue-100">
                We equip clients with clear evidence, balanced recommendations,
                and a realistic route from intent to implementation.
              </p>
            </Card>
            <Card className="p-8 sm:p-10">
              <Eye className="h-8 w-8 text-blue-700" />
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Our vision
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">
                A business landscape where complexity never prevents good
                decisions.
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                We envision advisory relationships built on transparency,
                shared understanding, and outcomes that endure.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="What guides us"
            title="Values visible in the way we work"
            description="These principles shape our analysis, our communication, and every client relationship."
            center
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {values.map(({ title, description, icon: Icon }) => (
              <Card
                key={title}
                className="p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {description}
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
              Why choose us
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Senior attention. Structured thinking. No unnecessary noise.
            </h2>
            <p className="mt-5 leading-7 text-slate-400">
              We combine specialist knowledge with the discipline to keep every
              engagement focused on the decision in front of you.
            </p>
            <Link
              to="/consultation"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500"
            >
              Talk with our team
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
                {reason}
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  )
}
