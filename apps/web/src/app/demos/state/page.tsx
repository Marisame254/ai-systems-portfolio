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
import { AlertCircle, Clock, Layers, Loader2, RotateCcw } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/provider'
import type { Dictionary } from '@/lib/i18n'

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
  const { t } = useLanguage()
  const ts = t.stateDemo
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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 sm:mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent-green sm:text-xs">
          {ts.label}
        </p>
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">{ts.title}</h1>
        <p className="text-xs text-text-secondary sm:text-sm">{ts.description}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="font-mono text-xs text-text-muted">{ts.threadLabel}</label>
        <select
          value={activeThread}
          onChange={(e) => selectThread(e.target.value)}
          className="min-w-0 max-w-full flex-1 rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-accent-cyan/50 sm:flex-none"
        >
          {threads.length === 0 && <option value="">{ts.noThreads}</option>}
          {threads.map((th) => (
            <option key={th.thread_id} value={th.thread_id}>
              {(th.title || th.thread_id.slice(0, 8)) + ' — ' + th.thread_id.slice(0, 8)}
            </option>
          ))}
        </select>

        <div className="flex w-full gap-1 rounded-md border border-border p-0.5 sm:ml-auto sm:w-auto">
          <button
            onClick={() => setTab('state')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 font-mono text-xs transition-colors sm:flex-none ${
              tab === 'state' ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Layers className="h-3 w-3" />
            {ts.currentState}
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 font-mono text-xs transition-colors sm:flex-none ${
              tab === 'history' ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Clock className="h-3 w-3" />
            {ts.history}
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4 font-mono text-xs">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div>
            <p className="text-red-400">{ts.errorTitle}</p>
            <p className="mt-1 text-text-muted/60">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-accent-green" />
          {ts.loading}
        </div>
      ) : tab === 'state' ? (
        <StateView state={state} ts={ts} />
      ) : (
        <HistoryView history={history} ts={ts} threadId={activeThread} router={router} />
      )}
    </div>
  )
}

function StateView({
  state,
  ts,
}: {
  state: ThreadState | null
  ts: Dictionary['stateDemo']
}) {
  if (!state) return <p className="font-mono text-xs text-text-muted">{ts.empty}</p>
  const messages = hydrate(state.values.messages)
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr,18rem]">
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">
          {ts.messagesLabel(state.values.messages.length)}
        </p>
        {messages.length === 0 ? (
          <p className="font-mono text-xs text-text-muted">{ts.noMessages}</p>
        ) : (
          messages.map((m, i) => <MessageBubble key={i} msg={m} />)
        )}
      </div>

      <aside className="space-y-3 rounded-lg border border-border bg-surface p-4 text-xs">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {ts.nextNodes}
          </p>
          <p className="mt-1 font-mono text-accent-cyan">
            {state.next.length ? state.next.join(', ') : ts.terminal}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {ts.checkpointId}
          </p>
          <p className="mt-1 break-all font-mono text-[10px] text-text-secondary">
            {state.checkpoint_id ?? '—'}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{ts.created}</p>
          <p className="mt-1 font-mono text-[10px] text-text-secondary">
            {state.created_at ?? '—'}
          </p>
        </div>
      </aside>
    </div>
  )
}

function HistoryView({
  history,
  ts,
  threadId,
  router,
}: {
  history: ThreadHistory | null
  ts: Dictionary['stateDemo']
  threadId: string
  router: ReturnType<typeof useRouter>
}) {
  if (!history) return <p className="font-mono text-xs text-text-muted">{ts.empty}</p>
  if (history.checkpoints.length === 0)
    return <p className="font-mono text-xs text-text-muted">{ts.noCheckpoints}</p>
  return (
    <div className="space-y-2">
      <p className="font-mono text-xs text-text-muted">{ts.checkpointsCount(history.checkpoints.length)}</p>
      {history.checkpoints.map((cp, i) => (
        <CheckpointCard
          key={cp.checkpoint_id ?? i}
          cp={cp}
          index={history.checkpoints.length - i}
          ts={ts}
          threadId={threadId}
          router={router}
        />
      ))}
    </div>
  )
}

function CheckpointCard({
  cp,
  index,
  ts,
  threadId,
  router,
}: {
  cp: Omit<ThreadState, 'thread_id'>
  index: number
  ts: Dictionary['stateDemo']
  threadId: string
  router: ReturnType<typeof useRouter>
}) {
  const [open, setOpen] = useState(false)
  const messages = hydrate(cp.values.messages)
  const canRewind = !!cp.checkpoint_id && cp.values.messages.length > 0

  function handleRewind(e: React.MouseEvent) {
    e.stopPropagation()
    if (!canRewind) return
    router.push(
      `/demos/chat?thread=${encodeURIComponent(threadId)}&checkpoint=${encodeURIComponent(
        cp.checkpoint_id as string,
      )}`,
    )
  }

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex w-full items-center gap-3 px-4 py-2 font-mono text-xs">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-3 text-left hover:text-text-primary"
        >
          <span className="rounded bg-accent-cyan/10 px-2 py-0.5 text-accent-cyan">
            #{index}
          </span>
          <span className="text-text-secondary">
            {cp.values.messages.length} {ts.msgs} · {ts.next}:{' '}
            {cp.next.length ? cp.next.join(',') : '∅'}
          </span>
          <span className="ml-auto text-[10px] text-text-muted">{cp.created_at ?? ''}</span>
        </button>
        <button
          onClick={handleRewind}
          disabled={!canRewind}
          aria-label={ts.rewindAria}
          title={canRewind ? ts.rewindAria : ts.rewindDisabled}
          className="ml-2 flex shrink-0 items-center gap-1 rounded-md border border-accent-green/30 bg-accent-green/5 px-2 py-1 font-mono text-[11px] text-accent-green transition-colors hover:bg-accent-green/15 disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-text-muted/40"
        >
          <RotateCcw className="h-3 w-3" />
          <span className="hidden sm:inline">{ts.rewindHere}</span>
        </button>
      </div>
      {open && (
        <div className="border-t border-border p-3">
          {messages.length === 0 ? (
            <p className="font-mono text-xs text-text-muted">{ts.emptySnapshot}</p>
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
