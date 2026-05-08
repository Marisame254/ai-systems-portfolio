'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Terminal } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'home' },
  { href: '/cv', label: 'cv' },
  { href: '/demos', label: 'demos' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-accent-green" />
          <span className="font-mono text-sm font-bold text-text-primary">
            marisame<span className="text-accent-green">_</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6">
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
      </div>
    </header>
  )
}
