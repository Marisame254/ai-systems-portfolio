'use client'

import { useLanguage } from '@/lib/i18n/provider'

const skillItems: Record<string, string[]> = {
  agents: [
    'LangGraph (checkpointer, store, HITL middleware)',
    'LangChain agents (deepagents, create_agent)',
    'Tool orchestration & multi-step reasoning',
    'Streaming token responses (SSE / WebSocket)',
  ],
  rag: [
    'PGvector, Chromadb',
    'Hugging Face & Ollama embeddings',
    'Hybrid retrieval',
    'Document chunking & ingestion',
  ],
  mcp: [
    'MCP servers (fastapi-mcp, FastMCP)',
    'MCP clients (MultiServerMCPClient)',
    'MCP Oauth & API key authentication',
  ],
  backend: [
    'FastAPI',
    'SQLAlchemy async + asyncpg',
    'Alembic',
    'PostgreSQL, Supabase',
    'Redis',
    'JWT + refresh tokens',
    'Polymorphic RBAC',
    'Multi-tenant architecture',
  ],
  ml: [
    'TensorFlow',
    'PyTorch',
    'Scikit-learn',
    'Keras',
    'Vision-Language models (X-CLIP)',
    'LLM fine-tuning (LLaMA)',
    'Prompt engineering',
  ],
  frontend: ['React', 'Next.js (App Router)', 'React Router v7', 'TailwindCSS', 'TypeScript'],
  cloud: ['AWS', 'Docker', 'Kubernetes', 'CI/CD (Python + Bash)'],
  languages: ['Python', 'TypeScript', 'Go (GraphQL)', 'SQL', 'uv', 'pnpm', 'Git'],
}

const projectMeta = [
  {
    key: 'portfolio',
    tech: ['Next.js', 'FastAPI', 'LangGraph', 'pgvector', 'Turborepo'],
    href: 'https://github.com/marisame254/ai-systems-portfolio',
  },
  {
    key: 'lyra',
    tech: ['Python', 'DeepAgents', 'MCP', 'Ollama', 'PostgreSQL'],
  },
  {
    key: 'mcpServers',
    tech: ['LangGraph', 'Chainlit', 'MCP', 'Ollama', 'PostgreSQL'],
  },
  {
    key: 'enterpriseRag',
    tech: ['FastAPI', 'LangGraph SDK', 'React Router v7', 'pgvector', 'fastapi-mcp'],
  },
] as const

