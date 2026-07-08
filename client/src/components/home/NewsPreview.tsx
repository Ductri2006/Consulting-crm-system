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
import { Container } from '../common/Container'
import { SectionHeading } from '../common/SectionHeading'

export function NewsPreview() {
  const { t } = useTranslation()

  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
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

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {newsArticles.slice(0, 3).map((article) => {
            const localizedArticle = getLocalizedNewsArticle(t, article)

            return (
              <article key={article.id} className="border border-slate-200 bg-white p-6">
                <div className="text-[10px] uppercase tracking-[0.12em] text-[#2a5a49]">
                  {getNewsCategoryLabel(t, article.category)}
                </div>

                <h3 className="mt-3 text-lg font-semibold tracking-tight text-[#0b1428]">
                  <Link to={`/news/${localizedArticle.slug}`} className="hover:underline">
                    {localizedArticle.title}
                  </Link>
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {localizedArticle.excerpt}
                </p>

                <div className="mt-5 flex items-center gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <time dateTime={localizedArticle.publishedAt}>{formatDate(localizedArticle.publishedAt)}</time>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {getNewsReadTimeLabel(t, localizedArticle.readTime)}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
