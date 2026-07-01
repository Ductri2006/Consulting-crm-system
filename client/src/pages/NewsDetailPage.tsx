import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Container } from '../components/common/Container'
import { newsArticles } from '../data/news'
import { NotFoundPage } from './NotFoundPage'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

export function NewsDetailPage() {
  const { slug } = useParams()
  const article = newsArticles.find((item) => item.slug === slug)

  if (!article) {
    return <NotFoundPage />
  }

  return (
    <article>
      <header className="border-b border-slate-200 bg-white py-16 sm:py-24">
        <Container>
          <Link
            to="/news"
            className="inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to insights
          </Link>
          <div className="mt-10 max-w-4xl">
            <Badge>{article.category}</Badge>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              {article.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              {article.excerpt}
            </p>
            <div className="mt-7 flex flex-wrap gap-5 text-sm font-medium text-slate-500">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {formatDate(article.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {article.readTime}
              </span>
            </div>
          </div>
        </Container>
      </header>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="space-y-6">
              {article.content.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-lg leading-8 text-slate-700"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <aside className="mt-14 rounded-2xl bg-slate-950 p-8 text-white sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-300">
                Put insight into action
              </p>
              <h2 className="mt-3 text-2xl font-bold">
                Need a clear view of your next decision?
              </h2>
              <p className="mt-3 leading-7 text-slate-300">
                Share the challenge with our team and start with a focused,
                no-obligation consultation.
              </p>
              <Button to="/consultation" className="mt-6" size="lg">
                Get consultation
              </Button>
            </aside>
          </div>
        </Container>
      </section>
    </article>
  )
}
