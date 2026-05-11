'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Link from 'next/link'
import { getAgentGraph, type AgentGraph, type AgentGraphNode } from '@/lib/api'
import {
  AlertCircle,
  Activity,
  Loader2,
  X,
  Hammer,
  Bot,
  Flag,
  FlagOff,
  ChevronDown,
} from 'lucide-react'

const TYPE_COLOR: Record<string, string> = {
  start: '#00ff88',
  end: '#00ff88',
  llm: '#00d4ff',
  tool: '#a855f7',
}

const nodeStyle = (color: string, selected: boolean) => ({
  background: '#111111',
  border: `${selected ? 2 : 1}px solid ${color}`,
  color,
  fontFamily: 'monospace',
  fontSize: '12px',
  borderRadius: '6px',
  padding: '8px 16px',
  boxShadow: selected ? `0 0 0 3px ${color}33` : 'none',
  cursor: 'pointer',
})

function positionFor(
  node: AgentGraph['nodes'][number],
  llmIndex: number
): { x: number; y: number } {
  switch (node.type) {
    case 'start':
      return { x: 300, y: 30 }
    case 'end':
      return { x: 300, y: 420 }
    case 'tool':
      return { x: 540, y: 220 }
    default:
      return { x: 300 + llmIndex * 180, y: 220 }
  }
}

function buildEdges(graph: AgentGraph): Edge[] {
  return graph.edges.map((e, i) => {
    const isConditional = !!e.conditional
    const stroke = isConditional ? '#00d4ff' : '#475569'
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
        fontWeight: 600,
        fill: '#cbd5e1',
      },
      labelBgStyle: { fill: '#0a0a0a', fillOpacity: 0.85 },
      labelBgPadding: [4, 2] as [number, number],
    }
  })
}

function buildNodes(graph: AgentGraph, selectedId: string | null): Node[] {
  let llmIndex = 0
  return graph.nodes.map((n) => {
    const color = TYPE_COLOR[n.type] ?? '#94a3b8'
    const pos = positionFor(n, n.type === 'llm' ? llmIndex++ : 0)
    return {
      id: n.id,
      position: pos,
      data: { label: n.label },
      style: nodeStyle(color, n.id === selectedId),
    }
  })
}

function NodeIcon({ type }: { type: string }) {
  if (type === 'tool') return <Hammer className="h-4 w-4 text-accent-purple" />
  if (type === 'llm') return <Bot className="h-4 w-4 text-accent-cyan" />
  if (type === 'start') return <Flag className="h-4 w-4 text-accent-green" />
  if (type === 'end') return <FlagOff className="h-4 w-4 text-accent-green" />
  return null
}

