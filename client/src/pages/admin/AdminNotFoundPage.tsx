import { ArrowLeft, LayoutDashboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function AdminNotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-[calc(100vh-10rem)] place-items-center px-4 py-12 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          {t('admin.notFound.title')}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          {t('admin.notFound.description')}
        </p>
        <Link
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          to="/admin/dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('admin.notFound.backToDashboard')}
          <LayoutDashboard className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
