import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CV | Marisame — AI Systems Engineer',
}

const skills: Record<string, string[]> = {
  'Languages & Frameworks': ['Python', 'TypeScript', 'FastAPI', 'Next.js', 'React'],
  'AI & ML': [
    'LangGraph',
    'LLM Providers (OpenAI, Ollama, Anthropic)',
    'RAG Systems',
    'Multi-Agent Architectures',
    'pgvector',
    'Embeddings',
  ],
  Infrastructure: ['Docker', 'PostgreSQL', 'Redis', 'Docker Compose', 'Nginx'],
  'Tools & Practices': ['pnpm Workspaces', 'Turborepo', 'Git', 'REST APIs', 'SSE Streaming'],
}

const experience = [
  {
    title: 'AI Systems Engineer',
    company: 'Independent / Open Source',
    period: '2023 – Present',
    points: [
      'Designed and implemented multi-agent orchestration systems using LangGraph with complex conditional edge routing.',
      'Built production RAG pipelines with pgvector similarity search and hybrid retrieval strategies.',
      'Integrated multiple LLM providers (OpenAI, Ollama, Anthropic) with streaming responses, tool use, and structured output parsing.',
      'Architected FastAPI backends with async SSE endpoints delivering sub-100ms time-to-first-token.',
      'Managed full monorepo environments with Turborepo, pnpm workspaces, and uv for Python.',
    ],
  },
]

const education = [
  {
    degree: 'Computer Science',
    institution: 'Technology University',
    period: '2019 – 2023',
    note: 'Focus: Distributed Systems, Machine Learning',
  },
]

const projects = [
  {
    name: 'AI Systems Portfolio',
    description:
      'This monorepo — Next.js 14 frontend, FastAPI backend, LangGraph agent demos, pgvector RAG, Docker Compose infra.',
    tech: ['Next.js', 'FastAPI', 'LangGraph', 'pgvector', 'Turborepo'],
    href: 'https://github.com/marisame254/ai-systems-portfolio',
  },
]

export default function CVPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Header */}
      <div className="mb-16 border-b border-border pb-12">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent-green">
          // curriculum_vitae
        </p>
        <h1 className="mb-2 text-5xl font-bold text-gradient-green">Marisame</h1>
        <p className="mb-6 text-xl text-text-secondary">AI Systems Engineer</p>
        <div className="flex flex-wrap gap-4 font-mono text-sm">
          <a
            href="https://github.com/marisame254"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-cyan transition-colors hover:text-accent-green"
          >
            github.com/marisame254
          </a>
        </div>
      </div>

      {/* Skills */}
      <section className="mb-16">
        <p className="mb-8 font-mono text-xs uppercase tracking-widest text-accent-green">
          // skills
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(skills).map(([category, items]) => (
            <div key={category} className="rounded-lg border border-border bg-surface p-5">
              <h3 className="mb-3 font-mono text-sm text-text-secondary">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => (
                  <span
                    key={skill}
                    className="rounded border border-accent-green/20 bg-accent-green/5 px-2 py-0.5 font-mono text-xs text-accent-green"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="mb-16">
        <p className="mb-8 font-mono text-xs uppercase tracking-widest text-accent-green">
          // experience
        </p>
        {experience.map((exp, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-6">
            <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-text-primary">{exp.title}</h3>
              <span className="font-mono text-xs text-text-muted">{exp.period}</span>
            </div>
            <p className="mb-4 font-mono text-sm text-accent-cyan">{exp.company}</p>
            <ul className="space-y-2">
              {exp.points.map((point, j) => (
                <li key={j} className="flex gap-2 text-sm text-text-secondary">
                  <span className="mt-0.5 shrink-0 text-accent-green">›</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Projects */}
      <section className="mb-16">
        <p className="mb-8 font-mono text-xs uppercase tracking-widest text-accent-green">
          // projects
        </p>
        {projects.map((proj, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-6">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <a
                href={proj.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-text-primary transition-colors hover:text-accent-green"
              >
                {proj.name}
              </a>
            </div>
            <p className="mb-4 text-sm text-text-secondary">{proj.description}</p>
            <div className="flex flex-wrap gap-2">
              {proj.tech.map((t) => (
                <span
                  key={t}
                  className="rounded border border-accent-cyan/20 bg-accent-cyan/5 px-2 py-0.5 font-mono text-xs text-accent-cyan"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Education */}
      <section>
        <p className="mb-8 font-mono text-xs uppercase tracking-widest text-accent-green">
          // education
        </p>
        {education.map((edu, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-text-primary">{edu.degree}</h3>
                <p className="font-mono text-sm text-accent-cyan">{edu.institution}</p>
                {edu.note && <p className="mt-1 text-sm text-text-muted">{edu.note}</p>}
              </div>
              <span className="font-mono text-xs text-text-muted">{edu.period}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
