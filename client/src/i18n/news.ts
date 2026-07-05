import type { TFunction } from 'i18next'

const categoryKeys: Record<string, string> = {
  'Business Advisory': 'public.news.categories.businessAdvisory',
  Construction: 'public.news.categories.construction',
  Insights: 'public.news.categories.insights',
  Investment: 'public.news.categories.investment',
  Legal: 'public.news.categories.legal',
  'Real Estate': 'public.news.categories.realEstate',
}

export const getNewsCategoryLabel = (
  t: TFunction,
  category: string,
): string => {
  const key = categoryKeys[category]

  return key ? t(key) : category
}

export const getNewsReadTimeLabel = (
  t: TFunction,
  readTime: string,
): string => {
  const minutes = Number.parseInt(readTime, 10)

  return Number.isFinite(minutes)
    ? t('public.news.readTime', { count: minutes })
    : readTime
}
