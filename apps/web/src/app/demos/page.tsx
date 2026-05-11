import type { Metadata } from 'next'
import { DemoCard } from '@/components/demos/demo-card'
import { demos } from '@/lib/demos'

export const metadata: Metadata = {
  title: 'Demos | Marisame — AI Systems Engineer',
}

export default function DemosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-accent-green sm:text-xs">
        // ai_demos
      </p>
      <h1 className="mb-4 text-2xl font-bold text-text-primary sm:text-4xl">AI Systems Demos</h1>
      <p className="mb-10 max-w-2xl text-sm text-text-secondary sm:mb-12 sm:text-base">
        Interactive demonstrations of AI engineering patterns — from streaming chat to multi-agent
        graphs. Each demo showcases a real architecture pattern used in production AI systems.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {demos.map((demo) => (
          <DemoCard key={demo.href} {...demo} />
        ))}
      </div>
    </div>
  )
}
