'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  streamChat,
  getChatInfo,
  listThreadsByIds,
  deleteThread,
  getThreadState,
  type ChatInfo,
  type ThreadSummary,
  type SerializedMessage,
} from '@/lib/api'
import {
  loadThreadIds,
  addThreadId,
  removeThreadId,
  MAX_THREADS,
} from '@/lib/thread-store'
import { getUserId } from '@/lib/user'
import { MessageBubble, type ChatMessageView, type ToolCall } from '@/components/chat/message-bubble'
import { Send, Bot, Plus, Trash2, MessageSquare, Activity, AlertTriangle, Menu, X } from 'lucide-react'

function newThreadId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'th_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function hydrateMessages(serialized: SerializedMessage[]): ChatMessageView[] {
  // Pair AIMessage tool_calls with subsequent ToolMessages (by tool_call_id) into ChatMessageView.
  const result: ChatMessageView[] = []
  const toolResults = new Map<string, string>()
  for (const m of serialized) {
    if (m.type === 'tool' && m.tool_call_id) {
      toolResults.set(m.tool_call_id, m.content)
    }
  }
  for (const m of serialized) {
    if (m.type === 'human') {
      result.push({ role: 'user', content: m.content })
    } else if (m.type === 'ai') {
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
    // system / tool messages handled implicitly
  }
  return result
}

export default function ChatPage() {
  const [info, setInfo] = useState<ChatInfo | null>(null)
  const [threadIds, setThreadIds] = useState<string[]>([])
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessageView[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    try {
      const state = await getThreadState(threadId)
      setMessages(hydrateMessages(state.values.messages))
    } catch {
      setMessages([])
    } finally {
      setLoadingThread(false)
    }
  }, [])

  useEffect(() => {
    const ids = loadThreadIds()
    setThreadIds(ids)
    if (ids[0]) {
      selectThread(ids[0])
    } else {
      setActiveThreadId(newThreadId())
    }
    refreshThreads(ids)
  }, [refreshThreads, selectThread])

  const startNewChat = useCallback(() => {
    setActiveThreadId(newThreadId())
    setMessages([])
    setSidebarOpen(false)
  }, [])

  const handleDeleteThread = useCallback(
    async (threadId: string, e: React.MouseEvent) => {
      e.stopPropagation()
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const userMessage: ChatMessageView = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: '' }])
    const messageText = input
    setInput('')
    setIsStreaming(true)

    try {
      for await (const event of streamChat(messageText, activeThreadId, getUserId())) {
        setMessages((prev) => {
          const updated = [...prev]
          const last = { ...updated[updated.length - 1] }
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
          }
          updated[updated.length - 1] = last
          return updated
        })
      }
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
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Error: Could not connect to the API. Is the backend running?',
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="relative mx-auto flex h-[calc(100vh-5rem)] max-w-7xl gap-3 px-3 py-4 sm:px-4 sm:py-6">
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
          <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
            threads
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary hover:text-accent-green"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-b border-border p-3">
          <button
            onClick={startNewChat}
            className="flex w-full items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-text-primary transition-colors hover:border-accent-green/40 hover:text-accent-green"
          >
            <Plus className="h-3.5 w-3.5" />
            new chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {threads.length === 0 ? (
            <p className="px-2 py-4 text-center font-mono text-[11px] text-text-muted">
              no threads yet
            </p>
          ) : (
            threads.map((t) => (
              <button
                key={t.thread_id}
                onClick={() => selectThread(t.thread_id)}
                className={`group mb-1 flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors ${
                  t.thread_id === activeThreadId
                    ? 'bg-accent-green/10 text-text-primary'
                    : 'hover:bg-surface-2 text-text-secondary'
                }`}
              >
                <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs">{t.title || 'untitled'}</p>
                  <p className="font-mono text-[10px] text-text-muted">
                    {relativeTime(t.updated_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteThread(t.thread_id, e)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Delete thread"
                >
                  <Trash2 className="h-3 w-3 text-text-muted hover:text-red-400" />
                </button>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-border p-3">
          <Link
            href={`/demos/state?thread=${activeThreadId}`}
            className="flex items-center gap-2 font-mono text-[11px] text-text-muted transition-colors hover:text-accent-cyan"
          >
            <Activity className="h-3 w-3" />
            inspect state →
          </Link>
        </div>
      </aside>

      {/* Main chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-3 flex items-start gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-text-secondary transition-colors hover:border-accent-green/50 hover:text-accent-green md:hidden"
            aria-label="Open threads"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent-green sm:text-xs">
              // ai_chat_playground
            </p>
            <h1 className="text-lg font-bold text-text-primary sm:text-xl">AI Chat</h1>
            <p className="text-[11px] text-text-secondary sm:text-xs">
              {info
                ? `LangGraph · ${info.provider === 'openai' ? 'OpenAI' : 'Ollama'} ${info.model} · stateful`
                : 'LangGraph agent · stateful'}
            </p>
            <p className="mt-1 truncate font-mono text-[10px] text-text-muted">
              thread: {activeThreadId}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-surface p-3 sm:p-4">
          {loadingThread ? (
            <p className="text-center font-mono text-xs text-text-muted">loading thread…</p>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <Bot className="mx-auto mb-3 h-10 w-10 text-accent-green/30" />
                <p className="font-mono text-sm text-text-muted">Start a conversation...</p>
                <p className="mt-1 font-mono text-xs text-text-muted/60">
                  This conversation persists across reloads in Postgres.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                isStreaming={isStreaming && i === messages.length - 1}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {threadIds.length >= MAX_THREADS && !threadIds.includes(activeThreadId) && (
          <div className="mt-2 flex items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-1.5 font-mono text-[11px] text-yellow-300">
            <AlertTriangle className="h-3 w-3" />
            max {MAX_THREADS} threads — sending will evict oldest
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2 sm:gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about AI systems..."
            disabled={isStreaming}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-3 text-base text-text-primary placeholder-text-muted outline-none transition-all focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 disabled:opacity-50 sm:px-4 sm:text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            aria-label="Send"
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent-green px-4 py-3 text-sm font-medium text-black transition-all hover:bg-accent-green/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
