const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ChatInfo {
  provider: 'ollama' | 'openai'
  model: string
  environment: 'dev' | 'prod'
}

/** Thrown for any non-2xx response; `message` is the API's `detail` when it sent one. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function ensureOk(res: Response): Promise<Response> {
  if (res.ok) return res
  let message = `API error: ${res.status}`
  try {
    const data = await res.json()
    if (typeof data?.detail === 'string') message = data.detail
    // FastAPI validation errors: detail is a list of { msg, loc }.
    else if (Array.isArray(data?.detail) && typeof data.detail[0]?.msg === 'string')
      message = data.detail[0].msg
  } catch {
    /* body was not JSON */
  }
  throw new ApiError(message, res.status)
}

export async function getChatInfo(): Promise<ChatInfo> {
  const res = await ensureOk(await fetch(`${API_BASE}/api/chat/info`))
  return res.json()
}

export type ChatStreamEvent =
  | { type: 'token'; text: string }
  | { type: 'tool_call'; name: string; args: unknown }
  | { type: 'tool_result'; name: string; result: string }
  // `name` is the node's id in the graph from getAgentGraph (subgraph nodes are prefixed).
  | { type: 'node'; name: string; status: 'start' | 'end' }
  | { type: 'error'; message: string }

/** Reads a `data: {json}\n\n` event stream until `[DONE]` or the body ends. */
async function* readSSE<T>(res: Response): AsyncGenerator<T> {
  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let idx
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        if (!frame.startsWith('data: ')) continue
        const data = frame.slice(6)
        if (data === '[DONE]') return
        try {
          yield JSON.parse(data) as T
        } catch {
          // ignore malformed frames
        }
      }
    }
  } finally {
    // Releases the stream when the consumer breaks early (unmount, new send, abort).
    reader.cancel().catch(() => {})
  }
}

export async function* streamChat(
  message: string,
  threadId: string,
  userId?: string,
  opts?: { checkpointId?: string; signal?: AbortSignal }
): AsyncGenerator<ChatStreamEvent> {
  const body: Record<string, unknown> = {
    message,
    thread_id: threadId,
    user_id: userId,
  }
  if (opts?.checkpointId) body.checkpoint_id = opts.checkpointId

  const res = await ensureOk(
    await fetch(`${API_BASE}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: opts?.signal,
    }),
  )
  yield* readSSE<ChatStreamEvent>(res)
}

// === RAG ===

export interface RAGInfo {
  provider: 'ollama' | 'openai'
  embedding_model: string
  dim: number
  max_docs_per_user: number
  max_upload_bytes: number
  supported_types: string[]
}

export interface DocumentInfo {
  id: string
  filename: string
  content_type: string
  byte_size: number
  chunks_count: number
  created_at: string
}

export interface DocumentListResponse {
  documents: DocumentInfo[]
  count: number
  max: number
}

export interface RAGSource {
  content: string
  score: number
  filename: string
  page: number | null
  chunk_index: number
  document_id: string
}

export interface RAGQueryResponse {
  answer: string
  sources: RAGSource[]
  model: string
}

export async function getRAGInfo(): Promise<RAGInfo> {
  const res = await ensureOk(await fetch(`${API_BASE}/api/rag/info`))
  return res.json()
}

export async function listDocuments(userId: string): Promise<DocumentListResponse> {
  const res = await ensureOk(
    await fetch(`${API_BASE}/api/rag/documents?user_id=${encodeURIComponent(userId)}`),
  )
  return res.json()
}

export async function uploadDocument(file: File, userId: string): Promise<DocumentInfo> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('user_id', userId)
  const res = await ensureOk(
    await fetch(`${API_BASE}/api/rag/upload`, {
      method: 'POST',
      body: formData,
    }),
  )
  return res.json()
}

export async function deleteDocument(userId: string, docId: string): Promise<void> {
  await ensureOk(
    await fetch(
      `${API_BASE}/api/rag/documents/${encodeURIComponent(docId)}?user_id=${encodeURIComponent(userId)}`,
      { method: 'DELETE' },
    ),
  )
}

export type RAGStreamEvent =
  // Always first. An empty list means nothing was relevant enough; no tokens follow.
  | { type: 'sources'; sources: RAGSource[]; model: string }
  | { type: 'token'; text: string }
  | { type: 'error'; message: string }

export async function* streamRAGQuery(
  query: string,
  userId: string,
  opts?: { filename?: string; topK?: number; signal?: AbortSignal },
): AsyncGenerator<RAGStreamEvent> {
  const res = await ensureOk(
    await fetch(`${API_BASE}/api/rag/query/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        user_id: userId,
        filename: opts?.filename ?? null,
        top_k: opts?.topK ?? 4,
      }),
      signal: opts?.signal,
    }),
  )
  yield* readSSE<RAGStreamEvent>(res)
}

