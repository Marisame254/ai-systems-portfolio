'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/provider'

export function DemoBreadcrumb({ current }: { current: string }) {
  const { t } = useLanguage()
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-text-muted">
      <Link href="/demos" className="transition-colors hover:text-text-primary">
        {t.common.demosCrumb}
      </Link>
      <span aria-hidden className="mx-2">
        /
      </span>
      <span aria-current="page" className="text-text-secondary">
        {current}
      </span>
    </nav>
  )
}

export function StackChips({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {items.map((item) => (
        <li
          key={item}
          className="rounded border border-border px-1.5 py-0.5 text-xs text-text-muted"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

export function DemoShell({
  title,
  description,
  stack,
  width = 'narrow',
  children,
}: {
  title: string
  description: React.ReactNode
  stack?: string[]
  width?: 'narrow' | 'wide'
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'mx-auto px-4 py-8 sm:px-6 sm:py-10',
        width === 'wide' ? 'max-w-6xl' : 'max-w-4xl'
      )}
    >
      <header className="mb-8">
        <DemoBreadcrumb current={title} />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
          {description}
        </p>
        {stack && <StackChips items={stack} className="mt-4" />}
      </header>
      {children}
    </div>
  )
}
