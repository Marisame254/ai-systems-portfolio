'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { TerminalHero } from '@/components/layout/terminal-hero'
import { DemoCard } from '@/components/demos/demo-card'
import { demos } from '@/lib/demos'
import { useLanguage } from '@/lib/i18n/provider'

export default function HomePage() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-12 sm:min-h-[90vh] sm:px-6">
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <TerminalHero />
        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:mt-12 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
          <Link
            href="/cv"
            className="flex items-center justify-center gap-2 rounded-md border border-accent-green/50 bg-accent-green/10 px-6 py-3 text-sm font-medium text-accent-green transition-all hover:bg-accent-green/20 hover:shadow-glow-green"
          >
            {t.home.viewCv} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/demos"
            className="flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-medium text-text-secondary transition-all hover:border-accent-cyan/50 hover:text-accent-cyan"
          >
            {t.home.exploreDemos}
          </Link>
        </div>
      </section>

      {/* Demo Cards Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent-green sm:text-sm">
          {t.home.liveDemosLabel}
        </p>
        <h2 className="mb-8 text-2xl font-bold text-text-primary sm:mb-12 sm:text-3xl">
          {t.home.sectionTitle}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {demos.map((demo) => (
            <DemoCard key={demo.href} {...demo} />
          ))}
        </div>
      </section>
    </div>
  )
}
