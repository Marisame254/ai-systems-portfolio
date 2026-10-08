'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
import { AlertCircle, Loader2, X, Wrench, Bot, Brain, Flag, ChevronDown, Square } from 'lucide-react'

const TYPE_COLOR: Record<string, string> = {
  start: '#58d1a0',
  end: '#58d1a0',
  llm: '#6cb6ff',
  tool: '#b392f0',
  memory: '#e3b341',
}
const FALLBACK_COLOR = '#a3aab8'
const EDGE_IDLE = '#4a5262'
const EDGE_TAKEN = '#58d1a0'
const NODE_WIDTH = 150

// The graph is small and fixed, so it gets a hand-placed layout instead of an auto-layout pass.
const POSITIONS: Record<string, { x: number; y: number }> = {
  __start__: { x: 0, y: 0 },
  load_memory: { x: 0, y: 90 },
  agent: { x: 0, y: 190 },
  tools: { x: 230, y: 190 },
  save_memory: { x: 0, y: 300 },
  __end__: { x: 0, y: 390 },
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

function buildEdges(graph: AgentGraph, taken: string[]): Edge[] {
  return graph.edges.map((e, i) => {
    const isTaken = taken.includes(edgeKey(e.source, e.target))
    return {
      id: `e${i}`,
      source: e.source,
      target: e.target,
      animated: isTaken,
      label: e.condition,
      style: {
        stroke: isTaken ? EDGE_TAKEN : EDGE_IDLE,
        strokeWidth: isTaken ? 2 : 1.5,
        strokeDasharray: e.conditional && !isTaken ? '5 4' : undefined,
      },
      labelStyle: { fontSize: 10, fontFamily: 'var(--font-plex-mono), monospace', fill: '#a3aab8' },
      labelBgStyle: { fill: '#0c0e12', fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
    }
  })
}

function buildNodes(graph: AgentGraph): Node[] {
  return graph.nodes.map((n, i) => ({
    id: n.id,
    position: POSITIONS[n.id] ?? { x: 230, y: 60 + i * 70 },
    data: { label: n.label },
    style: nodeStyle(TYPE_COLOR[n.type] ?? FALLBACK_COLOR, false, undefined, false),
  }))
}

function NodeIcon({ type }: { type: string }) {
  if (type === 'tool') return <Wrench className="h-4 w-4 text-node-tool" />
  if (type === 'llm') return <Bot className="h-4 w-4 text-node-llm" />
  if (type === 'memory') return <Brain className="h-4 w-4 text-node-memory" />
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
                    {tool.description || ta.panel.noDescription}
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

        {(node.type === 'start' || node.type === 'end') && (
          <p className="text-sm leading-relaxed text-text-secondary">
            {meta.description ?? ta.panel.builtIn}
          </p>
        )}

        {node.type === 'memory' && (
          <>
            <PanelField label={ta.panel.role}>
              {node.id === 'load_memory' ? ta.panel.memoryLoad : ta.panel.memorySave}
            </PanelField>
            <PanelField label={ta.panel.behavior}>
              <span className="leading-relaxed text-text-secondary">
                {meta.description ?? ta.panel.builtIn}
              </span>
            </PanelField>
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
        setNodes(buildNodes(g))
        setEdges(buildEdges(g, []))
      })
      .catch((e: Error) => {
        if (cancelled) return
        setError(e.message || 'Unknown error')
      })
    return () => {
      cancelled = true
    }
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
        const color = TYPE_COLOR[original?.type ?? ''] ?? FALLBACK_COLOR
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
    setSelectedId((prev) => (prev === node.id ? null : node.id))
  }

  async function handleRun(e: React.FormEvent) {
    e.preventDefault()
    const message = runInput.trim()
    if (!message || trace?.running) return

    const threadId = newThreadId()
    const controller = new AbortController()
    abortRef.current = controller
    // Last node that finished; the edge into the next node starts there.
    let previous = '__start__'

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
          const from = previous
          setTrace(
            (tr) =>
              tr && {
                ...tr,
                nodes: { ...tr.nodes, [event.name]: 'active' },
                takenEdges: [...tr.takenEdges, edgeKey(from, event.name)],
                steps: [
                  ...tr.steps,
                  { name: event.name, startedAt: performance.now(), ms: null, tools: [] },
                ],
              }
          )
        } else if (event.type === 'node' && event.status === 'end') {
          previous = event.name
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
      const from = previous
      setTrace(
        (tr) =>
          tr &&
          (tr.error
            ? tr
            : {
                ...tr,
                nodes: { ...tr.nodes, __end__: 'done' },
                takenEdges: [...tr.takenEdges, edgeKey(from, '__end__')],
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

      <div className="flex flex-col overflow-hidden rounded-lg border border-border md:h-[540px] md:flex-row">
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
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.2 }}
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
                  <span className="font-mono text-text-primary">{step.name}</span>
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
