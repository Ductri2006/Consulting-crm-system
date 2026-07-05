import { Mail, MapPin, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Container } from '../common/Container'
import { LanguageSwitcher } from '../common/LanguageSwitcher'

const quickLinks = [
  { labelKey: 'public.aboutUs', href: '/about' },
  { labelKey: 'public.ourServices', href: '/services' },
  { labelKey: 'navigation.projects', href: '/projects' },
  { labelKey: 'public.insights', href: '/news' },
  { labelKey: 'navigation.contact', href: '/contact' },
]

const serviceLinks = [
  {
    labelKey: 'public.forms.services.realEstate',
    href: '/services/real-estate-consulting',
  },
  { labelKey: 'public.forms.services.legal', href: '/services/legal-consulting' },
  {
    labelKey: 'public.forms.services.investment',
    href: '/services/investment-consulting',
  },
  {
    labelKey: 'public.forms.services.construction',
    href: '/services/construction-consulting',
  },
]

const footerLinkClasses =
  'text-sm text-slate-400 transition hover:text-white focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-slate-950 text-slate-300">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_0.75fr_1fr_1.2fr]">
          <div>
            <Link
              aria-label={t('navigation.home')}
              className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              to="/"
            >
              <span
                aria-hidden="true"
                className="grid size-10 place-items-center rounded-xl bg-blue-600 text-lg font-extrabold text-white"
              >
                A
              </span>
              <span className="text-xl font-bold text-white">Advisora</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              {t('public.footerDescription')}
            </p>
            <LanguageSwitcher className="mt-5 border-slate-800 bg-slate-900 text-slate-300 shadow-none" />
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              {t('public.quickLinks')}
            </h2>
            <ul className="mt-5 space-y-3">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link className={footerLinkClasses} to={item.href}>
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              {t('navigation.services')}
            </h2>
            <ul className="mt-5 space-y-3">
              {serviceLinks.map((item) => (
                <li key={item.href}>
                  <Link className={footerLinkClasses} to={item.href}>
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              {t('navigation.contact')}
            </h2>
            <address className="mt-5 space-y-4 not-italic">
              <a
                className="flex items-start gap-3 text-sm text-slate-400 transition hover:text-white"
                href="mailto:hello@advisora.demo"
              >
                <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-blue-400" />
                hello@advisora.demo
              </a>
              <a
                className="flex items-start gap-3 text-sm text-slate-400 transition hover:text-white"
                href="tel:+84900000000"
              >
                <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-blue-400" />
                +84 900 000 000
              </a>
              <p className="flex items-start gap-3 text-sm text-slate-400">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-blue-400" />
                {t('public.contactPage.locationValue')}
              </p>
            </address>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6">
          <p className="text-sm text-slate-500">
            (c) {new Date().getFullYear()} Advisora.{' '}
            {t('public.allRightsReserved')}
          </p>
        </div>
      </Container>
    </footer>
  )
}
