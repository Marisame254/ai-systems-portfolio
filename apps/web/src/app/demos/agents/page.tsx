'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Link from 'next/link'
import {
  ApiError,
  deleteThread,
  getAgentGraph,
  streamChat,
  type AgentGraph,
  type AgentGraphNode,
} from '@/lib/api'
import { getUserId } from '@/lib/user'
import { demoById } from '@/lib/demos'
import { useLanguage } from '@/lib/i18n/provider'
import type { Dictionary } from '@/lib/i18n'
import { DemoShell } from '@/components/demos/demo-shell'
import { MarkdownContent } from '@/components/chat/message-bubble'
import {
  AlertCircle,
  Loader2,
  X,
  Wrench,
  Bot,
  Brain,
  Flag,
  ChevronDown,
  Square,
  ShieldCheck,
  FileSearch,
} from 'lucide-react'

const TYPE_COLOR: Record<string, string> = {
  start: '#58d1a0',
  end: '#58d1a0',
  llm: '#6cb6ff',
  tool: '#b392f0',
  memory: '#e3b341',
  guard: '#f47067',
  rag: '#39c5cf',
}
const FALLBACK_COLOR = '#a3aab8'
const EDGE_IDLE = '#4a5262'
const EDGE_TAKEN = '#58d1a0'
const NODE_WIDTH = 150

// The graph is small and fixed, so it gets a hand-placed layout instead of an auto-layout pass.
const POSITIONS: Record<string, { x: number; y: number }> = {
  __start__: { x: 0, y: 0 },
  guardrail: { x: 0, y: 85 },
  refuse: { x: -230, y: 85 },
  load_memory: { x: 0, y: 175 },
  agent: { x: 0, y: 270 },
  tools: { x: -230, y: 270 },
  'document_search:retrieve': { x: 250, y: 180 },
  'document_search:grade_documents': { x: 250, y: 270 },
  'document_search:return_documents': { x: 250, y: 360 },
  'document_search:rewrite_query': { x: 440, y: 225 },
  summarize: { x: -230, y: 400 },
  save_memory: { x: 0, y: 400 },
  __end__: { x: 0, y: 490 },
}

// Frames drawn behind the nodes of each subgraph.
const SUBGRAPH_BOXES: Record<string, { x: number; y: number; width: number; height: number }> = {
  document_search: { x: 228, y: 128, width: 384, height: 292 },
}

// Every node exposes the same anchors; edges pick one on each end so they do not overlap.
const ANCHORS = {
  t: { position: Position.Top, style: { left: '50%' } },
  b: { position: Position.Bottom, style: { left: '50%' } },
  l1: { position: Position.Left, style: { top: '30%' } },
  l2: { position: Position.Left, style: { top: '70%' } },
  r1: { position: Position.Right, style: { top: '30%' } },
  r2: { position: Position.Right, style: { top: '70%' } },
} as const
type Anchor = keyof typeof ANCHORS

// [anchor on the source, anchor on the target]. Edges not listed run bottom to top.
const EDGE_ANCHORS: Record<string, [Anchor, Anchor]> = {
  'guardrail->refuse': ['l1', 'r1'],
  'refuse->__end__': ['l1', 'l2'],
  'agent->tools': ['l1', 'r1'],
  'tools->agent': ['r2', 'l2'],
  'agent->document_search:retrieve': ['r1', 'l1'],
  'document_search:return_documents->agent': ['l1', 'r2'],
  'document_search:grade_documents->document_search:rewrite_query': ['r1', 'b'],
  'document_search:rewrite_query->document_search:retrieve': ['t', 'r1'],
  'summarize->__end__': ['b', 'l1'],
}

type RunState = 'idle' | 'active' | 'done'

interface TraceStep {
  name: string
  startedAt: number
  ms: number | null
  tools: string[]
}

interface Trace {
  running: boolean
  nodes: Record<string, RunState>
  takenEdges: string[]
  steps: TraceStep[]
  reply: string
  error: string | null
}

const edgeKey = (source: string, target: string) => `${source}->${target}`

