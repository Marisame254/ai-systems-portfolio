import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { TerminalHero } from '@/components/layout/terminal-hero'
import { DemoCard } from '@/components/demos/demo-card'
import { demos } from '@/lib/demos'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6">
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
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link
            href="/cv"
            className="flex items-center gap-2 rounded-md border border-accent-green/50 bg-accent-green/10 px-6 py-3 text-sm font-medium text-accent-green transition-all hover:bg-accent-green/20 hover:shadow-glow-green"
          >
            View CV <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/demos"
            className="flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-medium text-text-secondary transition-all hover:border-accent-cyan/50 hover:text-accent-cyan"
          >
            Explore Demos
          </Link>
        </div>
      </section>

      {/* Demo Cards Section */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="mb-2 font-mono text-sm uppercase tracking-widest text-accent-green">
          // live_demos
        </p>
        <h2 className="mb-12 text-3xl font-bold text-text-primary">AI Systems in Action</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {demos.map((demo) => (
            <DemoCard key={demo.href} {...demo} />
          ))}
        </div>
      </section>
    </div>
  )
}
