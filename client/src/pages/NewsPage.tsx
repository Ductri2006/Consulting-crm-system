import { ArrowRight, CalendarDays, Clock3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Badge } from '../components/common/Badge'
import { Card } from '../components/common/Card'
import { Container } from '../components/common/Container'
import { SectionHeading } from '../components/common/SectionHeading'
import { newsArticles } from '../data/news'
import { formatDate } from '../i18n/format'
import { getNewsCategoryLabel, getNewsReadTimeLabel } from '../i18n/news'
import { getLocalizedNewsArticle } from '../i18n/staticContent'

export function NewsPage() {
  const { t } = useTranslation()

  return (
    <>
      <section className="border-b border-slate-200 bg-white py-20 sm:py-24">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              {t('public.news.listEyebrow')}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              {t('public.news.listTitle')}
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              {t('public.news.listDescription')}
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow={t('public.news.sectionEyebrow')}
            title={t('public.news.sectionTitle')}
            description={t('public.news.sectionDescription')}
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {newsArticles.map((article, index) => {
              const localizedArticle = getLocalizedNewsArticle(t, article)

              return (
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
                      {t('public.news.insightNumber', {
                        number: String(index + 1).padStart(2, '0'),
                      })}
                    </p>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <Badge>{getNewsCategoryLabel(t, article.category)}</Badge>
                    <h2 className="mt-4 text-xl font-bold leading-7 text-slate-950">
                      <Link
                        to={`/news/${localizedArticle.slug}`}
                        className="rounded-sm transition hover:text-blue-700"
                      >
                        {localizedArticle.title}
                      </Link>
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                      {localizedArticle.excerpt}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDate(localizedArticle.publishedAt)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        {getNewsReadTimeLabel(t, localizedArticle.readTime)}
                      </span>
                    </div>
                    <Link
                      to={`/news/${localizedArticle.slug}`}
                      className="mt-5 inline-flex w-fit items-center gap-2 rounded-sm text-sm font-bold text-blue-700 transition hover:gap-3 hover:text-blue-800"
                      aria-label={t('public.news.readArticleLabel', {
                        title: localizedArticle.title,
                      })}
                    >
                      {t('public.news.readArticle')}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        </Container>
      </section>
    </>
  )
}
