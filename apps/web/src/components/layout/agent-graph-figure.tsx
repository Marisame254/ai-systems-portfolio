import type { CSSProperties } from 'react'

// Mirrors the graph built in apps/api/agents/chat_agent.py::build_chat_graph, with the
// document_search subgraph expanded. Same nodes and edges as /demos/agents, laid out in portrait.
const COLOR = {
  flow: '#58d1a0',
  memory: '#e3b341',
  llm: '#6cb6ff',
  tool: '#b392f0',
  guard: '#f47067',
  rag: '#39c5cf',
  edge: '#4a5262',
  frame: '#3a4150',
  label: '#7d8596',
}

const NODE_H = 30

// `step` orders the page-load animation; it follows a run through the graph.
const nodes = [
  { id: 'start', cx: 178, y: 10, w: 76, color: COLOR.flow, step: 0 },
  { id: 'guardrail', cx: 178, y: 70, w: 92, color: COLOR.guard, step: 1 },
  { id: 'refuse', cx: 58, y: 70, w: 72, color: COLOR.guard, step: 2 },
  { id: 'load_memory', cx: 178, y: 130, w: 108, color: COLOR.memory, step: 2 },
  { id: 'agent', cx: 178, y: 215, w: 76, color: COLOR.llm, step: 3 },
  { id: 'tools', cx: 58, y: 215, w: 64, color: COLOR.tool, step: 4 },
  { id: 'rewrite_query', cx: 322, y: 124, w: 116, color: COLOR.rag, step: 6 },
  { id: 'retrieve', cx: 322, y: 178, w: 136, color: COLOR.rag, step: 4 },
  { id: 'grade_documents', cx: 322, y: 232, w: 128, color: COLOR.rag, step: 5 },
  { id: 'return_documents', cx: 322, y: 286, w: 136, color: COLOR.rag, step: 6 },
  { id: 'summarize', cx: 58, y: 330, w: 88, color: COLOR.memory, step: 7 },
  { id: 'save_memory', cx: 178, y: 330, w: 108, color: COLOR.memory, step: 7 },
  { id: 'end', cx: 178, y: 400, w: 76, color: COLOR.flow, step: 8 },
]

const subgraph = { label: 'document_search', x: 244, y: 98, w: 160, h: 228, step: 4 }

// `tip` is the arrowhead: [x, y, rotation in degrees].
const edges: { d: string; step: number; tip: [number, number, number] }[] = [
  { d: 'M178 40 V64', step: 0, tip: [178, 68, 90] }, // start -> guardrail
  { d: 'M132 85 H98', step: 1, tip: [96, 85, 180] }, // guardrail -> refuse
  { d: 'M178 100 V124', step: 1, tip: [178, 128, 90] }, // guardrail -> load_memory
  { d: 'M178 160 V209', step: 2, tip: [178, 213, 90] }, // load_memory -> agent
  { d: 'M140 224 H96', step: 3, tip: [92, 224, 180] }, // agent -> tools
  { d: 'M90 236 H134', step: 4, tip: [138, 236, 0] }, // tools -> agent
  { d: 'M216 224 H234 V193 H248', step: 3, tip: [252, 193, 0] }, // agent -> retrieve
  { d: 'M322 208 V226', step: 4, tip: [322, 230, 90] }, // retrieve -> grade_documents
  { d: 'M386 247 H397 V139 H386', step: 5, tip: [382, 139, 180] }, // grade_documents -> rewrite_query
  { d: 'M322 154 V172', step: 6, tip: [322, 176, 90] }, // rewrite_query -> retrieve
  { d: 'M322 262 V280', step: 5, tip: [322, 284, 90] }, // grade_documents -> return_documents
  { d: 'M254 301 H228 V236 H222', step: 6, tip: [218, 236, 180] }, // return_documents -> agent
  { d: 'M178 245 V324', step: 6, tip: [178, 328, 90] }, // agent -> save_memory
  { d: 'M178 288 H58 V324', step: 6, tip: [58, 328, 90] }, // agent -> summarize
  { d: 'M178 360 V394', step: 7, tip: [178, 398, 90] }, // save_memory -> end
  { d: 'M58 360 V409 H134', step: 7, tip: [138, 409, 0] }, // summarize -> end
  { d: 'M22 85 H6 V421 H134', step: 7, tip: [138, 421, 0] }, // refuse -> end
]

const step = (n: number) => ({ '--step': n }) as CSSProperties

export function AgentGraphFigure({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 410 440" role="img" aria-label={label} className="h-auto w-full">
      <g className="graph-node" style={step(subgraph.step)}>
        <rect
          x={subgraph.x}
          y={subgraph.y}
          width={subgraph.w}
          height={subgraph.h}
          rx={8}
          fill="none"
          stroke={COLOR.frame}
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <text
          x={subgraph.x + 8}
          y={subgraph.y + 15}
          fill={COLOR.label}
          fontSize={11}
          className="font-mono"
        >
          {subgraph.label}
        </text>
      </g>
      {edges.map((e, i) => (
        <g key={i}>
          <path
            d={e.d}
            pathLength={1}
            fill="none"
            stroke={COLOR.edge}
            strokeWidth={1.5}
            className="graph-edge"
            style={step(e.step)}
          />
          <g className="graph-node" style={step(e.step + 1)}>
            <path
              d="M-6 -4 L0 0 L-6 4"
              fill="none"
              stroke={COLOR.edge}
              strokeWidth={1.5}
              transform={`translate(${e.tip[0]} ${e.tip[1]}) rotate(${e.tip[2]})`}
            />
          </g>
        </g>
      ))}
      {nodes.map((n) => (
        <g key={n.id} className="graph-node" style={step(n.step)}>
          <rect
            x={n.cx - n.w / 2}
            y={n.y}
            width={n.w}
            height={NODE_H}
            rx={6}
            fill="#13161c"
            stroke={n.color}
            strokeWidth={1}
          />
          <text
            x={n.cx}
            y={n.y + NODE_H / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={n.color}
            fontSize={12}
            className="font-mono"
          >
            {n.id}
          </text>
        </g>
      ))}
    </svg>
  )
}
