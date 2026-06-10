import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Marisame — AI Systems Engineer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#0a0a0a',
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(0,255,136,0.12), transparent 45%), radial-gradient(circle at 10% 90%, rgba(0,213,255,0.10), transparent 45%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            backgroundImage: 'linear-gradient(90deg, #00ff88, #00d5ff)',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1,
          }}
        >
          Marisame
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 52,
            fontWeight: 600,
            color: '#fafafa',
          }}
        >
          AI Systems Engineer
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 30,
            fontWeight: 500,
            color: '#00ff88',
          }}
        >
          LangGraph · RAG · Multi-agent
        </div>
      </div>
    ),
    { ...size },
  )
}
