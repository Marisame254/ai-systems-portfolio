'use client'

import { useState } from 'react'
import { Brain, RefreshCw, Trash2, Plus } from 'lucide-react'

interface MemoryEntry {
  key: string
  value: string
  timestamp: string
}

const MOCK_MEMORIES: MemoryEntry[] = [
  {
    key: 'user_preference',
    value: 'Prefers concise answers with code examples',
    timestamp: '2024-01-15 14:23',
  },
  {
    key: 'last_topic',
    value: 'LangGraph conditional edges and state management',
    timestamp: '2024-01-15 14:30',
  },
  {
    key: 'context_summary',
    value: 'User is building a multi-agent RAG pipeline with FastAPI backend',
    timestamp: '2024-01-15 14:45',
  },
]

export default function MemoryPage() {
  const [sessionId] = useState(() => Math.random().toString(36).slice(2, 10))
  const [memories, setMemories] = useState<MemoryEntry[]>(MOCK_MEMORIES)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  function addMemory() {
    if (!newKey.trim() || !newValue.trim()) return
    setMemories((prev) => [
      ...prev,
      {
        key: newKey,
        value: newValue,
        timestamp: new Date().toLocaleString('en-CA', { hour12: false }).replace(',', ''),
      },
    ])
    setNewKey('')
    setNewValue('')
  }

  function removeMemory(key: string) {
    setMemories((prev) => prev.filter((m) => m.key !== key))
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-cyan">
          // memory_demo
        </p>
        <h1 className="text-2xl font-bold text-text-primary">Memory Demo</h1>
        <p className="text-sm text-text-secondary">
          Redis-backed key-value memory store — persists context across agent turns.
        </p>
      </div>

      {/* Session info */}
      <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-accent-cyan" />
          <div>
            <p className="font-mono text-xs text-text-muted">session_id</p>
            <p className="font-mono text-sm text-accent-cyan">{sessionId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-text-muted">
            {memories.length} entries in memory
          </span>
          <button
            onClick={() => setMemories([])}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-xs text-text-muted transition-all hover:border-red-500/30 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" /> clear
          </button>
          <button
            onClick={() => setMemories(MOCK_MEMORIES)}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-xs text-text-muted transition-all hover:border-accent-cyan/30 hover:text-accent-cyan"
          >
            <RefreshCw className="h-3 w-3" /> reset
          </button>
        </div>
      </div>

      {/* Memory entries */}
      <div className="mb-6 space-y-3">
        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
            <Brain className="mb-3 h-8 w-8 text-accent-cyan/30" />
            <p className="font-mono text-sm text-text-muted">Memory cleared</p>
          </div>
        ) : (
          memories.map((mem) => (
            <div
              key={mem.key}
              className="group flex items-start justify-between rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent-cyan/20"
            >
              <div className="flex-1 pr-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-xs text-accent-cyan">{mem.key}</span>
                  <span className="font-mono text-xs text-text-muted">{mem.timestamp}</span>
                </div>
                <p className="text-sm text-text-secondary">{mem.value}</p>
              </div>
              <button
                onClick={() => removeMemory(mem.key)}
                className="shrink-0 rounded p-1 text-text-muted opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add memory */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-accent-cyan">
          Add Memory Entry
        </h2>
        <div className="flex flex-col gap-3">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="key (e.g. user_goal)"
            className="rounded-lg border border-border bg-surface-2 px-4 py-2.5 font-mono text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-accent-cyan/50"
          />
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="value"
            onKeyDown={(e) => e.key === 'Enter' && addMemory()}
            className="rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-accent-cyan/50"
          />
          <button
            onClick={addMemory}
            disabled={!newKey.trim() || !newValue.trim()}
            className="flex items-center justify-center gap-2 rounded-lg border border-accent-cyan/50 bg-accent-cyan/10 px-4 py-2.5 text-sm font-medium text-accent-cyan transition-all hover:bg-accent-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add Entry
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-4">
        <p className="font-mono text-xs text-text-muted">
          <span className="text-accent-cyan">{'>'}</span> In production, this memory is stored in
          Redis and retrieved by session_id on every agent turn. The agent uses it to maintain
          context across multiple conversations.
        </p>
      </div>
    </div>
  )
}
