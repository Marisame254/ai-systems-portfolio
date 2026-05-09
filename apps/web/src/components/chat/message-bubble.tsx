'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Bot, ChevronDown, ChevronRight, Search, User } from 'lucide-react'

export interface ToolCall {
  name: string
  args: unknown
  result?: string
}

export interface ChatMessageView {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
}

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
        <span className="truncate text-text-secondary">&quot;{query}&quot;</span>
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

export function MessageBubble({
  msg,
  isStreaming,
}: {
  msg: ChatMessageView
  isStreaming?: boolean
}) {
  return (
    <div className={`mb-4 flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
          msg.role === 'user'
            ? 'bg-accent-cyan/10 text-accent-cyan'
            : 'bg-accent-green/10 text-accent-green'
        }`}
      >
        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
          msg.role === 'user'
            ? 'bg-accent-cyan/10 text-text-primary'
            : 'bg-surface-2 text-text-primary'
        }`}
      >
        {msg.toolCalls?.map((call, j) => <ToolCallChip key={j} call={call} />)}
        {msg.content ? (
          msg.role === 'assistant' ? (
            <MarkdownContent text={msg.content} />
          ) : (
            msg.content
          )
        ) : !msg.toolCalls?.length ? (
          <span className="text-text-muted">...</span>
        ) : null}
        {isStreaming && msg.role === 'assistant' && (
          <span className="ml-0.5 animate-cursor-blink text-accent-green">█</span>
        )}
      </div>
    </div>
  )
}
