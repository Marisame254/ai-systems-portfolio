'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Terminal, X } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/cv', label: 'CV' },
  { href: '/demos', label: 'Demos' },
]

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-accent-green" />
          <span className="font-mono text-sm font-bold text-text-primary">
            marisame<span className="text-accent-green">_</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-mono text-sm transition-colors ${
                pathname === link.href
                  ? 'text-accent-green'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/marisame254"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text-secondary transition-all hover:border-accent-green/50 hover:text-accent-green"
          >
            github
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-secondary transition-colors hover:border-accent-green/50 hover:text-accent-green md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`fixed inset-x-0 top-[65px] bottom-0 z-40 bg-black/60 transition-opacity ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <nav
          className={`absolute inset-x-0 top-full z-50 origin-top border-b border-border bg-background/95 backdrop-blur-sm transition-all ${
            open
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-2 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between rounded-md border border-transparent px-3 py-3 font-mono text-sm transition-colors ${
                  pathname === link.href
                    ? 'border-accent-green/30 bg-accent-green/10 text-accent-green'
                    : 'text-text-secondary hover:border-border hover:text-text-primary'
                }`}
              >
                <span>{link.label}</span>
                <span className="text-text-muted">→</span>
              </Link>
            ))}
            <a
              href="https://github.com/marisame254"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center justify-between rounded-md border border-border px-3 py-3 font-mono text-sm text-text-secondary transition-all hover:border-accent-green/50 hover:text-accent-green"
            >
              <span>github</span>
              <span className="text-text-muted">↗</span>
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
