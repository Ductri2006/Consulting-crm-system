import type { TFunction } from 'i18next'
import type { NewsArticle, Project, Service } from '../types'

export const getLocalizedService = (
  t: TFunction,
  service: Service,
): Service => ({
  ...service,
  title: t(`public.serviceContent.${service.id}.title`),
  shortDescription: t(`public.serviceContent.${service.id}.shortDescription`),
  description: t(`public.serviceContent.${service.id}.description`),
  benefits: service.benefits.map((_, index) =>
    t(`public.serviceContent.${service.id}.benefits.${index}`),
  ),
  process: service.process.map((_, index) =>
    t(`public.serviceContent.${service.id}.process.${index}`),
  ),
})

export const getLocalizedProject = (
  t: TFunction,
  project: Project,
): Project => ({
  ...project,
  title: t(`public.projectContent.${project.id}.title`),
  category: t(`public.projectContent.${project.id}.category`),
  location: t(`public.projectContent.${project.id}.location`),
  description: t(`public.projectContent.${project.id}.description`),
})

export const getLocalizedNewsArticle = (
  t: TFunction,
  article: NewsArticle,
): NewsArticle => ({
  ...article,
  title: t(`public.newsContent.${article.id}.title`),
  excerpt: t(`public.newsContent.${article.id}.excerpt`),
  content: article.content.map((_, index) =>
    t(`public.newsContent.${article.id}.content.${index}`),
  ),
})
