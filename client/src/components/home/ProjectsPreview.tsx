import { ArrowRight, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { projects } from '../../data/projects'
import { getLocalizedProject } from '../../i18n/staticContent'
import { Container } from '../common/Container'
import { SectionHeading } from '../common/SectionHeading'

export function ProjectsPreview() {
  const { t } = useTranslation()

  return (
    <section className="bg-slate-950 py-20 text-white sm:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            title={t('public.projectsPreview.title')}
            description={t('public.projectsPreview.description')}
            className="[&_h2]:text-white [&_p]:text-slate-400"
          />
          <Link
            to="/projects"
            className="inline-flex shrink-0 items-center gap-2 font-semibold text-blue-300 transition hover:text-white"
          >
            {t('public.projectsPreview.viewAll')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {projects.slice(0, 3).map((project) => {
            const localizedProject = getLocalizedProject(t, project)

            return (
              <article key={project.id} className="border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {localizedProject.location}
                  </div>
                  <span>{localizedProject.year}</span>
                </div>

                <div className="ops-rule my-4" />

                <h3 className="text-lg font-semibold tracking-tight text-[#0b1428]">
                  {localizedProject.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {localizedProject.description}
                </p>

                <div className="mt-4 text-[10px] uppercase tracking-[0.12em] text-[#2a5a49]">
                  {localizedProject.category}
                </div>
              </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
