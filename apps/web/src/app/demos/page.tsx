import type { Metadata } from 'next'
import { DemoCard } from '@/components/demos/demo-card'
import { demos } from '@/lib/demos'

export const metadata: Metadata = {
  title: 'Demos | Marisame — AI Systems Engineer',
}

export default function DemosPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent-green">
        // ai_demos
      </p>
      <h1 className="mb-4 text-4xl font-bold text-text-primary">AI Systems Demos</h1>
      <p className="mb-12 max-w-2xl text-text-secondary">
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
