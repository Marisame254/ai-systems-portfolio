import { ImageResponse } from 'next/og'
import { site } from '@/lib/site'

export const runtime = 'edge'
export const alt = `${site.name} | ${site.role}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const nodes = [
  { label: 'load_memory', color: '#e3b341' },
  { label: 'agent', color: '#6cb6ff' },
  { label: 'tools', color: '#b392f0' },
  { label: 'save_memory', color: '#e3b341' },
]

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: '#0c0e12',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 104,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#e6e8ec',
              lineHeight: 1,
            }}
          >
            {site.name}
          </div>
          <div style={{ marginTop: 24, fontSize: 48, color: '#58d1a0' }}>{site.role}</div>
          <div style={{ marginTop: 28, fontSize: 30, color: '#a3aab8', maxWidth: 900 }}>
            LLM agents with tools, retrieval and memory. Live demos on LangGraph and FastAPI.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {nodes.map((node, i) => (
            <div key={node.label} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div
                style={{
                  display: 'flex',
                  padding: '14px 26px',
                  borderRadius: 10,
                  border: `2px solid ${node.color}`,
                  background: '#13161c',
                  color: node.color,
                  fontSize: 28,
                  fontFamily: 'monospace',
                }}
              >
                {node.label}
              </div>
              {i < nodes.length - 1 && (
                <div style={{ display: 'flex', width: 44, height: 2, background: '#4a5262' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
