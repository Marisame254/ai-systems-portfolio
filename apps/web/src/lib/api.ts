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
  history: Array<{ role: string; content: string }> = []
): AsyncGenerator<ChatStreamEvent> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
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

export async function queryRAG(query: string, sessionId?: string) {
  const res = await fetch(`${API_BASE}/api/rag/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, session_id: sessionId }),
  })
  return res.json()
}

export async function uploadDocument(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/api/rag/upload`, {
    method: 'POST',
    body: formData,
  })
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
