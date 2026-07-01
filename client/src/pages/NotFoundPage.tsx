import { ArrowLeft, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../components/common/Button'
import { Container } from '../components/common/Container'

export function NotFoundPage() {
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
            Page not found
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            This page is not part of the map
          </h1>
          <p className="mx-auto mt-4 max-w-lg leading-7 text-slate-600">
            The address may be incorrect, or the content may have moved. Return
            home or go back to the previous page.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button to="/" size="lg">
              <Home className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Previous page
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
