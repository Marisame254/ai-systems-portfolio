'use client'

import { useState, useRef, useEffect } from 'react'
import { streamChat, getChatInfo, type ChatInfo } from '@/lib/api'
import { Send, Bot, User, Trash2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
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
      for await (const chunk of streamChat(input, history)) {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          }
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
              ? `Powered by ${info.provider === 'openai' ? 'OpenAI' : 'Ollama'} ${info.model} · streaming SSE`
              : 'streaming SSE'}
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
                Ask me about AI systems, LangGraph, or RAG
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
              {msg.content || (
                <span className="text-text-muted">...</span>
              )}
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
