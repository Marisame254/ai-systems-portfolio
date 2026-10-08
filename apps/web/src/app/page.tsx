'use client'

import Link from 'next/link'
import { AgentGraphFigure } from '@/components/layout/agent-graph-figure'
import { DemoCard } from '@/components/demos/demo-card'
import { StackChips } from '@/components/demos/demo-shell'
import { demoById, demos } from '@/lib/demos'
import { useLanguage } from '@/lib/i18n/provider'
import { site } from '@/lib/site'

const buildOrder = ['chat', 'rag', 'memory'] as const

const projects = [
  { key: 'enterpriseRag', tech: ['FastAPI', 'LangGraph SDK', 'pgvector', 'fastapi-mcp'] },
  { key: 'lyra', tech: ['Python', 'DeepAgents', 'MCP', 'PostgreSQL'] },
  { key: 'mcpServers', tech: ['LangGraph', 'Chainlit', 'MCP'] },
] as const

const primaryButton =
  'inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90'
const secondaryButton =
  'inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-text-muted'

export default function HomePage() {
  const { t } = useLanguage()
  const h = t.home

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-6xl">
            {site.name}
          </h1>
          <p className="mt-3 text-xl text-accent sm:text-2xl">{h.role}</p>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
            {h.pitch}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/demos" className={primaryButton}>
              {h.primaryCta}
            </Link>
            <Link href="/cv" className={secondaryButton}>
              {h.secondaryCta}
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <li>
              <a
                href={`mailto:${site.email}`}
                className="text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
              >
                {site.email}
              </a>
            </li>
            <li>
              <a
                href={site.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
              >
                {site.githubLabel}
              </a>
            </li>
            {site.linkedin && (
              <li>
                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
                >
                  LinkedIn
                </a>
              </li>
            )}
          </ul>
        </div>

        <figure className="mx-auto w-full max-w-[22rem] rounded-lg border border-border bg-surface/50 p-5">
          <AgentGraphFigure label={h.graphAlt} />
          <figcaption className="mt-4 border-t border-border pt-4 text-sm text-text-secondary">
            {h.graphCaption}{' '}
            <Link
              href="/demos/agents"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              {h.graphLink}
            </Link>
          </figcaption>
        </figure>
      </section>

      {/* What I build */}
      <section className="border-t border-border py-14 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">{h.buildTitle}</h2>
        <div className="mt-6 divide-y divide-border border-y border-border">
          {buildOrder.map((id) => {
            const item = h.build[id]
            return (
              <div key={id} className="grid gap-2 py-6 md:grid-cols-[18rem_minmax(0,1fr)_auto] md:gap-8">
                <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
                <p className="max-w-xl text-sm leading-relaxed text-text-secondary">{item.body}</p>
                <Link
                  href={demoById(id).href}
                  className="text-sm font-medium text-accent underline-offset-4 hover:underline md:text-right"
                >
                  {item.link}
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* Demos */}
      <section className="border-t border-border py-14 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">{h.demosTitle}</h2>
        <p className="mt-2 text-sm text-text-secondary sm:text-base">{h.demosIntro}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((demo) => (
            <DemoCard key={demo.id} {...demo} />
          ))}
        </div>
      </section>

      {/* Selected work */}
      <section className="border-t border-border py-14 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">{h.workTitle}</h2>
        <div className="mt-6 divide-y divide-border border-y border-border">
          {projects.map((p) => {
            const copy = t.cv.projects[p.key]
            return (
              <div key={p.key} className="grid gap-3 py-6 md:grid-cols-[18rem_minmax(0,1fr)] md:gap-8">
                <h3 className="text-base font-semibold text-text-primary">{copy.name}</h3>
                <div>
                  <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
                    {copy.description}
                  </p>
                  <StackChips items={[...p.tech]} className="mt-3" />
                </div>
              </div>
            )
          })}
        </div>
        <Link
          href="/cv"
          className="mt-6 inline-block text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          {h.workLink}
        </Link>
      </section>

      {/* Contact */}
      <section className="border-t border-border py-14 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">{h.contactTitle}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
          {h.contactBody}
        </p>
        <a href={`mailto:${site.email}`} className={`${primaryButton} mt-6`}>
          {h.emailCta}
        </a>
      </section>
    </div>
  )
}
