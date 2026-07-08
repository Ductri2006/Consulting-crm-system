import { ArrowRight, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { projects } from '../../data/projects'
import { getLocalizedProject } from '../../i18n/staticContent'
import { Badge } from '../common/Badge'
import { Container } from '../common/Container'
import { SectionHeading } from '../common/SectionHeading'

const accentStyles = [
  'from-blue-700 via-blue-600 to-cyan-500',
  'from-slate-900 via-slate-800 to-blue-800',
  'from-amber-500 via-orange-500 to-rose-500',
]

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

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {projects.slice(0, 3).map((project, index) => {
            const localizedProject = getLocalizedProject(t, project)

            return (
              <article
                key={project.id}
                className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
              >
                <div
                  className={`relative h-44 overflow-hidden bg-gradient-to-br ${accentStyles[index]}`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[26px] border-white/10 transition duration-500 group-hover:scale-110"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute bottom-5 left-6 right-6 h-px bg-white/30"
                  />
                  <span className="absolute bottom-7 left-6 text-5xl font-bold text-white/15">
                    0{index + 1}
                  </span>
                  <Badge className="absolute left-5 top-5 border-white/20 bg-white/15 text-white backdrop-blur">
                    {localizedProject.category}
                  </Badge>
                  <span className="absolute bottom-5 right-6 text-sm font-semibold">
                    {localizedProject.year}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="h-4 w-4 text-blue-400" />
                    {localizedProject.location}
                  </div>
                  <h3 className="mt-3 text-xl font-bold">
                    {localizedProject.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {localizedProject.description}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
