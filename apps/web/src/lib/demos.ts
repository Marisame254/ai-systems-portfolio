import { Bot, Database, GitBranch, Brain } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Demo {
  title: string
  description: string
  href: string
  icon: LucideIcon
  accentColor: 'green' | 'cyan'
  badge?: string
}

export const demos: Demo[] = [
  {
    title: 'AI Chat Playground',
    description: 'Streaming chat powered by Claude claude-sonnet-4-6 with real-time token rendering.',
    href: '/demos/chat',
    icon: Bot,
    accentColor: 'green',
    badge: 'Live',
  },
  {
    title: 'RAG Demo',
    description: 'Upload documents and query them using pgvector-powered retrieval augmented generation.',
    href: '/demos/rag',
    icon: Database,
    accentColor: 'cyan',
    badge: 'Preview',
  },
  {
    title: 'Agent Visualization',
    description: 'Interactive LangGraph state machine graph with live node execution traces.',
    href: '/demos/agents',
    icon: GitBranch,
    accentColor: 'green',
    badge: 'Preview',
  },
  {
    title: 'Memory Demo',
    description: 'Redis-backed conversation memory with cross-session context persistence.',
    href: '/demos/memory',
    icon: Brain,
    accentColor: 'cyan',
    badge: 'Preview',
  },
]
