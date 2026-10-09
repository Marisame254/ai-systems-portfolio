import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0c0e12',
        surface: '#13161c',
        'surface-2': '#1a1e26',
        border: '#272c36',
        accent: '#58d1a0',
        // Reserved for graph node types; not decorative.
        'node-llm': '#6cb6ff',
        'node-tool': '#b392f0',
        'node-memory': '#e3b341',
        'node-guard': '#f47067',
        'node-rag': '#39c5cf',
        'text-primary': '#e6e8ec',
        'text-secondary': '#a3aab8',
        'text-muted': '#7d8596',
      },
      fontFamily: {
        sans: ['var(--font-plex-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      animation: {
        'cursor-blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
