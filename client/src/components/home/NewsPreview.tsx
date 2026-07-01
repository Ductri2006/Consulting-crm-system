import { ArrowUpRight, CalendarDays, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { newsArticles } from '../../data/news'
import { Badge } from '../common/Badge'
import { Card } from '../common/Card'
import { Container } from '../common/Container'
import { SectionHeading } from '../common/SectionHeading'

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date))

export function NewsPreview() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Ideas & insights"
            title="Perspectives for better business decisions"
            description="Concise, practical thinking from the issues we help organizations navigate."
          />
          <Link
            to="/news"
            className="inline-flex shrink-0 items-center gap-2 font-semibold text-blue-700 transition hover:text-blue-900"
          >
            Browse all insights
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {newsArticles.slice(0, 3).map((article) => (
            <Card
              key={article.id}
              className="group flex h-full flex-col p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
            >
              <Badge>{article.category}</Badge>
              <h3 className="mt-5 text-xl font-bold leading-7 text-slate-950">
                <Link
                  to={`/news/${article.slug}`}
                  className="transition hover:text-blue-700"
                >
                  {article.title}
                </Link>
              </h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                {article.excerpt}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-5 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <time dateTime={article.publishedAt}>
                    {formatDate(article.publishedAt)}
                  </time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  {article.readTime}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}
