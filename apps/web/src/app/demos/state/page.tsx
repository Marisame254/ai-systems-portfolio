'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  getThreadHistory,
  getThreadState,
  listThreadsByIds,
  type SerializedMessage,
  type ThreadHistory,
  type ThreadState,
  type ThreadSummary,
} from '@/lib/api'
import { loadThreadIds } from '@/lib/thread-store'
import { MessageBubble, type ChatMessageView, type ToolCall } from '@/components/chat/message-bubble'
import { AlertCircle, Clock, Layers, Loader2 } from 'lucide-react'

function hydrate(serialized: SerializedMessage[]): ChatMessageView[] {
  const result: ChatMessageView[] = []
  const toolResults = new Map<string, string>()
  for (const m of serialized) if (m.type === 'tool' && m.tool_call_id) toolResults.set(m.tool_call_id, m.content)
  for (const m of serialized) {
    if (m.type === 'human') result.push({ role: 'user', content: m.content })
    else if (m.type === 'ai') {
      const calls: ToolCall[] = (m.tool_calls ?? []).map((tc) => ({
        name: tc.name,
        args: tc.args,
        result: tc.id ? toolResults.get(tc.id) : undefined,
      }))
      result.push({
        role: 'assistant',
        content: m.content,
        toolCalls: calls.length ? calls : undefined,
      })
    }
  }
  return result
}

function StatePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryThread = searchParams.get('thread')

  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [activeThread, setActiveThread] = useState<string>(queryThread ?? '')
  const [tab, setTab] = useState<'state' | 'history'>('state')
  const [state, setState] = useState<ThreadState | null>(null)
  const [history, setHistory] = useState<ThreadHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ids = loadThreadIds()
    listThreadsByIds(ids)
      .then((t) => {
        setThreads(t)
        if (!activeThread && t.length) setActiveThread(t[0].thread_id)
      })
      .catch(() => {})
  }, [activeThread])

  const load = useCallback(async (threadId: string) => {
    if (!threadId) return
    setLoading(true)
    setError(null)
    try {
      const [s, h] = await Promise.all([getThreadState(threadId), getThreadHistory(threadId)])
      setState(s)
      setHistory(h)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error')
      setState(null)
      setHistory(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeThread) load(activeThread)
  }, [activeThread, load])

  function selectThread(id: string) {
    setActiveThread(id)
    router.replace(`/demos/state?thread=${id}`)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-green">
          // state_inspector
        </p>
        <h1 className="text-2xl font-bold text-text-primary">LangGraph State Inspector</h1>
        <p className="text-sm text-text-secondary">
          Live view of any thread&apos;s persisted state and checkpoint history (Postgres-backed).
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="font-mono text-xs text-text-muted">thread:</label>
        <select
          value={activeThread}
          onChange={(e) => selectThread(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-accent-cyan/50"
        >
          {threads.length === 0 && <option value="">no threads</option>}
          {threads.map((t) => (
            <option key={t.thread_id} value={t.thread_id}>
              {(t.title || t.thread_id.slice(0, 8)) + ' — ' + t.thread_id.slice(0, 8)}
            </option>
          ))}
        </select>

        <div className="ml-auto flex gap-1 rounded-md border border-border p-0.5">
          <button
            onClick={() => setTab('state')}
            className={`flex items-center gap-1.5 rounded px-3 py-1 font-mono text-xs transition-colors ${
              tab === 'state' ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Layers className="h-3 w-3" />
            current state
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex items-center gap-1.5 rounded px-3 py-1 font-mono text-xs transition-colors ${
              tab === 'history' ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Clock className="h-3 w-3" />
            history
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4 font-mono text-xs">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div>
            <p className="text-red-400">Could not load thread state.</p>
            <p className="mt-1 text-text-muted/60">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-accent-green" />
          loading…
        </div>
      ) : tab === 'state' ? (
        <StateView state={state} />
      ) : (
        <HistoryView history={history} />
      )}
    </div>
  )
}

function StateView({ state }: { state: ThreadState | null }) {
  if (!state) return <p className="font-mono text-xs text-text-muted">empty</p>
  const messages = hydrate(state.values.messages)
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr,18rem]">
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">
          state.values.messages ({state.values.messages.length})
        </p>
        {messages.length === 0 ? (
          <p className="font-mono text-xs text-text-muted">no messages yet</p>
        ) : (
          messages.map((m, i) => <MessageBubble key={i} msg={m} />)
        )}
      </div>

      <aside className="space-y-3 rounded-lg border border-border bg-surface p-4 text-xs">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            next nodes
          </p>
          <p className="mt-1 font-mono text-accent-cyan">
            {state.next.length ? state.next.join(', ') : '∅ (terminal)'}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            checkpoint id
          </p>
          <p className="mt-1 break-all font-mono text-[10px] text-text-secondary">
            {state.checkpoint_id ?? '—'}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">created</p>
          <p className="mt-1 font-mono text-[10px] text-text-secondary">
            {state.created_at ?? '—'}
          </p>
        </div>
      </aside>
    </div>
  )
}

function HistoryView({ history }: { history: ThreadHistory | null }) {
  if (!history) return <p className="font-mono text-xs text-text-muted">empty</p>
  if (history.checkpoints.length === 0)
    return <p className="font-mono text-xs text-text-muted">no checkpoints yet</p>
  return (
    <div className="space-y-2">
      <p className="font-mono text-xs text-text-muted">
        {history.checkpoints.length} checkpoint{history.checkpoints.length === 1 ? '' : 's'} (newest
        first)
      </p>
      {history.checkpoints.map((cp, i) => (
        <CheckpointCard key={cp.checkpoint_id ?? i} cp={cp} index={history.checkpoints.length - i} />
      ))}
    </div>
  )
}

function CheckpointCard({
  cp,
  index,
}: {
  cp: Omit<ThreadState, 'thread_id'>
  index: number
}) {
  const [open, setOpen] = useState(false)
  const messages = hydrate(cp.values.messages)
  return (
    <div className="rounded-lg border border-border bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-2 text-left font-mono text-xs hover:bg-surface-2"
      >
        <span className="rounded bg-accent-cyan/10 px-2 py-0.5 text-accent-cyan">
          #{index}
        </span>
        <span className="text-text-secondary">
          {cp.values.messages.length} msgs · next: {cp.next.length ? cp.next.join(',') : '∅'}
        </span>
        <span className="ml-auto text-[10px] text-text-muted">{cp.created_at ?? ''}</span>
      </button>
      {open && (
        <div className="border-t border-border p-3">
          {messages.length === 0 ? (
            <p className="font-mono text-xs text-text-muted">empty snapshot</p>
          ) : (
            messages.map((m, i) => <MessageBubble key={i} msg={m} />)
          )}
        </div>
      )}
    </div>
  )
}

export default function StatePage() {
  return (
    <Suspense fallback={<div className="p-6 font-mono text-xs text-text-muted">loading…</div>}>
      <StatePageInner />
    </Suspense>
  )
}
