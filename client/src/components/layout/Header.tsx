import { useEffect, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router-dom'

import { cn } from '../../utils/cn'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { LanguageSwitcher } from '../common/LanguageSwitcher'

const navigation = [
  { labelKey: 'home', href: '/' },
  { labelKey: 'about', href: '/about' },
  { labelKey: 'services', href: '/services' },
  { labelKey: 'projects', href: '/projects' },
  { labelKey: 'news', href: '/news' },
  { labelKey: 'contact', href: '/contact' },
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
  const { t } = useTranslation()
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
      <Container className="flex h-[4.5rem] items-center justify-between gap-6 py-3">
        <Link
          aria-label={t('navigation.home')}
          className="flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          to="/"
        >
          <BrandMark />
          <span className="text-xl font-bold tracking-tight text-slate-950">
            Advisora
          </span>
        </Link>

        <nav aria-label={t('public.primaryNavigation')} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => (
              <li key={item.href}>
                <NavLink
                  className={navLinkClasses}
                  end={item.href === '/'}
                  to={item.href}
                >
                  {t(`navigation.${item.labelKey}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher compact />
          <Button size="sm" to="/workspace-signup" variant="outline">
            {t('common.createWorkspace')}
          </Button>
          <Button size="sm" to="/consultation">
            {t('public.getConsultation')}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          aria-label={
            isMenuOpen
              ? t('public.closeNavigation')
              : t('public.openNavigation')
          }
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
          <nav aria-label={t('public.mobileNavigation')}>
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
                    {t(`navigation.${item.labelKey}`)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <LanguageSwitcher className="mt-4 w-full justify-center" />
          <Button className="mt-4 w-full" size="md" to="/consultation">
            {t('public.getConsultation')}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <Button
            className="mt-2 w-full"
            size="md"
            to="/workspace-signup"
            variant="outline"
          >
            {t('common.createWorkspace')}
          </Button>
        </Container>
      </div>
    </header>
  )
}
