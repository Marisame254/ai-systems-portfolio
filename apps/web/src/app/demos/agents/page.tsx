'use client'

import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const nodeStyle = (color: string) => ({
  background: '#111111',
  border: `1px solid ${color}`,
  color,
  fontFamily: 'monospace',
  fontSize: '12px',
  borderRadius: '6px',
  padding: '8px 16px',
})

const initialNodes: Node[] = [
  {
    id: 'start',
    position: { x: 300, y: 30 },
    data: { label: '__start__' },
    style: nodeStyle('#00ff88'),
  },
  {
    id: 'router',
    position: { x: 300, y: 160 },
    data: { label: 'router' },
    style: nodeStyle('#00d4ff'),
  },
  {
    id: 'retriever',
    position: { x: 80, y: 300 },
    data: { label: 'retriever' },
    style: nodeStyle('#00ff88'),
  },
  {
    id: 'llm',
    position: { x: 520, y: 300 },
    data: { label: 'llm_call' },
    style: nodeStyle('#00ff88'),
  },
  {
    id: 'synthesizer',
    position: { x: 300, y: 440 },
    data: { label: 'synthesizer' },
    style: nodeStyle('#a855f7'),
  },
  {
    id: 'end',
    position: { x: 300, y: 580 },
    data: { label: '__end__' },
    style: nodeStyle('#00ff88'),
  },
]

const edgeStyle = { stroke: '#2a2a2a', strokeWidth: 1.5 }
const labelStyle = { fontSize: 10, fontFamily: 'monospace', fill: '#94a3b8' }

const initialEdges: Edge[] = [
  { id: 'e1', source: 'start', target: 'router', style: edgeStyle },
  {
    id: 'e2',
    source: 'router',
    target: 'retriever',
    label: 'needs_retrieval',
    style: { stroke: '#00ff88', strokeWidth: 1.5 },
    labelStyle: { ...labelStyle, fill: '#00ff88' },
  },
  {
    id: 'e3',
    source: 'router',
    target: 'llm',
    label: 'direct_llm',
    style: { stroke: '#00d4ff', strokeWidth: 1.5 },
    labelStyle: { ...labelStyle, fill: '#00d4ff' },
  },
  { id: 'e4', source: 'retriever', target: 'synthesizer', style: edgeStyle },
  { id: 'e5', source: 'llm', target: 'synthesizer', style: edgeStyle },
  { id: 'e6', source: 'synthesizer', target: 'end', style: edgeStyle },
]

export default function AgentsPage() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-green">
          // agent_visualization
        </p>
        <h1 className="text-2xl font-bold text-text-primary">LangGraph Agent Graph</h1>
        <p className="text-sm text-text-secondary">
          RAG + LLM routing agent — interactive graph. Drag nodes, zoom, pan.
        </p>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 font-mono text-xs text-text-muted">
        <span>
          <span className="text-accent-green">■</span> node
        </span>
        <span>
          <span className="text-accent-cyan">■</span> conditional
        </span>
        <span>
          <span className="text-accent-purple">■</span> synthesizer
        </span>
        <span>
          <span className="text-accent-green">——</span> retrieval path
        </span>
        <span>
          <span className="text-accent-cyan">——</span> direct llm path
        </span>
      </div>

      <div className="h-[600px] overflow-hidden rounded-lg border border-border">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-4">
        <p className="font-mono text-xs text-text-muted">
          <span className="text-accent-green">{'>'}</span> This graph represents a LangGraph
          StateGraph with conditional routing. The{' '}
          <span className="text-accent-cyan">router</span> node decides whether the query needs
          document retrieval or can be answered directly by the LLM.
        </p>
      </div>
    </div>
  )
}