function nodeStyle(color: string, selected: boolean, run: RunState | undefined, dimIdle: boolean) {
  const active = run === 'active'
  return {
    background: active ? `${color}26` : '#13161c',
    border: `${selected || active ? 2 : 1}px solid ${color}`,
    color,
    fontFamily: 'var(--font-plex-mono), monospace',
    fontSize: '12px',
    borderRadius: '6px',
    padding: '8px 12px',
    width: NODE_WIDTH,
    textAlign: 'center' as const,
    opacity: dimIdle && (run ?? 'idle') === 'idle' ? 0.45 : 1,
    boxShadow: selected ? `0 0 0 3px ${color}33` : 'none',
    cursor: 'pointer',
    transition: 'opacity 150ms, background 150ms',
  }
}

const HIDDEN_HANDLE = { opacity: 0, pointerEvents: 'none' as const }

function GraphNode({ data }: NodeProps) {
  return (
    <>
      {(Object.keys(ANCHORS) as Anchor[]).flatMap((anchor) =>
        (['source', 'target'] as const).map((type) => (
          <Handle
            key={`${type}-${anchor}`}
            id={`${type}-${anchor}`}
            type={type}
            position={ANCHORS[anchor].position}
            style={{ ...ANCHORS[anchor].style, ...HIDDEN_HANDLE }}
            isConnectable={false}
          />
        )),
      )}
      {data.label as string}
    </>
  )
}

function SubgraphFrame({ data }: NodeProps) {
  return <span className="font-mono text-xs text-text-muted">{data.label as string}</span>
}

const NODE_TYPES = { graphNode: GraphNode, subgraph: SubgraphFrame }

function buildEdges(graph: AgentGraph, taken: string[]): Edge[] {
  return graph.edges.map((e, i) => {
    const key = edgeKey(e.source, e.target)
    const isTaken = taken.includes(key)
    const [from, to] = EDGE_ANCHORS[key] ?? ['b', 't']
    const stroke = isTaken ? EDGE_TAKEN : EDGE_IDLE
    return {
      id: `e${i}`,
      type: 'smoothstep',
      source: e.source,
      target: e.target,
      sourceHandle: `source-${from}`,
      targetHandle: `target-${to}`,
      animated: isTaken,
      label: e.condition,
      zIndex: isTaken ? 1 : 0,
      markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
      style: {
        stroke,
        strokeWidth: isTaken ? 2 : 1.5,
        strokeDasharray: e.conditional && !isTaken ? '5 4' : undefined,
      },
      labelStyle: { fontSize: 10, fontFamily: 'var(--font-plex-mono), monospace', fill: '#a3aab8' },
      labelBgStyle: { fill: '#0c0e12', fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
    }
  })
}

function buildNodes(graph: AgentGraph, subgraphLabel: (name: string) => string): Node[] {
  const groups = new Set(graph.nodes.flatMap((n) => (n.group ? [n.group] : [])))
  const frames: Node[] = Array.from(groups).flatMap((group) => {
    const box = SUBGRAPH_BOXES[group]
    if (!box) return []
    return [
      {
        id: `subgraph:${group}`,
        type: 'subgraph',
        position: { x: box.x, y: box.y },
        data: { label: subgraphLabel(group) },
        draggable: false,
        selectable: false,
        zIndex: -1,
        style: {
          width: box.width,
          height: box.height,
          padding: '6px 10px',
          border: '1px dashed #3a4150',
          borderRadius: '8px',
          background: '#13161c66',
          pointerEvents: 'none' as const,
        },
      },
    ]
  })
  const nodes: Node[] = graph.nodes.map((n, i) => ({
    id: n.id,
    type: 'graphNode',
    position: POSITIONS[n.id] ?? { x: 660, y: i * 60 },
    data: { label: n.label },
    style: nodeStyle(TYPE_COLOR[n.type] ?? FALLBACK_COLOR, false, undefined, false),
  }))
  return [...frames, ...nodes]
}

function NodeIcon({ type }: { type: string }) {
  if (type === 'tool') return <Wrench className="h-4 w-4 text-node-tool" />
  if (type === 'llm') return <Bot className="h-4 w-4 text-node-llm" />
  if (type === 'memory') return <Brain className="h-4 w-4 text-node-memory" />
  if (type === 'guard') return <ShieldCheck className="h-4 w-4 text-node-guard" />
  if (type === 'rag') return <FileSearch className="h-4 w-4 text-node-rag" />
  if (type === 'start' || type === 'end') return <Flag className="h-4 w-4 text-accent" />
  return null
}

function PanelField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <div className="mt-1 text-sm text-text-primary">{children}</div>
    </div>
  )
}

