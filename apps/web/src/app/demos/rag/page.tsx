'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Upload,
  Search,
  FileText,
  Loader2,
  Trash2,
  AlertCircle,
  Database,
} from 'lucide-react'
import {
  deleteDocument,
  getRAGInfo,
  listDocuments,
  queryRAG,
  uploadDocument,
  type DocumentInfo,
  type RAGInfo,
  type RAGQueryResponse,
} from '@/lib/api'
import { getUserId } from '@/lib/user'
import { useLanguage } from '@/lib/i18n/provider'

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function fileExt(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toUpperCase()
}

function relativeTime(iso: string | null | undefined): string {
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

export default function RAGPage() {
  const { t } = useLanguage()
  const tr = t.ragDemo

  const [userId, setUserId] = useState<string>('')
  const [info, setInfo] = useState<RAGInfo | null>(null)
  const [docs, setDocs] = useState<DocumentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [filterFilename, setFilterFilename] = useState<string>('')
  const [isQuerying, setIsQuerying] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [result, setResult] = useState<RAGQueryResponse | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async (uid: string) => {
    setLoading(true)
    try {
      const data = await listDocuments(uid)
      setDocs(data.documents)
    } catch {
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const uid = getUserId()
    setUserId(uid)
    getRAGInfo()
      .then(setInfo)
      .catch(() => setInfo(null))
    refresh(uid)
  }, [refresh])

  const atLimit = info ? docs.length >= info.max_docs_per_user : false

  async function handleUpload(f: File) {
    if (!userId || atLimit || uploading) return
    setUploadError(null)
    setUploading(true)
    try {
      await uploadDocument(f, userId)
      await refresh(userId)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : tr.uploadFailed)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(docId: string) {
    if (!userId || deletingId) return
    setDeletingId(docId)
    try {
      await deleteDocument(userId, docId)
      await refresh(userId)
      if (filterFilename) {
        const stillThere = docs.some((d) => d.id !== docId && d.filename === filterFilename)
        if (!stillThere) setFilterFilename('')
      }
    } catch {
      // swallow; could surface a toast later
    } finally {
      setDeletingId(null)
    }
  }

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || isQuerying) return
    setQueryError(null)
    setIsQuerying(true)
    setResult(null)
    try {
      const data = await queryRAG(query, userId, {
        filename: filterFilename || undefined,
      })
      setResult(data)
    } catch (e) {
      setQueryError(e instanceof Error ? e.message : tr.queryFailed)
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
        <p className="text-xs text-text-secondary sm:text-sm">
          {tr.descBefore} {info?.max_docs_per_user ?? 3} {tr.descMiddle}{' '}
          <Link href="/demos/chat" className="text-accent-cyan hover:underline">
            {tr.chatAgent}
          </Link>{' '}
          {tr.descAfter} <code className="font-mono text-accent-cyan">search_user_documents</code>{' '}
          {tr.descToolSuffix}
        </p>
        {info && (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-text-muted sm:text-xs">
            <span className="flex items-center gap-1.5">
              <Database className="h-3 w-3" /> {tr.pgvector}
            </span>
            <span>
              · {info.provider} {info.embedding_model} · {info.dim}d
            </span>
            <span>
              · {tr.accepted} {info.supported_types.join(', ')}
            </span>
          </p>
        )}
      </div>

      {/* Documents card */}
      <div className="mb-6 rounded-lg border border-border bg-surface p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-sm text-text-secondary">
            {tr.yourDocuments}{' '}
            <span className="text-text-muted">
              ({docs.length}/{info?.max_docs_per_user ?? 3})
            </span>
          </h2>
          {atLimit && (
            <span className="font-mono text-[11px] text-yellow-300">{tr.limitReached}</span>
          )}
        </div>

        {/* Upload zone */}
        <div
          onClick={() => !atLimit && !uploading && fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (atLimit || uploading) return
            const f = e.dataTransfer.files[0]
            if (f) handleUpload(f)
          }}
          className={`flex min-h-[120px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-all sm:p-6 ${
            atLimit
              ? 'cursor-not-allowed border-border opacity-50'
              : 'cursor-pointer border-border hover:border-accent-cyan/40'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="mb-2 h-6 w-6 animate-spin text-accent-cyan" />
              <p className="font-mono text-xs text-text-muted">{tr.embedding}</p>
            </>
          ) : (
            <>
              <Upload
                className={`mb-2 h-6 w-6 ${atLimit ? 'text-text-muted/30' : 'text-accent-cyan/50'}`}
              />
              <p className="text-center text-xs text-text-secondary sm:text-sm">
                {atLimit ? tr.limitDelete : tr.uploadDrop}
              </p>
            </>
          )}
        </div>
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

        {uploadError && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 font-mono text-xs text-red-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Doc list */}
        <div className="mt-4 space-y-2">
          {loading ? (
            <p className="py-3 text-center font-mono text-xs text-text-muted">{tr.loading}</p>
          ) : docs.length === 0 ? (
            <p className="py-3 text-center font-mono text-xs text-text-muted">{tr.noDocs}</p>
          ) : (
            docs.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-accent-cyan" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text-primary">{d.filename}</p>
                    <p className="flex flex-wrap gap-x-2 font-mono text-[10px] text-text-muted">
                      <span>{fileExt(d.filename) || 'FILE'}</span>
                      <span>· {d.chunks_count} chunks</span>
                      <span>· {formatBytes(d.byte_size)}</span>
                      <span>· {relativeTime(d.created_at)}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={deletingId === d.id}
                  aria-label={`${tr.deleteAria} ${d.filename}`}
                  className="shrink-0 rounded p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === d.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Query card */}
      <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
        <h2 className="mb-4 font-mono text-sm text-text-secondary">{tr.ask}</h2>
        <form onSubmit={handleQuery} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="font-mono text-xs text-text-muted">{tr.filter}</label>
            <select
              value={filterFilename}
              onChange={(e) => setFilterFilename(e.target.value)}
              disabled={docs.length === 0}
              className="min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-accent-cyan/50 disabled:opacity-50 sm:flex-none sm:max-w-xs"
            >
              <option value="">{tr.allDocuments}</option>
              {docs.map((d) => (
                <option key={d.id} value={d.filename}>
                  {d.filename}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr.queryPlaceholder}
            rows={4}
            disabled={docs.length === 0}
            className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-3 text-base text-text-primary placeholder-text-muted outline-none transition-all focus:border-accent-cyan/50 disabled:opacity-50 sm:px-4 sm:text-sm"
          />
          <button
            type="submit"
            disabled={!query.trim() || isQuerying || docs.length === 0}
            className="flex items-center justify-center gap-2 rounded-lg border border-accent-cyan/50 bg-accent-cyan/10 px-4 py-2.5 text-sm font-medium text-accent-cyan transition-all hover:bg-accent-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isQuerying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isQuerying ? tr.querying : tr.queryButton}
          </button>
          {docs.length === 0 && (
            <p className="font-mono text-[11px] text-text-muted">{tr.uploadFirst}</p>
          )}
        </form>
      </div>

      {/* Query error */}
      {queryError && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 font-mono text-xs text-red-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{queryError}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-accent-cyan">
              {tr.answer}
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
              {result.answer}
            </p>
            <p className="mt-3 font-mono text-xs text-text-muted">
              {tr.modelLabel} {result.model}
            </p>
          </div>

          {result.sources.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
              <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-accent-cyan">
                {tr.retrievedSources} ({result.sources.length})
              </h2>
              <div className="space-y-3">
                {result.sources.map((src, i) => (
                  <div
                    key={`${src.document_id}-${src.chunk_index}-${i}`}
                    className="rounded-md border border-border bg-surface-2 p-3 sm:p-4"
                  >
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-text-muted">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3" />
                        <span className="text-text-secondary">{src.filename}</span>
                        {src.page !== null && (
                          <span>
                            · {tr.pageLabel} {src.page}
                          </span>
                        )}
                        <span>
                          · {tr.chunkLabel} {src.chunk_index}
                        </span>
                      </span>
                      <span className="text-accent-cyan">
                        {tr.scoreLabel} {src.score.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-text-secondary">{src.content}</p>
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
