'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/provider'
import { site } from '@/lib/site'
import { LanguageToggle } from './language-toggle'

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

export function Navbar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: '/demos', label: t.navbar.demos },
    { href: '/cv', label: t.navbar.cv },
  ]

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight text-text-primary">
          {site.name}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? 'page' : undefined}
              className={`text-sm transition-colors ${
                isActive(pathname, link.href)
                  ? 'text-text-primary underline decoration-accent decoration-2 underline-offset-8'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            {t.navbar.github}
          </a>
          <LanguageToggle />
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-text-secondary transition-colors hover:text-text-primary md:hidden"
          aria-label={open ? t.navbar.closeMenu : t.navbar.openMenu}
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden">
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-x-0 bottom-0 top-16 z-40 bg-black/60"
            aria-hidden
          />
          <nav className="absolute inset-x-0 top-full z-50 border-b border-border bg-background">
            <div className="flex flex-col px-4 py-2">
              {[{ href: '/', label: t.navbar.home }, ...navLinks].map((link) => {
                const active = link.href === '/' ? pathname === '/' : isActive(pathname, link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`border-b border-border py-3.5 text-base ${
                      active ? 'text-accent' : 'text-text-primary'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <a
                href={site.github}
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-border py-3.5 text-base text-text-primary"
              >
                {t.navbar.github}
              </a>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-text-secondary">{t.navbar.language}</span>
                <LanguageToggle />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
