import { ArrowLeft, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button } from '../components/common/Button'
import { Container } from '../components/common/Container'

export function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className="relative flex min-h-[65vh] items-center overflow-hidden py-20">
      <div
        className="absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100 blur-3xl"
        aria-hidden="true"
      />
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-8xl font-black tracking-tighter text-blue-100 sm:text-9xl">
            404
          </p>
          <p className="-mt-5 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            {t('public.notFound.eyebrow')}
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {t('public.notFound.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-lg leading-7 text-slate-600">
            {t('public.notFound.description')}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button to="/" size="lg">
              <Home className="h-4 w-4" aria-hidden="true" />
              {t('public.notFound.backHome')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('public.notFound.previousPage')}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
