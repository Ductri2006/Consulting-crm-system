import { ArrowUpRight, CalendarDays, Clock3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { newsArticles } from '../../data/news'
import { formatDate } from '../../i18n/format'
import {
  getNewsCategoryLabel,
  getNewsReadTimeLabel,
} from '../../i18n/news'
import { getLocalizedNewsArticle } from '../../i18n/staticContent'
import { Badge } from '../common/Badge'
import { Card } from '../common/Card'
import { Container } from '../common/Container'
import { SectionHeading } from '../common/SectionHeading'

export function NewsPreview() {
  const { t } = useTranslation()

  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow={t('public.news.previewEyebrow')}
            title={t('public.news.previewTitle')}
            description={t('public.news.previewDescription')}
          />
          <Link
            to="/news"
            className="inline-flex shrink-0 items-center gap-2 font-semibold text-blue-700 transition hover:text-blue-900"
          >
            {t('public.news.browseAll')}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {newsArticles.slice(0, 3).map((article) => {
            const localizedArticle = getLocalizedNewsArticle(t, article)

            return (
              <Card
                key={article.id}
                className="group flex h-full flex-col p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
              >
                <Badge>{getNewsCategoryLabel(t, article.category)}</Badge>
                <h3 className="mt-5 text-xl font-bold leading-7 text-slate-950">
                  <Link
                    to={`/news/${localizedArticle.slug}`}
                    className="transition hover:text-blue-700"
                  >
                    {localizedArticle.title}
                  </Link>
                </h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                  {localizedArticle.excerpt}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-5 text-xs font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <time dateTime={localizedArticle.publishedAt}>
                      {formatDate(localizedArticle.publishedAt)}
                    </time>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {getNewsReadTimeLabel(t, localizedArticle.readTime)}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
