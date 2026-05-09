'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { streamChat, getChatInfo, type ChatInfo } from '@/lib/api'
import { Send, Bot, User, Trash2, Search, ChevronDown, ChevronRight } from 'lucide-react'

const markdownComponents = {
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-2 last:mb-0" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-2 ml-5 list-disc space-y-1 last:mb-0" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-2 ml-5 list-decimal space-y-1 last:mb-0" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => <li className="leading-relaxed" {...props} />,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-accent-cyan underline-offset-2 hover:underline"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-text-primary" {...props} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => <em className="italic" {...props} />,
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mb-2 mt-3 text-base font-semibold text-text-primary" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mb-2 mt-3 text-sm font-semibold text-text-primary" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mb-1 mt-2 text-sm font-semibold text-text-secondary" {...props} />
  ),
  code: ({
    inline,
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
    if (inline) {
      return (
        <code
          className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.85em] text-accent-green"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code className={`font-mono text-xs ${className ?? ''}`} {...props}>
        {children}
      </code>
    )
  },
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="my-2 overflow-x-auto rounded-md border border-border bg-[#0a0a0a] p-3 text-xs leading-relaxed"
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-2 border-l-2 border-accent-green/40 pl-3 italic text-text-secondary"
      {...props}
    />
  ),
}

function MarkdownContent({ text }: { text: string }) {
  return <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
}

interface ToolCall {
  name: string
  args: unknown
  result?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
}

function ToolCallChip({ call }: { call: ToolCall }) {
  const [open, setOpen] = useState(false)
  const query =
    typeof call.args === 'object' && call.args !== null && 'query' in call.args
      ? String((call.args as Record<string, unknown>).query)
      : JSON.stringify(call.args)

  return (
    <div className="mb-2 rounded-md border border-accent-cyan/30 bg-accent-cyan/5 font-mono text-xs">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-accent-cyan transition-colors hover:bg-accent-cyan/10"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Search className="h-3 w-3" />
        <span className="font-semibold">{call.name}</span>
        <span className="truncate text-text-secondary">"{query}"</span>
        {!call.result && <span className="ml-auto animate-pulse text-text-muted">...</span>}
      </button>
      {open && call.result && (
        <pre className="max-h-48 overflow-auto border-t border-accent-cyan/20 px-3 py-2 text-[11px] leading-relaxed text-text-secondary">
          {call.result}
        </pre>
      )}
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [info, setInfo] = useState<ChatInfo | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    getChatInfo()
      .then(setInfo)
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const userMessage: Message = { role: 'user', content: input }
    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: '' }])
    setInput('')
    setIsStreaming(true)

    try {
      for await (const event of streamChat(input, history)) {
        setMessages((prev) => {
          const updated = [...prev]
          const last = { ...updated[updated.length - 1] }

          if (event.type === 'token') {
            last.content = (last.content || '') + event.text
          } else if (event.type === 'tool_call') {
            last.toolCalls = [
              ...(last.toolCalls || []),
              { name: event.name, args: event.args },
            ]
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
    <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-4xl flex-col px-6 py-8">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent-green">
            // ai_chat_playground
          </p>
          <h1 className="text-2xl font-bold text-text-primary">AI Chat</h1>
          <p className="text-sm text-text-secondary">
            {info
              ? `LangGraph agent · ${info.provider === 'openai' ? 'OpenAI' : 'Ollama'} ${info.model} · Tavily web search`
              : 'LangGraph agent · streaming SSE'}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text-muted transition-all hover:border-red-500/30 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
            clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-surface p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <Bot className="mx-auto mb-3 h-10 w-10 text-accent-green/30" />
              <p className="font-mono text-sm text-text-muted">Start a conversation...</p>
              <p className="mt-1 font-mono text-xs text-text-muted/60">
                Try: "What's new in LangGraph this week?" to see the agent call Tavily
              </p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                msg.role === 'user'
                  ? 'bg-accent-cyan/10 text-accent-cyan'
                  : 'bg-accent-green/10 text-accent-green'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent-cyan/10 text-text-primary'
                  : 'bg-surface-2 text-text-primary'
              }`}
            >
              {msg.toolCalls?.map((call, j) => (
                <ToolCallChip key={j} call={call} />
              ))}
              {msg.content ? (
                msg.role === 'assistant' ? (
                  <MarkdownContent text={msg.content} />
                ) : (
                  msg.content
                )
              ) : !msg.toolCalls?.length ? (
                <span className="text-text-muted">...</span>
              ) : null}
              {isStreaming && i === messages.length - 1 && msg.role === 'assistant' && (
                <span className="ml-0.5 animate-cursor-blink text-accent-green">█</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about AI systems..."
          disabled={isStreaming}
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="flex items-center gap-2 rounded-lg bg-accent-green px-4 py-3 text-sm font-medium text-black transition-all hover:bg-accent-green/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
