import { useEffect, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import type { NavItem } from '../../types'
import { cn } from '../../utils/cn'
import { Button } from '../common/Button'
import { Container } from '../common/Container'

const navigation: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'News', href: '/news' },
  { label: 'Contact', href: '/contact' },
]

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-extrabold text-white shadow-sm shadow-blue-600/30"
    >
      A
    </span>
  )
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMenuOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isMenuOpen])

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
    )

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <Container className="flex h-18 items-center justify-between gap-6 py-3">
        <Link
          aria-label="Advisora home"
          className="flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          to="/"
        >
          <BrandMark />
          <span className="text-xl font-bold tracking-tight text-slate-950">
            Advisora
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => (
              <li key={item.href}>
                <NavLink
                  className={navLinkClasses}
                  end={item.href === '/'}
                  to={item.href}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button size="sm" to="/workspace-signup" variant="outline">
            Create workspace
          </Button>
          <Button size="sm" to="/consultation">
            Get Consultation
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="grid size-11 place-items-center rounded-lg text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
          onClick={() => setIsMenuOpen((current) => !current)}
          type="button"
        >
          {isMenuOpen ? (
            <X aria-hidden="true" className="size-6" />
          ) : (
            <Menu aria-hidden="true" className="size-6" />
          )}
        </button>
      </Container>

      <div
        className={cn(
          'border-t border-slate-200 bg-white lg:hidden',
          !isMenuOpen && 'hidden',
        )}
        id="mobile-navigation"
      >
        <Container className="py-4">
          <nav aria-label="Mobile navigation">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.href}>
                  <NavLink
                    className={({ isActive }) =>
                      cn(navLinkClasses({ isActive }), 'flex px-4 py-3')
                    }
                    end={item.href === '/'}
                    onClick={() => setIsMenuOpen(false)}
                    to={item.href}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <Button className="mt-4 w-full" size="md" to="/consultation">
            Get Consultation
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <Button
            className="mt-2 w-full"
            size="md"
            to="/workspace-signup"
            variant="outline"
          >
            Create workspace
          </Button>
        </Container>
      </div>
    </header>
  )
}
