'use client'

import { useCallback, useEffect, useState } from 'react'
import { Brain, RefreshCw, Trash2, Plus, Loader2, Sparkles, Hand } from 'lucide-react'
import {
  listMemories,
  addMemory as apiAddMemory,
  deleteMemory as apiDeleteMemory,
  clearMemories as apiClearMemories,
  type MemoryEntry,
} from '@/lib/api'
import { getUserId } from '@/lib/user'

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-CA', { hour12: false }).replace(',', '')
  } catch {
    return iso
  }
}

export default function MemoryPage() {
  const [userId, setUserId] = useState<string>('')
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newText, setNewText] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async (uid: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await listMemories(uid)
      setMemories(res.entries)
    } catch {
      setError('Could not reach the API. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const uid = getUserId()
    setUserId(uid)
    if (uid) refresh(uid)
  }, [refresh])

  async function handleAdd() {
    const text = newText.trim()
    if (!text || busy) return
    setBusy(true)
    try {
      const created = await apiAddMemory(userId, text)
      setMemories((prev) => [created, ...prev])
      setNewText('')
    } catch {
      setError('Failed to add memory.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(key: string) {
    const prev = memories
    setMemories((cur) => cur.filter((m) => m.key !== key))
    try {
      await apiDeleteMemory(userId, key)
    } catch {
      setMemories(prev)
      setError('Failed to delete memory.')
    }
  }

  async function handleClear() {
    if (busy || memories.length === 0) return
    setBusy(true)
    try {
      await apiClearMemories(userId)
      setMemories([])
    } catch {
      setError('Failed to clear memories.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent-cyan sm:text-xs">
          // memory_demo
        </p>
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Long-term Memory</h1>
        <p className="text-xs text-text-secondary sm:text-sm">
          Cross-thread facts the agent remembers about you. Stored in Postgres via LangGraph&apos;s{' '}
          <code className="font-mono text-xs text-accent-cyan">AsyncPostgresStore</code> under{' '}
          <code className="font-mono text-xs text-accent-cyan">
            (&quot;memories&quot;, user_id)
          </code>
          .
        </p>
      </div>

      {/* Session info */}
      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 shrink-0 text-accent-cyan" />
          <div className="min-w-0">
            <p className="font-mono text-xs text-text-muted">user_id</p>
            <p className="truncate font-mono text-sm text-accent-cyan">{userId || '…'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-text-muted">
            {memories.length} {memories.length === 1 ? 'entry' : 'entries'}
          </span>
          <button
            onClick={() => userId && refresh(userId)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-xs text-text-muted transition-all hover:border-accent-cyan/30 hover:text-accent-cyan disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> refresh
          </button>
          <button
            onClick={handleClear}
            disabled={busy || memories.length === 0}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-xs text-text-muted transition-all hover:border-red-500/30 hover:text-red-400 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" /> clear all
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 font-mono text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Memory entries */}
      <div className="mb-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12">
            <Loader2 className="h-5 w-5 animate-spin text-accent-cyan/50" />
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
            <Brain className="mb-3 h-8 w-8 text-accent-cyan/30" />
            <p className="font-mono text-sm text-text-muted">No memories yet</p>
            <p className="mt-1 font-mono text-xs text-text-muted/70">
              Chat with the agent or add an entry below.
            </p>
          </div>
        ) : (
          memories.map((mem) => (
            <div
              key={mem.key}
              className="group flex items-start justify-between rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent-cyan/20"
            >
              <div className="flex-1 pr-4">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                      mem.source === 'auto'
                        ? 'bg-accent-cyan/10 text-accent-cyan'
                        : 'bg-accent-green/10 text-accent-green'
                    }`}
                  >
                    {mem.source === 'auto' ? (
                      <Sparkles className="h-2.5 w-2.5" />
                    ) : (
                      <Hand className="h-2.5 w-2.5" />
                    )}
                    {mem.source}
                  </span>
                  <span className="font-mono text-xs text-text-muted">
                    {formatTimestamp(mem.created_at)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{mem.text}</p>
              </div>
              <button
                onClick={() => handleRemove(mem.key)}
                className="shrink-0 rounded p-1 text-text-muted opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
                aria-label="Delete memory"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add memory */}
      <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-accent-cyan">
          Add Memory Entry
        </h2>
        <div className="flex flex-col gap-3">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. Prefers concise answers with code examples"
            className="rounded-lg border border-border bg-surface-2 px-3 py-3 text-base text-text-primary placeholder-text-muted outline-none transition-all focus:border-accent-cyan/50 sm:px-4 sm:py-2.5 sm:text-sm"
          />
          <button
            onClick={handleAdd}
            disabled={!newText.trim() || busy}
            className="flex items-center justify-center gap-2 rounded-lg border border-accent-cyan/50 bg-accent-cyan/10 px-4 py-2.5 text-sm font-medium text-accent-cyan transition-all hover:bg-accent-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Entry
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-4">
        <p className="font-mono text-xs text-text-muted">
          <span className="text-accent-cyan">{'>'}</span> The agent&apos;s graph has{' '}
          <code className="text-accent-cyan">load_memory</code> and{' '}
          <code className="text-accent-cyan">save_memory</code> nodes. On every turn it pulls
          relevant facts for your <code className="text-accent-cyan">user_id</code> and, after
          replying, extracts new durable facts via the LLM and persists them here.
        </p>
      </div>
    </div>
  )
}
