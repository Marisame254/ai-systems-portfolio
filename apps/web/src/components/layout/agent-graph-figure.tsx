import type { CSSProperties } from 'react'

// Mirrors the graph built in apps/api/agents/chat_agent.py::build_chat_graph.
const COLOR = {
  flow: '#58d1a0',
  memory: '#e3b341',
  llm: '#6cb6ff',
  tool: '#b392f0',
  edge: '#4a5262',
}

const NODE_H = 34

const nodes = [
  { id: 'start', cx: 130, y: 20, w: 76, color: COLOR.flow, step: 0 },
  { id: 'load_memory', cx: 130, y: 90, w: 136, color: COLOR.memory, step: 1 },
  { id: 'agent', cx: 130, y: 170, w: 100, color: COLOR.llm, step: 2 },
  { id: 'tools', cx: 300, y: 170, w: 84, color: COLOR.tool, step: 3 },
  { id: 'save_memory', cx: 130, y: 260, w: 136, color: COLOR.memory, step: 4 },
  { id: 'end', cx: 130, y: 330, w: 76, color: COLOR.flow, step: 5 },
]

// `tip` is the arrowhead: [x, y, rotation in degrees].
const edges: { d: string; step: number; tip: [number, number, number] }[] = [
  { d: 'M130 54 V84', step: 0, tip: [130, 88, 90] },
  { d: 'M130 124 V164', step: 1, tip: [130, 168, 90] },
  { d: 'M180 180 C 205 160, 230 160, 254 178', step: 2, tip: [257, 180, 35] },
  { d: 'M258 194 C 232 214, 207 214, 184 196', step: 3, tip: [181, 194, 215] },
  { d: 'M130 204 V254', step: 3, tip: [130, 258, 90] },
  { d: 'M130 294 V324', step: 5, tip: [130, 328, 90] },
]

const step = (n: number) => ({ '--step': n }) as CSSProperties

export function AgentGraphFigure({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 360 384" role="img" aria-label={label} className="h-auto w-full">
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
            fontSize={13}
            className="font-mono"
          >
            {n.id}
          </text>
        </g>
      ))}
    </svg>
  )
}
