import { Bot, Database, GitBranch, Brain } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type DemoId = 'chat' | 'rag' | 'agents' | 'memory'

export interface Demo {
  id: DemoId
  href: string
  icon: LucideIcon
  accentColor: 'green' | 'cyan'
  badge?: 'live' | 'preview'
}

export const demos: Demo[] = [
  { id: 'chat', href: '/demos/chat', icon: Bot, accentColor: 'green', badge: 'live' },
  { id: 'rag', href: '/demos/rag', icon: Database, accentColor: 'cyan', badge: 'live' },
  { id: 'agents', href: '/demos/agents', icon: GitBranch, accentColor: 'green', badge: 'live' },
  { id: 'memory', href: '/demos/memory', icon: Brain, accentColor: 'cyan', badge: 'live' },
]
