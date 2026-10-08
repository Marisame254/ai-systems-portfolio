'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/provider'
import type { Demo } from '@/lib/demos'
import { StackChips } from './demo-shell'

export function DemoCard({ id, href, icon: Icon, stack }: Demo) {
  const { t } = useLanguage()
  const copy = t.demos[id]
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent/60 sm:p-6"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
        <h3 className="text-base font-semibold text-text-primary">{copy.title}</h3>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">{copy.description}</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <StackChips items={stack} />
        <span className="text-sm font-medium text-accent underline-offset-4 group-hover:underline">
          {t.demos.openDemo}
        </span>
      </div>
    </Link>
  )
}
