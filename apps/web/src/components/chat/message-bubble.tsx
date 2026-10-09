'use client'

import { useState } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import {
  Bot,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Clock,
  FileSearch,
  Globe,
  User,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

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

const markdownComponents: Components = {
  p: (props) => <p className="mb-2 last:mb-0" {...props} />,
  ul: (props) => <ul className="mb-2 ml-5 list-disc space-y-1 last:mb-0" {...props} />,
  ol: (props) => <ol className="mb-2 ml-5 list-decimal space-y-1 last:mb-0" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: (props) => (
    <a
      className="text-accent underline underline-offset-2"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-semibold text-text-primary" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  h1: (props) => <h1 className="mb-2 mt-3 text-base font-semibold text-text-primary" {...props} />,
  h2: (props) => <h2 className="mb-2 mt-3 text-sm font-semibold text-text-primary" {...props} />,
  h3: (props) => <h3 className="mb-1 mt-2 text-sm font-semibold text-text-secondary" {...props} />,
  // Inline code by default; the `pre` wrapper below resets these styles for fenced blocks.
  code: ({ className, ...props }) => (
    <code
      className={`rounded bg-background px-1.5 py-0.5 font-mono text-[0.85em] text-text-primary ${className ?? ''}`}
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="my-2 overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-xs"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="my-2 border-l-2 border-border pl-3 text-text-secondary"
      {...props}
    />
  ),
}

export function MarkdownContent({
  text,
  components,
}: {
  text: string
  components?: Components
}) {
  return (
    <ReactMarkdown components={components ? { ...markdownComponents, ...components } : markdownComponents}>
      {text}
    </ReactMarkdown>
  )
}

const TOOL_ICONS: Record<string, LucideIcon> = {
  search_user_documents: FileSearch,
  search_portfolio: Briefcase,
  tavily_search: Globe,
  get_current_datetime: Clock,
}

function toolArgsPreview(args: unknown): string {
  if (typeof args !== 'object' || args === null) return args == null ? '' : String(args)
  const record = args as Record<string, unknown>
  if (typeof record.query === 'string') return record.query
  return Object.keys(record).length ? JSON.stringify(record) : ''
}

function ToolCallChip({ call }: { call: ToolCall }) {
  const [open, setOpen] = useState(false)
  const Icon = TOOL_ICONS[call.name] ?? Wrench
  const preview = toolArgsPreview(call.args)

  return (
    <div className="mb-2 rounded-md border border-node-tool/30 bg-node-tool/5 text-xs">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-node-tool/10"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-text-muted" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-text-muted" />
        )}
        <Icon className="h-3.5 w-3.5 shrink-0 text-node-tool" />
        <span className="shrink-0 font-mono font-medium text-node-tool">{call.name}</span>
        {preview && <span className="truncate text-text-secondary">{preview}</span>}
        {!call.result && <span className="ml-auto animate-pulse text-text-muted">…</span>}
      </button>
      {open && call.result && (
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap border-t border-node-tool/20 px-3 py-2 font-mono text-xs leading-relaxed text-text-secondary">
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
  const isUser = msg.role === 'user'
  return (
    <div className={`mb-4 flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
          isUser ? 'bg-surface-2 text-text-secondary' : 'bg-accent/10 text-accent'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`min-w-0 max-w-[88%] rounded-lg px-3 py-2.5 text-sm leading-relaxed text-text-primary sm:max-w-[80%] sm:px-4 sm:py-3 ${
          isUser ? 'whitespace-pre-wrap bg-accent/10' : 'bg-surface-2'
        }`}
      >
        {msg.toolCalls?.map((call, j) => <ToolCallChip key={j} call={call} />)}
        {msg.content ? (
          isUser ? (
            msg.content
          ) : (
            <MarkdownContent text={msg.content} />
          )
        ) : !msg.toolCalls?.length ? (
          <span className="text-text-muted">…</span>
        ) : null}
        {isStreaming && !isUser && (
          <span className="ml-0.5 animate-cursor-blink text-accent">▍</span>
        )}
      </div>
    </div>
  )
}
