'use client'

import { useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { getAgentGraph, type AgentGraph } from '@/lib/api'
import { AlertCircle, Loader2 } from 'lucide-react'

const TYPE_COLOR: Record<string, string> = {
  start: '#00ff88',
  end: '#00ff88',
  llm: '#00d4ff',
  tool: '#a855f7',
}

const nodeStyle = (color: string) => ({
  background: '#111111',
  border: `1px solid ${color}`,
  color,
  fontFamily: 'monospace',
  fontSize: '12px',
  borderRadius: '6px',
  padding: '8px 16px',
})

function positionFor(node: AgentGraph['nodes'][number], llmIndex: number): { x: number; y: number } {
  switch (node.type) {
    case 'start':
      return { x: 300, y: 30 }
    case 'end':
      return { x: 300, y: 420 }
    case 'tool':
      return { x: 540, y: 220 }
    default:
      // llm / agent / anything else — center column, spaced horizontally if multiple
      return { x: 300 + llmIndex * 180, y: 220 }
  }
}

function mapToReactFlow(graph: AgentGraph): { nodes: Node[]; edges: Edge[] } {
  let llmIndex = 0
  const nodes: Node[] = graph.nodes.map((n) => {
    const color = TYPE_COLOR[n.type] ?? '#94a3b8'
    const pos = positionFor(n, n.type === 'llm' ? llmIndex++ : 0)
    return {
      id: n.id,
      position: pos,
      data: { label: n.label },
      style: nodeStyle(color),
    }
  })

  const edges: Edge[] = graph.edges.map((e, i) => {
    const isConditional = !!e.conditional
    const stroke = isConditional ? '#00d4ff' : '#2a2a2a'
    return {
      id: `e${i}`,
      source: e.source,
      target: e.target,
      animated: isConditional,
      label: e.condition,
      style: { stroke, strokeWidth: 1.5 },
      labelStyle: {
        fontSize: 10,
        fontFamily: 'monospace',
        fill: stroke,
      },
    }
  })

  return { nodes, edges }
}

export default function AgentsPage() {
  const [graph, setGraph] = useState<AgentGraph | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    let cancelled = false
    getAgentGraph()
      .then((g) => {
        if (cancelled) return
        const mapped = mapToReactFlow(g)
        setGraph(g)
        setNodes(mapped.nodes)
        setEdges(mapped.edges)
      })
      .catch((e: Error) => {
        if (cancelled) return
        setError(e.message || 'Unknown error')
      })
    return () => {
      cancelled = true
    }
  }, [setNodes, setEdges])

  const hasTools = graph?.nodes.some((n) => n.type === 'tool') ?? false

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-green">
          // agent_visualization
        </p>
        <h1 className="text-2xl font-bold text-text-primary">LangGraph Agent Graph</h1>
        <p className="text-sm text-text-secondary">
          Tool-calling agent · <span className="font-mono">agent ↔ tools</span> loop with conditional
          edge · live from <span className="font-mono">/api/agents/graph</span>
        </p>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 font-mono text-xs text-text-muted">
        <span>
          <span className="text-accent-green">■</span> start / end
        </span>
        <span>
          <span className="text-accent-cyan">■</span> agent (llm)
        </span>
        <span>
          <span className="text-accent-purple">■</span> tools
        </span>
        <span>
          <span className="text-accent-cyan">⇢</span> conditional edge
        </span>
      </div>

      <div className="h-[600px] overflow-hidden rounded-lg border border-border">
        {error ? (
          <div className="flex h-full items-center justify-center bg-[#0a0a0a]">
            <div className="flex max-w-md items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4 font-mono text-xs">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div>
                <p className="text-red-400">Could not load agent graph.</p>
                <p className="mt-1 text-text-muted">Is the backend running on /api/agents/graph?</p>
                <p className="mt-2 text-text-muted/60">{error}</p>
              </div>
            </div>
          </div>
        ) : !graph ? (
          <div className="flex h-full items-center justify-center bg-[#0a0a0a]">
            <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin text-accent-green" />
              loading graph...
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            style={{ background: '#0a0a0a' }}
          >
            <Background color="#1a1a1a" gap={24} />
            <Controls
              style={{
                background: '#111111',
                border: '1px solid #2a2a2a',
                color: '#94a3b8',
              }}
            />
            <MiniMap
              style={{ background: '#111111', border: '1px solid #2a2a2a' }}
              nodeColor="#2a2a2a"
            />
          </ReactFlow>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-4">
        <p className="font-mono text-xs leading-relaxed text-text-muted">
          <span className="text-accent-green">{'>'}</span> The{' '}
          <span className="text-accent-cyan">agent</span> node invokes the LLM with bound tools.
          LangGraph&apos;s <span className="text-accent-cyan">tools_condition</span> inspects the
          response: if it contains <span className="font-mono">tool_calls</span>, the graph routes
          to <span className="text-accent-purple">tools</span> (executes them, then loops back to{' '}
          <span className="text-accent-cyan">agent</span>); otherwise it terminates at{' '}
          <span className="text-accent-green">__end__</span>.
          {hasTools ? (
            <>
              {' '}Currently wired:{' '}
              <span className="font-mono text-accent-purple">tavily_search</span>.
            </>
          ) : (
            <>
              {' '}No tools wired right now — set <span className="font-mono">TAVILY_API_KEY</span>{' '}
              to enable web search.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