function NodeDetailPanel({
  node,
  onClose,
  ta,
}: {
  node: AgentGraphNode
  onClose: () => void
  ta: Dictionary['agentsDemo']
}) {
  const [promptOpen, setPromptOpen] = useState(false)
  const meta = node.meta ?? {}
  const usesStore = node.id === 'load_memory' || node.id === 'save_memory'
  // Translated text for the nodes this page knows; the API's English text for any other.
  const translated = (ta.panel.nodes as Record<string, string>)[node.label]
  const description = translated
    ? translated.replace(/\{(\w+)\}/g, (match, key) => String(meta.params?.[key] ?? match))
    : (meta.description ?? ta.panel.builtIn)
  const toolSummaries = ta.panel.toolSummaries as Record<string, string>

  return (
    <div className="flex h-full w-full shrink-0 flex-col border-t border-border bg-surface md:w-80 md:border-l md:border-t-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <NodeIcon type={node.type} />
          <span className="font-mono text-sm text-text-primary">{node.label}</span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
          aria-label={ta.closeAria}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {node.type === 'llm' && (
          <>
            <PanelField label={ta.panel.provider}>{meta.provider ?? ta.panel.unknown}</PanelField>
            <PanelField label={ta.panel.model}>
              <span className="font-mono">{meta.model ?? ta.panel.unknown}</span>
            </PanelField>
            {meta.system_prompt && (
              <div>
                <button
                  onClick={() => setPromptOpen((v) => !v)}
                  aria-expanded={promptOpen}
                  className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${promptOpen ? '' : '-rotate-90'}`}
                  />
                  {ta.panel.systemPrompt}
                </button>
                {promptOpen && (
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded border border-border bg-background p-2 font-mono text-xs leading-relaxed text-text-secondary">
                    {meta.system_prompt}
                  </pre>
                )}
              </div>
            )}
            <p className="border-t border-border pt-4 text-sm leading-relaxed text-text-secondary">
              {ta.panel.llmDescription}
            </p>
          </>
        )}

        {node.type === 'tool' && (
          <>
            <p className="text-xs text-text-muted">{ta.panel.boundTools(meta.tools?.length ?? 0)}</p>
            {meta.tools && meta.tools.length > 0 ? (
              meta.tools.map((tool) => (
                <div key={tool.name} className="rounded-md border border-border bg-background p-3">
                  <p className="font-mono text-sm text-node-tool">{tool.name}</p>
                  <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-text-secondary">
                    {toolSummaries[tool.name] || tool.description || ta.panel.noDescription}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted">{ta.panel.noTools}</p>
            )}
            <p className="border-t border-border pt-4 text-sm leading-relaxed text-text-secondary">
              {ta.panel.toolDescription}
            </p>
          </>
        )}

        {node.type !== 'llm' && node.type !== 'tool' && (
          <>
            {node.group && (
              <PanelField label={ta.panel.partOf}>
                <span className="font-mono text-xs">{node.group}</span>
              </PanelField>
            )}
            <p className="text-sm leading-relaxed text-text-secondary">
              {description}
            </p>
            {usesStore && (
              <>
                <PanelField label={ta.panel.storage}>
                  <span className="font-mono text-xs">
                    AsyncPostgresStore, namespace=(&apos;memories&apos;, user_id)
                  </span>
                </PanelField>
                <p className="border-t border-border pt-4 text-sm leading-relaxed text-text-secondary">
                  {ta.panel.memoryDescription}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function formatMs(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`
}

function newThreadId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'th_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function AgentsPage() {
  const { t } = useLanguage()
  const ta = t.agentsDemo
  const [graph, setGraph] = useState<AgentGraph | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [runInput, setRunInput] = useState('')
  const [trace, setTrace] = useState<Trace | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    getAgentGraph()
      .then((g) => {
        if (cancelled) return
        setGraph(g)
        setNodes(buildNodes(g, ta.subgraphLabel))
        setEdges(buildEdges(g, []))
      })
      .catch((e: Error) => {
        if (cancelled) return
        setError(e.message || 'Unknown error')
      })
    return () => {
      cancelled = true
    }
    // Built once; the frame label is only read here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setNodes, setEdges])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  // Restyle on selection or trace changes without resetting positions the user may have dragged.
  useEffect(() => {
    if (!graph) return
    setNodes((current) =>
      current.map((n) => {
        const original = graph.nodes.find((g) => g.id === n.id)
        if (!original) return n
        const color = TYPE_COLOR[original.type] ?? FALLBACK_COLOR
        return {
          ...n,
          style: nodeStyle(color, n.id === selectedId, trace?.nodes[n.id], trace !== null),
        }
      })
    )
    setEdges(buildEdges(graph, trace?.takenEdges ?? []))
  }, [selectedId, graph, trace, setNodes, setEdges])

  const selectedNode = useMemo(
    () => graph?.nodes.find((n) => n.id === selectedId) ?? null,
    [graph, selectedId]
  )

  const onNodeClick: NodeMouseHandler = (_, node) => {
    if (node.type === 'subgraph') return
    setSelectedId((prev) => (prev === node.id ? null : node.id))
  }

  async function handleRun(e: React.FormEvent) {
    e.preventDefault()
    const message = runInput.trim()
    if (!message || trace?.running || !graph) return

    const threadId = newThreadId()
    const controller = new AbortController()
    abortRef.current = controller
    // Nodes can run in parallel, so "the previous node" is ambiguous. An edge counts as taken
    // when its source finished after the target last started.
    let tick = 0
    const endedAt: Record<string, number> = { __start__: 0 }
    const startedAt: Record<string, number> = {}
    const edgesInto = (target: string) => {
      const since = startedAt[target] ?? -1
      return graph.edges
        .filter((e) => e.target === target && (endedAt[e.source] ?? -1) > since)
        .map((e) => edgeKey(e.source, e.target))
    }

    setTrace({
      running: true,
      nodes: { __start__: 'done' },
      takenEdges: [],
      steps: [],
      reply: '',
      error: null,
    })

    try {
      for await (const event of streamChat(message, threadId, getUserId(), {
        signal: controller.signal,
      })) {
        if (event.type === 'node' && event.status === 'start') {
          const taken = edgesInto(event.name)
          startedAt[event.name] = ++tick
          setTrace(
            (tr) =>
              tr && {
                ...tr,
                nodes: { ...tr.nodes, [event.name]: 'active' },
                takenEdges: [...tr.takenEdges, ...taken],
                steps: [
                  ...tr.steps,
                  { name: event.name, startedAt: performance.now(), ms: null, tools: [] },
                ],
              }
          )
        } else if (event.type === 'node' && event.status === 'end') {
          endedAt[event.name] = ++tick
          setTrace((tr) => {
            if (!tr) return tr
            const steps = [...tr.steps]
            for (let i = steps.length - 1; i >= 0; i--) {
              if (steps[i].name === event.name && steps[i].ms === null) {
                steps[i] = { ...steps[i], ms: performance.now() - steps[i].startedAt }
                break
              }
            }
            return { ...tr, nodes: { ...tr.nodes, [event.name]: 'done' }, steps }
          })
        } else if (event.type === 'tool_call') {
          setTrace((tr) => {
            if (!tr || tr.steps.length === 0) return tr
            const steps = [...tr.steps]
            const last = steps[steps.length - 1]
            steps[steps.length - 1] = { ...last, tools: [...last.tools, event.name] }
            return { ...tr, steps }
          })
        } else if (event.type === 'token') {
          setTrace((tr) => tr && { ...tr, reply: tr.reply + event.text })
        } else if (event.type === 'error') {
          setTrace((tr) => tr && { ...tr, error: ta.run.failed })
        }
      }
      const taken = edgesInto('__end__')
      setTrace(
        (tr) =>
          tr &&
          (tr.error
            ? tr
            : {
                ...tr,
                nodes: { ...tr.nodes, __end__: 'done' },
                takenEdges: [...tr.takenEdges, ...taken],
              })
      )
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        const message = err instanceof ApiError ? err.message : ta.run.failed
        setTrace((tr) => tr && { ...tr, error: message })
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setTrace((tr) => tr && { ...tr, running: false })
      deleteThread(threadId).catch(() => {})
    }
  }

  const legend = [
    { color: 'bg-accent', label: ta.legend.startEnd },
    { color: 'bg-node-llm', label: ta.legend.llm },
    { color: 'bg-node-tool', label: ta.legend.tools },
    { color: 'bg-node-memory', label: ta.legend.memory },
    { color: 'bg-node-guard', label: ta.legend.guard },
    { color: 'bg-node-rag', label: ta.legend.rag },
  ]

  return (
    <DemoShell
      title={ta.title}
      description={ta.description}
      stack={demoById('agents').stack}
      width="wide"
    >
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-secondary">
        {legend.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} aria-hidden />
            {item.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="w-4 border-t border-dashed border-text-muted" aria-hidden />
          {ta.legend.conditional}
        </li>
      </ul>

      <div className="flex flex-col overflow-hidden rounded-lg border border-border md:h-[640px] md:flex-row">
        <div className="h-[400px] w-full shrink-0 bg-background md:h-auto md:w-auto md:flex-1 md:shrink">
          {error ? (
            <div className="flex h-full items-center justify-center p-4">
              <div
                role="alert"
                className="flex max-w-md items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <div>
                  <p className="text-red-400">{ta.errorTitle}</p>
                  <p className="mt-1 text-text-secondary">{ta.errorHint}</p>
                </div>
              </div>
            </div>
          ) : !graph ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {ta.loading}
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              nodesConnectable={false}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.08 }}
              minZoom={0.3}
              colorMode="dark"
              style={{ background: '#0c0e12' }}
            >
              <Background color="#1f242d" gap={24} />
              <Controls showInteractive={false} />
            </ReactFlow>
          )}
        </div>

        {selectedNode && (
          <NodeDetailPanel node={selectedNode} onClose={() => setSelectedId(null)} ta={ta} />
        )}
      </div>

      {/* Live run */}
      <section className="mt-6 grid gap-6 rounded-lg border border-border bg-surface p-4 sm:p-6 lg:grid-cols-2">
        <div>
          <h2 className="text-base font-semibold text-text-primary">{ta.run.title}</h2>
          <form onSubmit={handleRun} className="mt-3 flex gap-2">
            <input
              value={runInput}
              onChange={(e) => setRunInput(e.target.value)}
              placeholder={ta.run.placeholder}
              aria-label={ta.run.title}
              maxLength={4000}
              disabled={!graph}
              className="min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-base text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent/60 disabled:opacity-50 sm:text-sm"
            />
            {trace?.running ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="flex shrink-0 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-text-primary transition-colors hover:border-text-muted"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                {ta.run.stop}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!runInput.trim() || !graph}
                className="shrink-0 rounded-md bg-accent px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {ta.run.button}
              </button>
            )}
          </form>
          <p className="mt-2 text-xs text-text-muted">{ta.run.hint}</p>

          {trace?.reply && (
            <div className="mt-5">
              <h3 className="text-xs text-text-muted">{ta.run.answerLabel}</h3>
              <div className="mt-1 text-sm leading-relaxed text-text-primary">
                <MarkdownContent text={trace.reply} />
              </div>
            </div>
          )}
          {trace?.error && (
            <p role="alert" className="mt-4 text-sm text-red-400">
              {trace.error}
            </p>
          )}
        </div>

        <div aria-live="polite">
          <h2 className="text-base font-semibold text-text-primary">{ta.run.logTitle}</h2>
          {!trace || trace.steps.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">
              {trace?.running ? ta.loading : ta.run.logEmpty}
            </p>
          ) : (
            <ol className="mt-3 divide-y divide-border border-y border-border">
              {trace.steps.map((step, i) => (
                <li key={i} className="flex items-baseline gap-3 py-2 text-sm">
                  <span className="w-5 shrink-0 text-right text-xs tabular-nums text-text-muted">
                    {i + 1}
                  </span>
                  <span className="font-mono text-text-primary">{step.name.split(':').pop()}</span>
                  {step.tools.length > 0 && (
                    <span className="min-w-0 truncate font-mono text-xs text-node-tool">
                      {step.tools.join(', ')}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-text-muted">
                    {step.ms === null ? ta.run.running : formatMs(step.ms)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <Link
        href="/demos/state"
        className="mt-6 inline-block text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        {ta.inspectState}
      </Link>
    </DemoShell>
  )
}
