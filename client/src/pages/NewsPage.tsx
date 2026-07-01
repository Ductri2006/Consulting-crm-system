import { ArrowRight, CalendarDays, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/common/Badge'
import { Card } from '../components/common/Card'
import { Container } from '../components/common/Container'
import { SectionHeading } from '../components/common/SectionHeading'
import { newsArticles } from '../data/news'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

export function NewsPage() {
  return (
    <>
      <section className="border-b border-slate-200 bg-white py-20 sm:py-24">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              Insights
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Clear thinking for complex business questions
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Practical perspectives on advisory work, investment decisions,
              governance, property, and project delivery.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Latest thinking"
            title="Advisora insights"
            description="Short, practical reads designed to help leaders ask better questions and move forward with confidence."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {newsArticles.map((article, index) => (
              <Card
                key={article.id}
                interactive
                className="flex h-full flex-col p-0"
              >
                <div className="relative h-40 overflow-hidden rounded-t-2xl bg-slate-900">
                  <div
                    className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.7),transparent_52%)]"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full border border-white/15"
                    aria-hidden="true"
                  />
                  <p className="absolute bottom-5 left-6 text-sm font-semibold text-blue-200">
                    Insight {String(index + 1).padStart(2, '0')}
                  </p>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <Badge>{article.category}</Badge>
                  <h2 className="mt-4 text-xl font-bold leading-7 text-slate-950">
                    <Link
                      to={`/news/${article.slug}`}
                      className="rounded-sm transition hover:text-blue-700"
                    >
                      {article.title}
                    </Link>
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                    {article.excerpt}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatDate(article.publishedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {article.readTime}
                    </span>
                  </div>
                  <Link
                    to={`/news/${article.slug}`}
                    className="mt-5 inline-flex w-fit items-center gap-2 rounded-sm text-sm font-bold text-blue-700 transition hover:gap-3 hover:text-blue-800"
                    aria-label={`Read ${article.title}`}
                  >
                    Read article
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
