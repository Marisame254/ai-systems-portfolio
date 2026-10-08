import type { SerializedMessage } from '@/lib/api'
import type { ChatMessageView, ToolCall } from '@/components/chat/message-bubble'

/** Turns persisted LangGraph messages into bubbles, pairing each tool call with its result. */
export function hydrateMessages(serialized: SerializedMessage[]): ChatMessageView[] {
  const toolResults = new Map<string, string>()
  for (const m of serialized) {
    if (m.type === 'tool' && m.tool_call_id) toolResults.set(m.tool_call_id, m.content)
  }

  const result: ChatMessageView[] = []
  for (const m of serialized) {
    if (m.type === 'human') {
      result.push({ role: 'user', content: m.content })
    } else if (m.type === 'ai') {
      const calls: ToolCall[] = (m.tool_calls ?? []).map((tc) => ({
        name: tc.name,
        args: tc.args,
        result: tc.id ? toolResults.get(tc.id) : undefined,
      }))
      result.push({
        role: 'assistant',
        content: m.content,
        toolCalls: calls.length ? calls : undefined,
      })
    }
    // system and tool messages are folded into the bubbles above
  }
  return result
}