function NodeDetailPanel({
  node,
  onClose,
}: {
  node: AgentGraphNode
  onClose: () => void
}) {
  const [promptOpen, setPromptOpen] = useState(false)
  const meta = node.meta ?? {}

  return (
    <div className="flex h-full w-full shrink-0 flex-col border-t border-border bg-surface md:w-80 md:border-l md:border-t-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <NodeIcon type={node.type} />
          <span className="font-mono text-sm text-text-primary">{node.label}</span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-muted">
            {node.type}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 text-xs">
        {node.type === 'llm' && (
          <div className="space-y-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                provider
              </p>
              <p className="font-mono text-accent-cyan">{meta.provider ?? 'unknown'}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">model</p>
              <p className="font-mono text-text-primary">{meta.model ?? 'unknown'}</p>
            </div>
            {meta.system_prompt && (
              <div>
                <button
                  onClick={() => setPromptOpen((v) => !v)}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:text-text-primary"
                >
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${promptOpen ? '' : '-rotate-90'}`}
                  />
                  system prompt
                </button>
                {promptOpen && (
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded border border-border bg-[#0a0a0a] p-2 text-[11px] leading-relaxed text-text-secondary">
                    {meta.system_prompt}
                  </pre>
                )}
              </div>
            )}
            <p className="border-t border-border pt-3 leading-relaxed text-text-muted">
              Invokes the LLM with the bound tools. The response is appended to{' '}
              <span className="font-mono">state.messages</span>; if it contains{' '}
              <span className="font-mono">tool_calls</span>, the conditional edge routes to{' '}
              <span className="font-mono text-accent-purple">tools</span>.
            </p>
          </div>
        )}

        {node.type === 'tool' && (
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
              bound tools ({meta.tools?.length ?? 0})
            </p>
            {meta.tools && meta.tools.length > 0 ? (
              meta.tools.map((t) => (
                <div
                  key={t.name}
                  className="rounded-md border border-border bg-[#0a0a0a] p-3"
                >
                  <div className="flex items-center gap-2">
                    <Hammer className="h-3.5 w-3.5 text-accent-purple" />
                    <span className="font-mono text-sm text-accent-purple">{t.name}</span>
                  </div>
                  <p className="mt-2 leading-relaxed text-text-secondary">
                    {t.description || <span className="italic text-text-muted">no description</span>}
                  </p>
                </div>
              ))
            ) : (
              <p className="italic text-text-muted">
                No tools wired. Set <span className="font-mono">TAVILY_API_KEY</span> to enable web
                search.
              </p>
            )}
            <p className="border-t border-border pt-3 leading-relaxed text-text-muted">
              <span className="font-mono">ToolNode</span> executes whichever tool the LLM requested
              and appends the result to <span className="font-mono">state.messages</span>, then loops
              back to <span className="font-mono text-accent-cyan">agent</span>.
            </p>
          </div>
        )}

        {(node.type === 'start' || node.type === 'end') && (
          <p className="leading-relaxed text-text-secondary">
            {meta.description ?? 'Built-in LangGraph node.'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function AgentsPage() {
  const [graph, setGraph] = useState<AgentGraph | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    let cancelled = false
    getAgentGraph()
      .then((g) => {
        if (cancelled) return
        setGraph(g)
        setNodes(buildNodes(g, null))
        setEdges(buildEdges(g))
      })
      .catch((e: Error) => {
        if (cancelled) return
        setError(e.message || 'Unknown error')
      })
    return () => {
      cancelled = true
    }
  }, [setNodes, setEdges])

  // Recompute styles when selection changes (without resetting positions)
  useEffect(() => {
    if (!graph) return
    setNodes((current) =>
      current.map((n) => {
        const original = graph.nodes.find((g) => g.id === n.id)
        const color = TYPE_COLOR[original?.type ?? ''] ?? '#94a3b8'
        return { ...n, style: nodeStyle(color, n.id === selectedId) }
      })
    )
  }, [selectedId, graph, setNodes])

  const selectedNode = useMemo(
    () => graph?.nodes.find((n) => n.id === selectedId) ?? null,
    [graph, selectedId]
  )

  const onNodeClick: NodeMouseHandler = (_, node) => {
    setSelectedId((prev) => (prev === node.id ? null : node.id))
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 sm:mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent-green sm:text-xs">
          // agent_visualization
        </p>
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
          LangGraph Agent Graph
        </h1>
        <p className="text-xs text-text-secondary sm:text-sm">
          Tool-calling agent · <span className="font-mono">agent ↔ tools</span> loop with conditional
          edge · click any node for details
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

      <div className="flex flex-col overflow-hidden rounded-lg border border-border md:h-[600px] md:flex-row">
        <div className="h-[380px] w-full shrink-0 md:h-auto md:w-auto md:flex-1 md:shrink">
          {error ? (
            <div className="flex h-full items-center justify-center bg-[#0a0a0a]">
              <div className="flex max-w-md items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4 font-mono text-xs">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <div>
                  <p className="text-red-400">Could not load agent graph.</p>
                  <p className="mt-1 text-text-muted">
                    Is the backend running on /api/agents/graph?
                  </p>
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
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              minZoom={0.3}
              proOptions={{ hideAttribution: false }}
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
            </ReactFlow>
          )}
        </div>

        {selectedNode && (
          <NodeDetailPanel node={selectedNode} onClose={() => setSelectedId(null)} />
        )}
      </div>

      <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:gap-4">
        <p className="font-mono text-xs leading-relaxed text-text-muted">
          <span className="text-accent-green">{'>'}</span> Click any node to inspect it: see the
          model and system prompt for <span className="text-accent-cyan">agent</span>, the bound
          tools and their descriptions for <span className="text-accent-purple">tools</span>, or the
          role of <span className="text-accent-green">__start__</span> /{' '}
          <span className="text-accent-green">__end__</span> in the LangGraph runtime.
        </p>
        <Link
          href="/demos/state"
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-accent-cyan/30 bg-accent-cyan/5 px-3 py-1.5 font-mono text-xs text-accent-cyan transition-colors hover:bg-accent-cyan/10"
        >
          <Activity className="h-3 w-3" />
          inspect state →
        </Link>
      </div>
    </div>
  )
}
