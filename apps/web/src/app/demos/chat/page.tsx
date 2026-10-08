'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ApiError,
  streamChat,
  getChatInfo,
  listThreadsByIds,
  deleteThread,
  getThreadState,
  getThreadStateAtCheckpoint,
  type ChatInfo,
  type ThreadSummary,
} from '@/lib/api'
import {
  loadThreadIds,
  addThreadId,
  removeThreadId,
  MAX_THREADS,
} from '@/lib/thread-store'
import { hydrateMessages } from '@/lib/messages'
import { getUserId } from '@/lib/user'
import { useLanguage } from '@/lib/i18n/provider'
import type { Dictionary } from '@/lib/i18n'
import { DemoBreadcrumb } from '@/components/demos/demo-shell'
import { MessageBubble, type ChatMessageView } from '@/components/chat/message-bubble'
import {
  Send,
  Square,
  Plus,
  Trash2,
  AlertTriangle,
  Menu,
  X,
  GitBranch,
  Loader2,
} from 'lucide-react'

// 'saving': the visible reply is complete and the graph is in save_memory.
type Phase = 'idle' | 'answering' | 'saving'

function newThreadId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'th_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function relativeTime(iso: string | null, t: Dictionary['common']): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return t.justNow
  if (m < 60) return t.minutesAgo(m)
  const h = Math.floor(m / 60)
  if (h < 24) return t.hoursAgo(h)
  const d = Math.floor(h / 24)
  return t.daysAgo(d)
}

