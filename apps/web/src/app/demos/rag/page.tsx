'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { Components } from 'react-markdown'
import { Upload, FileText, Loader2, Trash2, AlertCircle, Square } from 'lucide-react'
import {
  ApiError,
  deleteDocument,
  getRAGInfo,
  listDocuments,
  streamRAGQuery,
  uploadDocument,
  type DocumentInfo,
  type RAGInfo,
  type RAGSource,
} from '@/lib/api'
import { getUserId } from '@/lib/user'
import { demoById } from '@/lib/demos'
import { useLanguage } from '@/lib/i18n/provider'
import type { Dictionary } from '@/lib/i18n'
import { DemoShell } from '@/components/demos/demo-shell'
import { MarkdownContent } from '@/components/chat/message-bubble'

const CITATION_HREF = '#source-'

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function relativeTime(iso: string | null | undefined, t: Dictionary['common']): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return t.justNow
  if (m < 60) return t.minutesAgo(m)
  const h = Math.floor(m / 60)
  if (h < 24) return t.hoursAgo(h)
  return t.daysAgo(Math.floor(h / 24))
}

/** Turns the model's `[n]` markers into links so they render as citation buttons. */
function linkCitations(answer: string, sourceCount: number): string {
  return answer.replace(/\[(\d+)\](?!\()/g, (match, n) =>
    Number(n) >= 1 && Number(n) <= sourceCount ? `[${n}](${CITATION_HREF}${n})` : match
  )
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

interface Result {
  answer: string
  sources: RAGSource[] | null // null until the sources event arrives
  model: string
}

export default function RAGPage() {
  const { t } = useLanguage()
  const tr = t.ragDemo

  const [userId, setUserId] = useState<string>('')
  const [info, setInfo] = useState<RAGInfo | null>(null)
  const [docs, setDocs] = useState<DocumentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [filterFilename, setFilterFilename] = useState<string>('')
  const [isQuerying, setIsQuerying] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [activeSource, setActiveSource] = useState<number | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const sourceRefs = useRef<Record<number, HTMLLIElement | null>>({})

  const refresh = useCallback(
    async (uid: string) => {
      setLoading(true)
      try {
        const data = await listDocuments(uid)
        setDocs(data.documents)
        setDocsError(null)
      } catch {
        setDocs([])
        setDocsError(tr.listFailed)
      } finally {
        setLoading(false)
      }
    },
    [tr.listFailed]
  )

  useEffect(() => {
    const uid = getUserId()
    setUserId(uid)
    getRAGInfo()
      .then(setInfo)
      .catch(() => setInfo(null))
    refresh(uid)
  }, [refresh])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const maxDocs = info?.max_docs_per_user ?? 3
  const atLimit = docs.length >= maxDocs

  async function handleUpload(f: File) {
    if (!userId || atLimit || uploading) return
    setDocsError(null)
    setUploading(true)
    try {
      await uploadDocument(f, userId)
      await refresh(userId)
    } catch (e) {
      setDocsError(e instanceof ApiError ? e.message : tr.uploadFailed)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(doc: DocumentInfo) {
    if (!userId || deletingId) return
    setDeletingId(doc.id)
    setDocsError(null)
    try {
      await deleteDocument(userId, doc.id)
      const stillThere = docs.some((d) => d.id !== doc.id && d.filename === filterFilename)
      if (!stillThere) setFilterFilename('')
      await refresh(userId)
    } catch (e) {
      setDocsError(e instanceof ApiError ? e.message : tr.deleteFailed)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || isQuerying) return
    setQueryError(null)
    setIsQuerying(true)
    setResult({ answer: '', sources: null, model: '' })
    setActiveSource(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      for await (const event of streamRAGQuery(query, userId, {
        filename: filterFilename || undefined,
        signal: controller.signal,
      })) {
        if (event.type === 'sources') {
          setResult((r) => r && { ...r, sources: event.sources, model: event.model })
        } else if (event.type === 'token') {
          setResult((r) => r && { ...r, answer: r.answer + event.text })
        } else if (event.type === 'error') {
          setQueryError(tr.queryFailed)
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setResult(null)
      setQueryError(err instanceof ApiError ? err.message : tr.queryFailed)
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setIsQuerying(false)
    }
  }

  const focusSource = useCallback((n: number) => {
    setActiveSource(n)
    sourceRefs.current[n]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const citationComponents = useMemo<Components>(
    () => ({
      a: ({ href, children, ...props }) => {
        if (href?.startsWith(CITATION_HREF)) {
          const n = Number(href.slice(CITATION_HREF.length))
          return (
            <button
              type="button"
              onClick={() => focusSource(n)}
              aria-label={tr.citationAria(n)}
              className="mx-0.5 rounded border border-accent/40 bg-accent/10 px-1.5 align-baseline text-xs font-medium text-accent transition-colors hover:bg-accent/20"
            >
              {children}
            </button>
          )
        }
        return (
          <a
            href={href}
            className="text-accent underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
            {...props}
          >
            {children}
          </a>
        )
      },
    }),
    [focusSource, tr]
  )

  const sources = result?.sources ?? []
  const noRelevant = result !== null && result.sources !== null && sources.length === 0

  return (
    <DemoShell
      title={tr.title}
      stack={demoById('rag').stack}
      description={
        <>
          {tr.descBefore} {maxDocs} {tr.descMiddle}{' '}
          <Link href="/demos/chat" className="text-accent underline-offset-4 hover:underline">
            {tr.chatAgent}
          </Link>{' '}
          {tr.descAfter} <code className="font-mono text-text-primary">search_user_documents</code>
          {tr.descToolSuffix === '.' ? '.' : ` ${tr.descToolSuffix}`}
        </>
      }
    >
      {/* Documents */}
      <section className="rounded-lg border border-border bg-surface p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-text-primary">
            {tr.yourDocuments}{' '}
            <span className="font-normal text-text-muted">
              {docs.length}/{maxDocs}
            </span>
          </h2>
          {info && (
            <p className="text-xs text-text-muted">
              <span className="font-mono">{info.embedding_model}</span>, {info.dim}d
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={atLimit || uploading}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (atLimit || uploading) return
            const f = e.dataTransfer.files[0]
            if (f) handleUpload(f)
          }}
          className="flex min-h-[112px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-4 text-center transition-colors enabled:hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-60 sm:p-6"
        >
          {uploading ? (
            <>
              <Loader2 className="mb-2 h-5 w-5 animate-spin text-accent" />
              <span className="text-sm text-text-secondary">{tr.embedding}</span>
            </>
          ) : (
            <>
              <Upload className="mb-2 h-5 w-5 text-text-muted" />
              <span className="text-sm text-text-secondary">
                {atLimit ? tr.limitDelete : tr.uploadDrop}
              </span>
              {info && !atLimit && (
                <span className="mt-1 text-xs text-text-muted">
                  {tr.accepted} {info.supported_types.join(', ')} (max{' '}
                  {formatBytes(info.max_upload_bytes)})
                </span>
              )}
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md,.markdown"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleUpload(f)
          }}
        />

        {docsError && (
          <div className="mt-3">
            <ErrorNote>{docsError}</ErrorNote>
          </div>
        )}

        <ul className="mt-4 space-y-2">
          {loading ? (
            <li className="py-3 text-center text-sm text-text-muted">{t.common.loading}</li>
          ) : docs.length === 0 ? (
            <li className="py-3 text-center text-sm text-text-muted">{tr.noDocs}</li>
          ) : (
            docs.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-text-muted" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text-primary">{d.filename}</p>
                    <p className="text-xs text-text-muted">
                      {tr.chunks(d.chunks_count)}, {formatBytes(d.byte_size)},{' '}
                      {relativeTime(d.created_at, t.common)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(d)}
                  disabled={deletingId === d.id}
                  aria-label={`${tr.deleteAria} ${d.filename}`}
                  className="shrink-0 rounded p-2 text-text-muted transition-colors hover:bg-surface hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === d.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Question */}
      <section className="mt-6 rounded-lg border border-border bg-surface p-4 sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-text-primary">{tr.ask}</h2>
        <form onSubmit={handleQuery} className="flex flex-col gap-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder={tr.queryPlaceholder}
            aria-label={tr.ask}
            rows={3}
            maxLength={1000}
            disabled={docs.length === 0}
            className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-3 text-base text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent/60 disabled:opacity-50 sm:px-4 sm:text-sm"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              {tr.filter}
              <select
                value={filterFilename}
                onChange={(e) => setFilterFilename(e.target.value)}
                disabled={docs.length === 0}
                className="min-w-0 max-w-[14rem] rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent/60 disabled:opacity-50"
              >
                <option value="">{tr.allDocuments}</option>
                {docs.map((d) => (
                  <option key={d.id} value={d.filename}>
                    {d.filename}
                  </option>
                ))}
              </select>
            </label>
            {isQuerying ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="flex items-center justify-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-text-muted"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                {tr.stop}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!query.trim() || docs.length === 0}
                className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {tr.queryButton}
              </button>
            )}
          </div>
          {!loading && docs.length === 0 && (
            <p className="text-sm text-text-muted">{tr.uploadFirst}</p>
          )}
        </form>
      </section>

      {queryError && (
        <div className="mt-4">
          <ErrorNote>{queryError}</ErrorNote>
        </div>
      )}

      {/* Answer */}
      {result && (
        <div className="mt-6 space-y-4" aria-live="polite">
          <section className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <h2 className="mb-3 text-base font-semibold text-text-primary">{tr.answer}</h2>
            {noRelevant ? (
              <p className="text-sm leading-relaxed text-text-secondary">{tr.noRelevant}</p>
            ) : result.answer ? (
              <div className="text-sm leading-relaxed text-text-primary">
                <MarkdownContent
                  text={linkCitations(result.answer, sources.length)}
                  components={citationComponents}
                />
                {isQuerying && <span className="animate-cursor-blink text-accent">▍</span>}
              </div>
            ) : (
              isQuerying && (
                <p className="flex items-center gap-2 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tr.querying}
                </p>
              )
            )}
            {result.model && !noRelevant && !isQuerying && (
              <p className="mt-4 text-xs text-text-muted">
                {tr.modelLabel} <span className="font-mono">{result.model}</span>
              </p>
            )}
          </section>

          {sources.length > 0 && (
            <section className="rounded-lg border border-border bg-surface p-4 sm:p-6">
              <h2 className="text-base font-semibold text-text-primary">{tr.retrievedSources}</h2>
              <p className="mb-4 mt-1 text-xs text-text-muted">{tr.sourcesHint}</p>
              <ol className="space-y-3">
                {sources.map((src, i) => {
                  const n = i + 1
                  const pct = Math.round(src.score * 100)
                  return (
                    <li
                      key={`${src.document_id}-${src.chunk_index}`}
                      ref={(el) => {
                        sourceRefs.current[n] = el
                      }}
                      className={`rounded-md border bg-surface-2 p-3 transition-colors sm:p-4 ${
                        activeSource === n ? 'border-accent' : 'border-border'
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="rounded border border-accent/40 bg-accent/10 px-1.5 font-medium text-accent">
                          {n}
                        </span>
                        <span className="min-w-0 truncate text-text-secondary">{src.filename}</span>
                        <span className="text-text-muted">
                          {src.page !== null
                            ? `${tr.pageLabel} ${src.page}`
                            : `${tr.chunkLabel} ${src.chunk_index}`}
                        </span>
                        <span className="ml-auto flex items-center gap-2 text-text-muted">
                          <span
                            className="h-1.5 w-16 overflow-hidden rounded-full bg-border"
                            aria-hidden
                          >
                            <span
                              className="block h-full rounded-full bg-accent"
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          {pct}% {tr.similarity}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                        {src.content}
                      </p>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}
        </div>
      )}
    </DemoShell>
  )
}
