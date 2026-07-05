import { Building2, CalendarDays, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '../components/common/Badge'
import { Card } from '../components/common/Card'
import { Container } from '../components/common/Container'
import { SectionHeading } from '../components/common/SectionHeading'
import { projects } from '../data/projects'
import { getLocalizedProject } from '../i18n/staticContent'

const projectGradients = [
  'from-blue-950 via-blue-800 to-cyan-600',
  'from-slate-950 via-indigo-900 to-blue-600',
  'from-slate-900 via-slate-700 to-amber-500',
  'from-blue-950 via-cyan-800 to-emerald-500',
  'from-indigo-950 via-blue-800 to-sky-500',
  'from-slate-950 via-blue-950 to-indigo-600',
]

export function ProjectsPage() {
  const { t } = useTranslation()

  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-24">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.35),transparent_45%)]"
          aria-hidden="true"
        />
        <Container className="relative">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">
            {t('public.projects.eyebrow')}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {t('public.projects.title')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            {t('public.projects.description')}
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow={t('public.projects.sectionEyebrow')}
            title={t('public.projects.sectionTitle')}
            description={t('public.projects.sectionDescription')}
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => {
              const localizedProject = getLocalizedProject(t, project)

              return (
                <Card
                  key={project.id}
                  interactive
                  className="group overflow-hidden p-0"
                >
                  <div
                    className={`relative h-44 bg-gradient-to-br ${projectGradients[index % projectGradients.length]} p-6`}
                  >
                    <div
                      className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/20"
                      aria-hidden="true"
                    />
                    <div
                      className="absolute bottom-5 right-6 h-16 w-16 rounded-2xl border border-white/20 bg-white/10"
                      aria-hidden="true"
                    />
                    <Building2
                      className="h-8 w-8 text-white"
                      aria-hidden="true"
                    />
                    <p className="absolute bottom-5 left-6 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                      {t('public.projects.projectNumber', {
                        number: String(index + 1).padStart(2, '0'),
                      })}
                    </p>
                  </div>

                  <div className="p-6">
                    <Badge>{localizedProject.category}</Badge>
                    <h2 className="mt-4 text-xl font-bold text-slate-950 transition group-hover:text-blue-700">
                      {localizedProject.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {localizedProject.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        {localizedProject.location}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        {localizedProject.year}
                      </span>
                    </div>
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