function ChatPageInner() {
  const { t } = useLanguage()
  const tc = t.chatDemo
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryThread = searchParams.get('thread')
  const queryCheckpoint = searchParams.get('checkpoint')

  const [info, setInfo] = useState<ChatInfo | null>(null)
  const [threadIds, setThreadIds] = useState<string[]>([])
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessageView[]>([])
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [loadingThread, setLoadingThread] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingCheckpointId, setPendingCheckpointId] = useState<string | null>(null)
  const [branchError, setBranchError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamAbortRef = useRef<AbortController | null>(null)

  const busy = phase !== 'idle'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Abort any in-flight stream when the component unmounts.
  useEffect(() => {
    return () => streamAbortRef.current?.abort()
  }, [])

  useEffect(() => {
    getChatInfo().then(setInfo).catch(() => {})
  }, [])

  const refreshThreads = useCallback(async (ids: string[]) => {
    try {
      setThreads(await listThreadsByIds(ids))
    } catch {
      // backend down — keep current
    }
  }, [])

  const selectThread = useCallback(async (threadId: string) => {
    setActiveThreadId(threadId)
    setSidebarOpen(false)
    setLoadingThread(true)
    setMessages([])
    setPendingCheckpointId(null)
    setBranchError(null)
    try {
      const state = await getThreadState(threadId)
      setMessages(hydrateMessages(state.values.messages))
    } catch {
      setMessages([])
    } finally {
      setLoadingThread(false)
    }
  }, [])

  const enterFork = useCallback(async (threadId: string, checkpointId: string) => {
    setActiveThreadId(threadId)
    setSidebarOpen(false)
    setLoadingThread(true)
    setMessages([])
    setBranchError(null)
    setPendingCheckpointId(checkpointId)
    try {
      const state = await getThreadStateAtCheckpoint(threadId, checkpointId)
      setMessages(hydrateMessages(state.values.messages))
    } catch {
      setPendingCheckpointId(null)
      setBranchError(tc.branchLoadFailed)
      // fall back to head state
      try {
        const state = await getThreadState(threadId)
        setMessages(hydrateMessages(state.values.messages))
      } catch {
        setMessages([])
      }
    } finally {
      setLoadingThread(false)
    }
  }, [tc.branchLoadFailed])

  useEffect(() => {
    const ids = loadThreadIds()
    setThreadIds(ids)
    refreshThreads(ids)

    // Query params take precedence over the most-recent thread
    if (queryThread && queryCheckpoint) {
      enterFork(queryThread, queryCheckpoint)
    } else if (queryThread) {
      selectThread(queryThread)
    } else if (ids[0]) {
      selectThread(ids[0])
    } else {
      setActiveThreadId(newThreadId())
    }

    if (queryThread || queryCheckpoint) {
      router.replace('/demos/chat')
    }
    // intentionally run once on mount — query params are read from initial URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startNewChat = useCallback(() => {
    streamAbortRef.current?.abort()
    setActiveThreadId(newThreadId())
    setMessages([])
    setSidebarOpen(false)
    setPendingCheckpointId(null)
    setBranchError(null)
  }, [])

  const cancelBranch = useCallback(async () => {
    if (!activeThreadId) return
    setPendingCheckpointId(null)
    setBranchError(null)
    setLoadingThread(true)
    try {
      const state = await getThreadState(activeThreadId)
      setMessages(hydrateMessages(state.values.messages))
    } catch {
      setMessages([])
    } finally {
      setLoadingThread(false)
    }
  }, [activeThreadId])

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      const nextIds = removeThreadId(threadId)
      setThreadIds(nextIds)
      try {
        await deleteThread(threadId)
      } catch {
        // swallow
      }
      if (threadId === activeThreadId) {
        startNewChat()
      }
      await refreshThreads(nextIds)
    },
    [activeThreadId, startNewChat, refreshThreads]
  )

  function replaceLastMessage(update: (last: ChatMessageView) => ChatMessageView) {
    setMessages((prev) => {
      if (prev.length === 0) return prev
      const updated = [...prev]
      updated[updated.length - 1] = update({ ...updated[updated.length - 1] })
      return updated
    })
  }

  async function send(text: string) {
    const messageText = text.trim()
    if (!messageText || busy) return

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: messageText },
      { role: 'assistant', content: '' },
    ])
    setInput('')
    setPhase('answering')

    const checkpointForThisTurn = pendingCheckpointId

    const controller = new AbortController()
    streamAbortRef.current = controller

    try {
      for await (const event of streamChat(messageText, activeThreadId, getUserId(), {
        ...(checkpointForThisTurn ? { checkpointId: checkpointForThisTurn } : {}),
        signal: controller.signal,
      })) {
        if (event.type === 'node') {
          if (event.name === 'save_memory' && event.status === 'start') setPhase('saving')
          continue
        }
        replaceLastMessage((last) => {
          if (event.type === 'token') {
            last.content = (last.content || '') + event.text
          } else if (event.type === 'tool_call') {
            last.toolCalls = [...(last.toolCalls || []), { name: event.name, args: event.args }]
          } else if (event.type === 'tool_result') {
            const calls = [...(last.toolCalls || [])]
            for (let i = calls.length - 1; i >= 0; i--) {
              if (calls[i].name === event.name && !calls[i].result) {
                calls[i] = { ...calls[i], result: event.result }
                break
              }
            }
            last.toolCalls = calls
          } else if (event.type === 'error') {
            last.content = last.content || tc.streamError
          }
          return last
        })
      }
      // After a successful turn, we're at the head of whatever branch we forked into.
      if (checkpointForThisTurn) setPendingCheckpointId(null)
      const wasRegistered = loadThreadIds().includes(activeThreadId)
      if (!wasRegistered) {
        const { ids, evicted } = addThreadId(activeThreadId)
        setThreadIds(ids)
        if (evicted) {
          try {
            await deleteThread(evicted)
          } catch {
            // swallow
          }
        }
        await refreshThreads(ids)
      } else {
        await refreshThreads(loadThreadIds())
      }
    } catch (err) {
      // Stopping mid-stream (button, unmount, new chat) is not an error; keep what arrived.
      if (err instanceof DOMException && err.name === 'AbortError') return
      // The API explains rate limits and validation failures; anything else is a connection issue.
      const message = err instanceof ApiError ? err.message : tc.connectionError
      replaceLastMessage(() => ({ role: 'assistant', content: message }))
    } finally {
      if (streamAbortRef.current === controller) streamAbortRef.current = null
      setPhase('idle')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="relative mx-auto flex h-[calc(100dvh-4rem)] max-w-7xl gap-4 px-3 py-4 sm:px-6 sm:py-6">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          aria-hidden
        />
      )}

      {/* Sidebar (drawer on mobile, static on md+) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85%] flex-col border-r border-border bg-surface transition-transform md:static md:inset-auto md:w-64 md:max-w-none md:shrink-0 md:translate-x-0 md:rounded-lg md:border ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border p-3 md:hidden">
          <span className="text-sm font-medium text-text-primary">{tc.threadsHeader}</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-secondary hover:text-text-primary"
            aria-label={tc.closeSidebarAria}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-b border-border p-3">
          <button
            onClick={startNewChat}
            className="flex w-full items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary transition-colors hover:border-text-muted"
          >
            <Plus className="h-4 w-4" />
            {tc.newChat}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {threads.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-text-muted">{tc.noThreadsYet}</p>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.thread_id}
                className={`group mb-1 flex items-start rounded-md transition-colors ${
                  thread.thread_id === activeThreadId ? 'bg-surface-2' : 'hover:bg-surface-2/60'
                }`}
              >
                <button
                  onClick={() => selectThread(thread.thread_id)}
                  aria-current={thread.thread_id === activeThreadId ? 'true' : undefined}
                  className="min-w-0 flex-1 px-3 py-2 text-left"
                >
                  <p
                    className={`truncate text-sm ${
                      thread.thread_id === activeThreadId
                        ? 'text-text-primary'
                        : 'text-text-secondary'
                    }`}
                  >
                    {thread.title || tc.untitled}
                  </p>
                  <p className="text-xs text-text-muted">
                    {relativeTime(thread.updated_at, t.common)}
                  </p>
                </button>
                <button
                  onClick={() => handleDeleteThread(thread.thread_id)}
                  className="m-1 rounded p-1.5 text-text-muted opacity-100 transition-opacity hover:text-red-400 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  aria-label={tc.deleteThreadAria}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-border p-3">
          <Link
            href={`/demos/state?thread=${activeThreadId}`}
            className="text-sm text-text-secondary underline-offset-4 hover:text-accent hover:underline"
          >
            {tc.inspectState}
          </Link>
        </div>
      </aside>

      {/* Main chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-3 flex items-start gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border text-text-secondary transition-colors hover:text-text-primary md:hidden"
            aria-label={tc.openThreadsAria}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <DemoBreadcrumb current={t.demos.chat.title} />
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-text-primary">
              {t.demos.chat.title}
            </h1>
            <p className="truncate text-xs text-text-muted">
              {info
                ? tc.subtitleProvider(info.provider === 'openai' ? 'OpenAI' : 'Ollama', info.model)
                : tc.subtitleStateful}
              <span className="mx-2" aria-hidden>
                |
              </span>
              {tc.thread} <span className="font-mono">{activeThreadId.slice(0, 8)}</span>
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-surface p-3 sm:p-4">
          {loadingThread ? (
            <p className="text-center text-sm text-text-muted">{tc.loadingThread}</p>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col justify-center py-6">
              <div className="mx-auto w-full max-w-xl">
                <p className="text-lg font-medium text-text-primary">{tc.emptyTitle}</p>
                <p className="mt-1 text-sm text-text-secondary">{tc.emptySubtitle}</p>
                <ul className="mt-5 space-y-2">
                  {tc.suggestions.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        onClick={() => send(suggestion)}
                        className="w-full rounded-md border border-border px-3 py-2.5 text-left text-sm text-text-secondary transition-colors hover:border-accent/60 hover:text-text-primary"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                isStreaming={phase === 'answering' && i === messages.length - 1}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {threadIds.length >= MAX_THREADS && !threadIds.includes(activeThreadId) && (
          <div className="mt-2 flex items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {tc.maxThreadsWarning(MAX_THREADS)}
          </div>
        )}

        {pendingCheckpointId && (
          <div className="mt-2 flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-accent">
            <GitBranch className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{tc.branchBanner}</span>
            <button
              onClick={cancelBranch}
              className="shrink-0 rounded px-2 py-0.5 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            >
              {tc.branchCancel}
            </button>
          </div>
        )}

        {branchError && !pendingCheckpointId && (
          <div className="mt-2 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {branchError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2 sm:gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tc.inputPlaceholder}
            aria-label={tc.inputPlaceholder}
            rows={1}
            maxLength={4000}
            className="max-h-40 min-h-[3rem] min-w-0 flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-3 text-base text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent/60 sm:px-4 sm:text-sm"
          />
          {phase === 'answering' ? (
            <button
              type="button"
              onClick={() => streamAbortRef.current?.abort()}
              className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-text-primary transition-colors hover:border-text-muted"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              {tc.stop}
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || busy}
              aria-label={tc.sendAria}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {phase === 'saving' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          )}
        </form>
        <p className="mt-1.5 hidden text-xs text-text-muted sm:block" aria-live="polite">
          {phase === 'saving' ? tc.savingMemory : tc.inputHint}
        </p>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { t } = useLanguage()
  return (
    <Suspense fallback={<div className="p-6 text-sm text-text-muted">{t.common.loading}</div>}>
      <ChatPageInner />
    </Suspense>
  )
}