export default function CVPage() {
  const { t } = useLanguage()
  const cv = t.cv

  const skillEntries: { category: string; items: string[] }[] = [
    { category: cv.skillCategories.agents, items: skillItems.agents },
    { category: cv.skillCategories.rag, items: skillItems.rag },
    { category: cv.skillCategories.mcp, items: skillItems.mcp },
    { category: cv.skillCategories.backend, items: skillItems.backend },
    { category: cv.skillCategories.ml, items: skillItems.ml },
    { category: cv.skillCategories.frontend, items: skillItems.frontend },
    { category: cv.skillCategories.cloud, items: skillItems.cloud },
    { category: cv.skillCategories.languages, items: skillItems.languages },
  ]

  const experience = [
    {
      title: cv.experience.w3b.title,
      company: 'W3bInnovation',
      location: cv.experience.w3b.location,
      period: cv.experience.w3b.period,
      bullets: cv.experience.w3b.bullets,
    },
    {
      title: cv.experience.datyra.title,
      company: 'Datyra',
      location: cv.experience.datyra.location,
      period: cv.experience.datyra.period,
      groups: [
        cv.experience.datyra.groups.ml,
        cv.experience.datyra.groups.cloud,
        cv.experience.datyra.groups.automation,
        cv.experience.datyra.groups.software,
        cv.experience.datyra.groups.productivity,
      ],
    },
  ]

  const projects = projectMeta.map((p) => {
    const dict = cv.projects[p.key]
    return { name: dict.name, description: dict.description, tech: p.tech, href: 'href' in p ? p.href : undefined }
  })

  const education = [
    cv.education.masters,
    cv.education.bachelors,
  ]

  const languages = [cv.languages.spanish, cv.languages.english]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="mb-10 border-b border-border pb-8 sm:mb-12 sm:pb-12">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent-green">
          {cv.label}
        </p>
        <h1 className="mb-2 text-3xl font-bold text-gradient-green sm:text-4xl md:text-5xl">
          {cv.name}
        </h1>
        <p className="mb-6 text-base text-text-secondary sm:text-xl">{cv.subtitle}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs sm:text-sm">
          <a
            href="mailto:rulivas26@gmail.com"
            className="text-accent-cyan transition-colors hover:text-accent-green"
          >
            rulivas26@gmail.com
          </a>
          <span className="text-text-muted">{cv.location}</span>
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

      {/* Summary */}
      <section className="mb-12 sm:mb-16">
        <p className="mb-6 font-mono text-xs uppercase tracking-widest text-accent-green">
          {cv.sections.summary}
        </p>
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <p className="text-sm leading-relaxed text-text-secondary">{cv.summary}</p>
        </div>
      </section>

      {/* Skills */}
      <section className="mb-12 sm:mb-16">
        <p className="mb-8 font-mono text-xs uppercase tracking-widest text-accent-green">
          {cv.sections.skills}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {skillEntries.map(({ category, items }) => (
            <div key={category} className="rounded-lg border border-border bg-surface p-4 sm:p-5">
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
      <section className="mb-12 sm:mb-16">
        <p className="mb-8 font-mono text-xs uppercase tracking-widest text-accent-green">
          {cv.sections.experience}
        </p>
        <div className="space-y-6">
          {experience.map((exp, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-4 sm:p-6">
              <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-text-primary">{exp.title}</h3>
                <span className="font-mono text-xs text-text-muted">{exp.period}</span>
              </div>
              <p className="mb-4 font-mono text-sm text-accent-cyan">
                {exp.company} · <span className="text-text-muted">{exp.location}</span>
              </p>

              {'bullets' in exp && exp.bullets && (
                <ul className="space-y-2">
                  {exp.bullets.map((point, j) => (
                    <li key={j} className="flex gap-2 text-sm text-text-secondary">
                      <span className="mt-0.5 shrink-0 text-accent-green">›</span>
                      {point}
                    </li>
                  ))}
                </ul>
              )}

              {'groups' in exp && exp.groups && (
                <div className="space-y-4">
                  {exp.groups.map((group, j) => (
                    <div key={j}>
                      <h4 className="mb-2 font-mono text-xs uppercase tracking-widest text-accent-green/80">
                        {group.heading}
                      </h4>
                      <ul className="space-y-2">
                        {group.bullets.map((point, k) => (
                          <li key={k} className="flex gap-2 text-sm text-text-secondary">
                            <span className="mt-0.5 shrink-0 text-accent-green">›</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="mb-12 sm:mb-16">
        <p className="mb-8 font-mono text-xs uppercase tracking-widest text-accent-green">
          {cv.sections.projects}
        </p>
        <div className="space-y-4">
          {projects.map((proj, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-4 sm:p-6">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                {proj.href ? (
                  <a
                    href={proj.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-text-primary transition-colors hover:text-accent-green"
                  >
                    {proj.name}
                  </a>
                ) : (
                  <span className="text-lg font-semibold text-text-primary">{proj.name}</span>
                )}
              </div>
              <p className="mb-4 text-sm text-text-secondary">{proj.description}</p>
              <div className="flex flex-wrap gap-2">
                {proj.tech.map((tech) => (
                  <span
                    key={tech}
                    className="rounded border border-accent-cyan/20 bg-accent-cyan/5 px-2 py-0.5 font-mono text-xs text-accent-cyan"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="mb-12 sm:mb-16">
        <p className="mb-8 font-mono text-xs uppercase tracking-widest text-accent-green">
          {cv.sections.education}
        </p>
        <div className="space-y-4">
          {education.map((edu, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-text-primary">{edu.degree}</h3>
                  <p className="font-mono text-sm text-accent-cyan">{edu.institution}</p>
                </div>
                <span className="font-mono text-xs text-text-muted">{edu.period}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Languages + Certifications */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-accent-green">
            {cv.sections.languages}
          </p>
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <ul className="space-y-2">
              {languages.map((lang) => (
                <li key={lang.name} className="flex justify-between text-sm">
                  <span className="text-text-primary">{lang.name}</span>
                  <span className="font-mono text-xs text-text-muted">{lang.level}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-accent-green">
            {cv.sections.certifications}
          </p>
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <ul className="space-y-2">
              {cv.certifications.map((cert) => (
                <li key={cert} className="flex gap-2 text-sm text-text-secondary">
                  <span className="mt-0.5 shrink-0 text-accent-green">✓</span>
                  {cert}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
