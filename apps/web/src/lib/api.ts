const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function* streamChat(
  message: string,
  history: Array<{ role: string; content: string }> = []
): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  })

  if (!res.ok) throw new Error(`API error: ${res.status}`)
  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data)
          if (parsed.text) yield parsed.text
        } catch {
          // partial chunk, skip
        }
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

export async function getAgentGraph() {
  const res = await fetch(`${API_BASE}/api/agents/graph`)
  return res.json()
}
