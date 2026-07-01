import type { LucideIcon } from 'lucide-react'

export interface Service {
  id: string
  title: string
  slug: string
  shortDescription: string
  description: string
  icon: LucideIcon
  benefits: string[]
  process: string[]
}

export interface Project {
  id: string
  title: string
  slug: string
  category: string
  location: string
  description: string
  year: number
}

export interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string[]
  category: string
  publishedAt: string
  readTime: string
}

export interface ProcessStep {
  id: string
  title: string
  description: string
}

export interface NavItem {
  label: string
  href: string
}
