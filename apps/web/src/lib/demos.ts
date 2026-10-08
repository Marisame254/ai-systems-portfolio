import { Activity, Bot, Brain, FileSearch, GitBranch } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type DemoId = 'chat' | 'rag' | 'agents' | 'memory' | 'state'

export interface Demo {
  id: DemoId
  href: string
  icon: LucideIcon
  stack: string[]
}

export const demos: Demo[] = [
  { id: 'chat', href: '/demos/chat', icon: Bot, stack: ['LangGraph', 'SSE', 'Tavily'] },
  { id: 'rag', href: '/demos/rag', icon: FileSearch, stack: ['pgvector', 'Embeddings', 'SSE'] },
  { id: 'agents', href: '/demos/agents', icon: GitBranch, stack: ['StateGraph', 'React Flow'] },
  { id: 'memory', href: '/demos/memory', icon: Brain, stack: ['Postgres store', 'Vector index'] },
  { id: 'state', href: '/demos/state', icon: Activity, stack: ['Checkpoints', 'Time travel'] },
]

export function demoById(id: DemoId): Demo {
  return demos.find((d) => d.id === id) as Demo
}
