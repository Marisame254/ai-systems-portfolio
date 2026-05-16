const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ChatInfo {
  provider: 'ollama' | 'openai'
  model: string
  environment: 'dev' | 'prod'
}

export async function getChatInfo(): Promise<ChatInfo> {
  const res = await fetch(`${API_BASE}/api/chat/info`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export type ChatStreamEvent =
  | { type: 'token'; text: string }
  | { type: 'tool_call'; name: string; args: unknown }
  | { type: 'tool_result'; name: string; result: string }

export async function* streamChat(
  message: string,
  threadId: string,
  userId?: string,
  opts?: { checkpointId?: string }
): AsyncGenerator<ChatStreamEvent> {
  const body: Record<string, unknown> = {
    message,
    thread_id: threadId,
    user_id: userId,
  }
  if (opts?.checkpointId) body.checkpoint_id = opts.checkpointId

  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`API error: ${res.status}`)
  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

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
        yield JSON.parse(data) as ChatStreamEvent
      } catch {
        // ignore malformed frames
      }
    }
  }
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

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data?.detail === 'string') return data.detail
  } catch {
    /* ignore */
  }
  return `API error: ${res.status}`
}

export async function getRAGInfo(): Promise<RAGInfo> {
  const res = await fetch(`${API_BASE}/api/rag/info`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function listDocuments(userId: string): Promise<DocumentListResponse> {
  const res = await fetch(`${API_BASE}/api/rag/documents?user_id=${encodeURIComponent(userId)}`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function uploadDocument(file: File, userId: string): Promise<DocumentInfo> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('user_id', userId)
  const res = await fetch(`${API_BASE}/api/rag/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteDocument(userId: string, docId: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/rag/documents/${encodeURIComponent(docId)}?user_id=${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  )
  if (!res.ok) throw new Error(await parseError(res))
}

export async function queryRAG(
  query: string,
  userId: string,
  opts?: { filename?: string; topK?: number },
): Promise<RAGQueryResponse> {
  const res = await fetch(`${API_BASE}/api/rag/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      user_id: userId,
      filename: opts?.filename ?? null,
      top_k: opts?.topK ?? 4,
    }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
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
  type: 'start' | 'end' | 'tool' | 'llm' | string
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
  if (!res.ok) throw new Error(`API error: ${res.status}`)
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
  values: { messages: SerializedMessage[] }
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
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function deleteThread(threadId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/agents/threads/${threadId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
}

export async function getThreadState(threadId: string): Promise<ThreadState> {
  const res = await fetch(`${API_BASE}/api/agents/state/${threadId}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function getThreadHistory(threadId: string): Promise<ThreadHistory> {
  const res = await fetch(`${API_BASE}/api/agents/state/${threadId}/history`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function getThreadStateAtCheckpoint(
  threadId: string,
  checkpointId: string,
): Promise<ThreadState> {
  const res = await fetch(
    `${API_BASE}/api/agents/state/${threadId}/checkpoint/${checkpointId}`,
  )
  if (!res.ok) throw new Error(`API error: ${res.status}`)
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
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function addMemory(userId: string, text: string): Promise<MemoryEntry> {
  const res = await fetch(`${API_BASE}/api/memory/${encodeURIComponent(userId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function deleteMemory(userId: string, key: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/memory/${encodeURIComponent(userId)}/${encodeURIComponent(key)}`,
    { method: 'DELETE' }
  )
  if (!res.ok) throw new Error(`API error: ${res.status}`)
}

export async function clearMemories(userId: string): Promise<{ deleted: number }> {
  const res = await fetch(`${API_BASE}/api/memory/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
