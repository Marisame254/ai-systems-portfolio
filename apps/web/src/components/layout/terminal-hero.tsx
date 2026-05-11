'use client'

import { useEffect, useState } from 'react'

const lines = [
  { text: 'AI Systems Engineer', delay: 300 },
  { text: 'LangGraph · RAG · Multi-Agent · LLM', delay: 900 },
  { text: 'Building AI that thinks in graphs', delay: 1500 },
]

export function TerminalHero() {
  const [visibleLines, setVisibleLines] = useState<number[]>([])

  useEffect(() => {
    lines.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, i])
      }, line.delay)
    })
  }, [])

  return (
    <div className="w-full max-w-3xl">
      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-3 py-3 sm:px-4">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70 sm:h-3 sm:w-3" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70 sm:h-3 sm:w-3" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/70 sm:h-3 sm:w-3" />
          <span className="ml-2 truncate font-mono text-[10px] text-text-muted sm:text-xs">
            marisame@ai-systems ~ %
          </span>
        </div>
        <div className="p-4 font-mono text-xs sm:p-6 sm:text-sm">
          <div className="mb-4">
            <span className="text-accent-green">marisame</span>
            <span className="text-text-muted">@</span>
            <span className="text-accent-cyan">ai-systems</span>
            <span className="text-text-muted"> ~ % </span>
            <span className="text-text-primary">whoami</span>
          </div>

          <div className="mb-1 text-2xl font-bold text-text-primary sm:text-3xl md:text-4xl">
            <span className="text-gradient-green">Marisame</span>
          </div>

          {lines.map((line, i) => (
            <div
              key={i}
              className={`mt-2 text-text-secondary transition-all duration-500 ${
                visibleLines.includes(i) ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}
            >
              <span className="text-accent-green">{'→'} </span>
              {line.text}
            </div>
          ))}

          <div className="mt-4 flex items-center gap-1 text-text-muted">
            <span className="animate-cursor-blink text-accent-green">█</span>
          </div>
        </div>
      </div>
    </div>
  )
}
