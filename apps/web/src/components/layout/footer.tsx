export function Footer() {
  return (
    <footer className="border-t border-border py-8 text-center">
      <p className="font-mono text-sm text-text-muted">
        <span className="text-accent-green">{'>'}</span> built by{' '}
        <span className="text-text-secondary">Marisame</span> with{' '}
        <span className="text-accent-cyan">LangGraph</span> ·{' '}
        <span className="text-accent-cyan">LangChain</span> ·{' '}
        <span className="text-accent-cyan">Next.js</span>
      </p>
    </footer>
  )
}
