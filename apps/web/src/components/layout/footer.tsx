'use client'

import { useLanguage } from '@/lib/i18n/provider'
import { site } from '@/lib/site'

export function Footer() {
  const { t } = useLanguage()
  const links = [
    { href: `mailto:${site.email}`, label: site.email },
    { href: site.github, label: t.navbar.github, external: true },
    ...(site.linkedin ? [{ href: site.linkedin, label: 'LinkedIn', external: true }] : []),
    { href: site.repo, label: t.footer.source, external: true },
  ]
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-text-muted">
          <span className="text-text-secondary">
            {site.name} ({site.handle})
          </span>
          <span className="mx-2" aria-hidden>
            |
          </span>
          {t.footer.builtWith}
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="text-text-secondary transition-colors hover:text-text-primary"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
