'use client'

import { useState, useRef } from 'react'
import { Upload, Search, FileText, Loader2 } from 'lucide-react'
import { queryRAG, uploadDocument } from '@/lib/api'
import { useLanguage } from '@/lib/i18n/provider'

interface Source {
  content: string
  score: number
}

interface RAGResult {
  answer: string
  sources: Source[]
  model: string
}

export default function RAGPage() {
  const { t } = useLanguage()
  const tr = t.ragDemo
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done'>('idle')
  const [query, setQuery] = useState('')
  const [isQuerying, setIsQuerying] = useState(false)
  const [result, setResult] = useState<RAGResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(f: File) {
    setFile(f)
    setUploadStatus('uploading')
    try {
      await uploadDocument(f)
      setUploadStatus('done')
    } catch {
      setUploadStatus('done') // Show as done even on error (demo mode)
    }
  }

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setIsQuerying(true)
    try {
      const data = await queryRAG(query)
      setResult(data)
    } catch {
      setResult({
        answer: tr.connectionError,
        sources: [],
        model: 'unknown',
      })
    } finally {
      setIsQuerying(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent-cyan sm:text-xs">
          {tr.label}
        </p>
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">{tr.title}</h1>
        <p className="text-xs text-text-secondary sm:text-sm">{tr.description}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload */}
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <h2 className="mb-4 font-mono text-sm text-text-secondary">{tr.uploadStep}</h2>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f) handleUpload(f)
            }}
            className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-all hover:border-accent-cyan/40 sm:p-8"
          >
            <Upload className="mb-3 h-8 w-8 text-accent-cyan/50" />
            <p className="text-center text-sm text-text-secondary">
              {file ? file.name : tr.uploadPlaceholder}
            </p>
            {uploadStatus === 'uploading' && (
              <Loader2 className="mt-2 h-4 w-4 animate-spin text-accent-cyan" />
            )}
            {uploadStatus === 'done' && (
              <span className="mt-2 font-mono text-xs text-accent-cyan">{tr.uploadIndexed}</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleUpload(f)
            }}
          />
        </div>

        {/* Query */}
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <h2 className="mb-4 font-mono text-sm text-text-secondary">{tr.queryStep}</h2>
          <form onSubmit={handleQuery} className="flex flex-col gap-3">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr.queryPlaceholder}
              rows={4}
              className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-3 text-base text-text-primary placeholder-text-muted outline-none transition-all focus:border-accent-cyan/50 sm:px-4 sm:text-sm"
            />
            <button
              type="submit"
              disabled={!query.trim() || isQuerying}
              className="flex items-center justify-center gap-2 rounded-lg border border-accent-cyan/50 bg-accent-cyan/10 px-4 py-2.5 text-sm font-medium text-accent-cyan transition-all hover:bg-accent-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isQuerying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isQuerying ? tr.querying : tr.queryButton}
            </button>
          </form>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-accent-cyan">
              {tr.answer}
            </h2>
            <p className="text-sm leading-relaxed text-text-primary">{result.answer}</p>
            <p className="mt-3 font-mono text-xs text-text-muted">{tr.model}: {result.model}</p>
          </div>

          {result.sources.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
              <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-accent-cyan">
                {tr.sources}
              </h2>
              <div className="space-y-3">
                {result.sources.map((src, i) => (
                  <div key={i} className="rounded-md border border-border bg-surface-2 p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
                        <FileText className="h-3 w-3" /> {tr.chunk} {i + 1}
                      </span>
                      <span className="font-mono text-xs text-accent-cyan">
                        {tr.score}: {src.score.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{src.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
