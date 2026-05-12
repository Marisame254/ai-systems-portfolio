'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/provider'
import type { DemoId } from '@/lib/demos'

interface DemoCardProps {
  id: DemoId
  href: string
  icon: LucideIcon
  accentColor: 'green' | 'cyan'
  badge?: 'live' | 'preview'
}

const colorMap = {
  green: {
    hover: 'hover:border-accent-green/40 hover:shadow-glow-green',
    iconBg: 'bg-accent-green/10 text-accent-green',
    text: 'text-accent-green',
    badgeLive: 'bg-accent-green/10 text-accent-green',
  },
  cyan: {
    hover: 'hover:border-accent-cyan/40 hover:shadow-glow-cyan',
    iconBg: 'bg-accent-cyan/10 text-accent-cyan',
    text: 'text-accent-cyan',
    badgeLive: 'bg-accent-cyan/10 text-accent-cyan',
  },
}

export function DemoCard({ id, href, icon: Icon, accentColor, badge }: DemoCardProps) {
  const { t } = useLanguage()
  const colors = colorMap[accentColor]
  const copy = t.demos[id]
  const badgeLabel = badge === 'live' ? t.demos.badges.live : badge === 'preview' ? t.demos.badges.preview : null
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 transition-all duration-300 sm:p-6',
        colors.hover
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn('rounded-md p-2', colors.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
        {badgeLabel && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 font-mono text-xs',
              badge === 'live' ? colors.badgeLive : 'bg-border text-text-muted'
            )}
          >
            {badgeLabel}
          </span>
        )}
      </div>
      <div>
        <h3 className="mb-2 font-semibold text-text-primary">{copy.title}</h3>
        <p className="text-sm leading-relaxed text-text-secondary">{copy.description}</p>
      </div>
      <div
        className={cn(
          'flex items-center gap-1 font-mono text-xs opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100',
          colors.text
        )}
      >
        {t.demos.openDemo} <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  )
}