export interface AgentGraphToolInfo {
  name: string
  description: string
}

export interface AgentGraphNodeMeta {
  model?: string
  provider?: string
  system_prompt?: string
  tools?: AgentGraphToolInfo[]
  description?: string
}

export interface AgentGraphNode {
  id: string
  label: string
  type: 'start' | 'end' | 'tool' | 'llm' | 'memory' | 'guard' | 'rag' | string
  /** Name of the subgraph this node belongs to, when it is not a top-level node. */
  group?: string
  meta?: AgentGraphNodeMeta
}

export interface AgentGraphEdge {
  source: string
  target: string
  conditional?: boolean
  condition?: string
}

export interface AgentGraph {
  nodes: AgentGraphNode[]
  edges: AgentGraphEdge[]
}

export async function getAgentGraph(): Promise<AgentGraph> {
  const res = await fetch(`${API_BASE}/api/agents/graph`)
  await ensureOk(res)
  return res.json()
}

// === Threads & state inspection ===

export interface ThreadSummary {
  thread_id: string
  title: string | null
  created_at: string | null
  updated_at: string | null
}

export interface SerializedToolCall {
  name: string
  args: unknown
  id?: string
}

export interface SerializedMessage {
  type: 'human' | 'ai' | 'tool' | 'system' | string
  content: string
  tool_calls?: SerializedToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ThreadState {
  thread_id: string
  values: {
    messages: SerializedMessage[]
    /** Rolling summary of the turns no longer sent to the model verbatim. */
    summary?: string | null
    guardrail?: { verdict: 'allow' | 'block'; reason: string } | null
  }
  next: string[]
  checkpoint_id: string | null
  created_at: string | null
}

export interface ThreadHistory {
  thread_id: string
  checkpoints: Omit<ThreadState, 'thread_id'>[]
}

export async function listThreadsByIds(ids: string[]): Promise<ThreadSummary[]> {
  if (ids.length === 0) return []
  const res = await fetch(`${API_BASE}/api/agents/threads/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thread_ids: ids }),
  })
  await ensureOk(res)
  return res.json()
}

export async function deleteThread(threadId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/agents/threads/${threadId}`, { method: 'DELETE' })
  await ensureOk(res)
}

export async function getThreadState(threadId: string): Promise<ThreadState> {
  const res = await fetch(`${API_BASE}/api/agents/state/${threadId}`)
  await ensureOk(res)
  return res.json()
}

export async function getThreadHistory(threadId: string): Promise<ThreadHistory> {
  const res = await fetch(`${API_BASE}/api/agents/state/${threadId}/history`)
  await ensureOk(res)
  return res.json()
}

export async function getThreadStateAtCheckpoint(
  threadId: string,
  checkpointId: string,
): Promise<ThreadState> {
  const res = await fetch(
    `${API_BASE}/api/agents/state/${threadId}/checkpoint/${checkpointId}`,
  )
  await ensureOk(res)
  return res.json()
}

// === Long-term memory ===

export interface MemoryEntry {
  key: string
  text: string
  source: 'auto' | 'manual'
  created_at: string
}

export interface MemoryListResponse {
  user_id: string
  entries: MemoryEntry[]
}

export async function listMemories(userId: string): Promise<MemoryListResponse> {
  const res = await fetch(`${API_BASE}/api/memory/${encodeURIComponent(userId)}`)
  await ensureOk(res)
  return res.json()
}

export async function addMemory(userId: string, text: string): Promise<MemoryEntry> {
  const res = await fetch(`${API_BASE}/api/memory/${encodeURIComponent(userId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  await ensureOk(res)
  return res.json()
}

export async function deleteMemory(userId: string, key: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/memory/${encodeURIComponent(userId)}/${encodeURIComponent(key)}`,
    { method: 'DELETE' }
  )
  await ensureOk(res)
}

export async function clearMemories(userId: string): Promise<{ deleted: number }> {
  const res = await fetch(`${API_BASE}/api/memory/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
  await ensureOk(res)
  return res.json()
}
