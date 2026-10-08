'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Trash2, Loader2 } from 'lucide-react'
import {
  ApiError,
  listMemories,
  addMemory as apiAddMemory,
  deleteMemory as apiDeleteMemory,
  clearMemories as apiClearMemories,
  type MemoryEntry,
} from '@/lib/api'
import { getUserId } from '@/lib/user'
import { demoById } from '@/lib/demos'
import { useLanguage } from '@/lib/i18n/provider'
import { DemoShell } from '@/components/demos/demo-shell'

export default function MemoryPage() {
  const { t, locale } = useLanguage()
  const tm = t.memoryDemo
  const [userId, setUserId] = useState<string>('')
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newText, setNewText] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(
    async (uid: string) => {
      setLoading(true)
      setError(null)
      try {
        const res = await listMemories(uid)
        setMemories(res.entries)
      } catch {
        setError(tm.errors.load)
      } finally {
        setLoading(false)
      }
    },
    [tm]
  )

  useEffect(() => {
    const uid = getUserId()
    setUserId(uid)
    if (uid) refresh(uid)
  }, [refresh])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const text = newText.trim()
    if (!text || busy) return
    setBusy(true)
    setError(null)
    try {
      const created = await apiAddMemory(userId, text)
      setMemories((prev) => [created, ...prev])
      setNewText('')
    } catch (err) {
      // The API explains the per-user cap and rate limits.
      setError(err instanceof ApiError ? err.message : tm.errors.add)
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(key: string) {
    const before = memories
    setMemories(before.filter((m) => m.key !== key))
    try {
      await apiDeleteMemory(userId, key)
    } catch {
      setMemories(before)
      setError(tm.errors.remove)
    }
  }

  async function handleClear() {
    if (busy || memories.length === 0) return
    setBusy(true)
    try {
      await apiClearMemories(userId)
      setMemories([])
    } catch {
      setError(tm.errors.clear)
    } finally {
      setBusy(false)
    }
  }

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso)
    return Number.isNaN(date.getTime())
      ? iso
      : date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
  }

  return (
    <DemoShell title={tm.title} description={tm.description} stack={demoById('memory').stack}>
      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-text-muted">{tm.userIdLabel}</p>
          <p className="truncate font-mono text-sm text-text-primary">{userId || '…'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary">{tm.entryCount(memories.length)}</span>
          <button
            onClick={() => userId && refresh(userId)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> {tm.refresh}
          </button>
          <button
            onClick={handleClear}
            disabled={busy || memories.length === 0}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> {tm.clearAll}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      ) : memories.length === 0 ? (
        // A failed load is not "no memories"; the alert above already says what happened.
        !error && (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-base text-text-primary">{tm.noEntriesTitle}</p>
            <p className="mt-1 text-sm text-text-secondary">{tm.noEntriesHint}</p>
          </div>
        )
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {memories.map((mem) => (
            <li key={mem.key} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="text-sm text-text-primary">{mem.text}</p>
                <p className="mt-1 text-xs text-text-muted">
                  <span className={mem.source === 'auto' ? 'text-node-memory' : 'text-text-secondary'}>
                    {mem.source === 'auto' ? tm.sourceAuto : tm.sourceManual}
                  </span>
                  , {formatTimestamp(mem.created_at)}
                </p>
              </div>
              <button
                onClick={() => handleRemove(mem.key)}
                className="shrink-0 rounded p-2 text-text-muted transition-colors hover:bg-surface-2 hover:text-red-400"
                aria-label={tm.deleteEntryAria}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleAdd}
        className="mt-6 rounded-lg border border-border bg-surface p-4 sm:p-6"
      >
        <label htmlFor="new-memory" className="text-base font-semibold text-text-primary">
          {tm.addEntryHeader}
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="new-memory"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={tm.addEntryPlaceholder}
            maxLength={300}
            className="min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-base text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent/60 sm:text-sm"
          />
          <button
            type="submit"
            disabled={!newText.trim() || busy}
            className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {tm.addEntryButton}
          </button>
        </div>
      </form>
    </DemoShell>
  )
}
