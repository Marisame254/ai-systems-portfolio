import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CV | Raul Vasquez — Machine Learning Engineer',
}

const summary =
  'Machine Learning Engineer with solid experience in AI, data engineering, and cloud computing. ' +
  'Specialized in designing, optimizing, and deploying scalable ML systems and full-stack applications. ' +
  'Builds advanced agent-based architectures and retrieval-augmented generation (RAG) systems with ' +
  'LangChain/LangGraph, integrating tool orchestration, persistent memory, and human-in-the-loop workflows.'

const skills: Record<string, string[]> = {
  'AI Agents & Orchestration': [
    'LangGraph (checkpointer, store, HITL middleware)',
    'LangChain agents (deepagents, create_agent)',
    'Tool orchestration & multi-step reasoning',
    'Streaming token responses (SSE / WebSocket)',
  ],
  'RAG & Vector Search': [
    'PGvector, Chromadb',
    'Hugging Face & Ollama embeddings',
    'Hybrid retrieval',
    'Document chunking & ingestion',
  ],
  'MCP (Model Context Protocol)': [
    'MCP servers (fastapi-mcp, FastMCP)',
    'MCP clients (MultiServerMCPClient)',
    'MCP Oauth & API key authentication',
  ],
  'Backend & Data': [
    'FastAPI',
    'SQLAlchemy async + asyncpg',
    'Alembic',
    'PostgreSQL, Supabase',
    'Redis',
    'JWT + refresh tokens',
    'Polymorphic RBAC',
    'Multi-tenant architecture',
  ],
  'ML & Deep Learning': [
    'TensorFlow',
    'PyTorch',
    'Scikit-learn',
    'Keras',
    'Vision-Language models (X-CLIP)',
    'LLM fine-tuning (LLaMA)',
    'Prompt engineering',
  ],
  Frontend: [
    'React',
    'Next.js (App Router)',
    'React Router v7',
    'TailwindCSS',
    'TypeScript',
  ],
  'Cloud & DevOps': ['AWS', 'Docker', 'Kubernetes', 'CI/CD (Python + Bash)'],
  'Languages & Tools': [
    'Python',
    'TypeScript',
    'Go (GraphQL)',
    'SQL',
    'uv',
    'pnpm',
    'Git',
  ],
}

interface ExperienceBlock {
  bullets?: string[]
  groups?: { heading: string; bullets: string[] }[]
}

const experience: (ExperienceBlock & {
  title: string
  company: string
  location: string
  period: string
})[] = [
  {
    title: 'Full-Stack Developer & AI Engineer',
    company: 'W3bInnovation',
    location: 'Remote',
    period: '2025 – Present',
    bullets: [
      'Designed and deployed intelligent-agent architectures with LangChain & LangGraph — agent workflows, tool orchestration, persistent memory (PostgreSQL checkpointer + store), and structured decision pipelines.',
      'Built multi-tenant RAG systems with pgvector and Ollama embeddings, improving factual consistency and traceability of conversational AI for enterprise clients.',
      'Implemented an MCP server (fastapi-mcp) exposing project, document, and RAG tools to external agents — with API-key authentication, scoped permissions, and request logging.',
      'Developed FastAPI services for LLM inference, authentication, session management, and agent lifecycle orchestration; designed a polymorphic RBAC system with resource-grant inheritance (organization → project → conversation).',
      'Built React + TailwindCSS + React Router v7 frontends with WebSocket streaming for real-time agent token responses, tool-use indicators, and human-in-the-loop interrupts.',
    ],
  },
  {
    title: 'Machine Learning Engineer',
    company: 'Datyra',
    location: 'San Diego, USA',
    period: '2022 – 2024',
    groups: [
      {
        heading: 'ML & Data Modeling',
        bullets: [
          'Developed and deployed scalable ML systems with TensorFlow, PyTorch, Scikit-learn, and Keras: regression, classification, clustering.',
          'Fine-tuned vision-language and LLM models (X-CLIP, LLaMA) for object detection, semantic understanding, and domain-specific response generation.',
          'Built LLM-powered systems for automated reporting, structured data analysis, and conversational interfaces using prompt engineering and customized RAG pipelines.',
        ],
      },
      {
        heading: 'Cloud & Data',
        bullets: [
          'Managed PostgreSQL, MySQL, MongoDB; designed scalable architectures on AWS and Azure.',
        ],
      },
      {
        heading: 'Automation & Deployment',
        bullets: [
          'Designed automated training/validation/deployment pipelines (Python + Bash, CI/CD); deployed containerized apps via Docker and Kubernetes.',
        ],
      },
      {
        heading: 'Software & Web',
        bullets: [
          'Implemented GraphQL services in Go; integrated Stripe payments and referral systems; built secure RBAC authentication.',
        ],
      },
      {
        heading: 'Productivity & Visualization',
        bullets: [
          'Built dashboards and internal tools with Apache Superset, Mercury, and Retool; managed audience segmentation via Mailchimp.',
        ],
      },
    ],
  },
]

const projects = [
  {
    name: 'AI Systems Portfolio',
    description:
      'This monorepo — Next.js 14 + FastAPI + LangGraph + pgvector. Live demos for streaming chat, RAG, and agent visualization. Provider-agnostic LLM (Ollama in dev, OpenAI in prod).',
    tech: ['Next.js', 'FastAPI', 'LangGraph', 'pgvector', 'Turborepo'],
    href: 'https://github.com/marisame254/ai-systems-portfolio',
  },
  {
    name: 'Lyra',
    description:
      'Python CLI agent with MCP tool integration, persistent memory (filesystem + PostgreSQL), configurable models (Ollama local + cloud), and thread management.',
    tech: ['Python', 'DeepAgents', 'MCP', 'Ollama', 'PostgreSQL'],
  },
  {
    name: 'mcp-servers',
    description:
      'Chat platform on LangGraph + Chainlit + MCP. Uses AsyncPostgresSaver/Store, summarization / HITL / todo-list middleware, and multi-server MCP integration.',
    tech: ['LangGraph', 'Chainlit', 'MCP', 'Ollama', 'PostgreSQL'],
  },
  {
    name: 'Enterprise RAG Platform',
    description:
      'Client project (anonymized). FastAPI backend with LangGraph SDK; React Router v7 + Tailwind v4 frontend. Polymorphic RBAC, MCP server with API keys, conversation sharing, WebSocket token streaming.',
    tech: ['FastAPI', 'LangGraph SDK', 'React Router v7', 'pgvector', 'fastapi-mcp'],
  },
]

const education = [
  {
    degree: 'Master in Robotics',
    institution: 'Universidad Tecnológica de la Mixteca',
    period: '2019 – 2021',
  },
  {
    degree: 'Bachelor in Mechatronics',
    institution: 'Universidad Tecnológica de la Mixteca',
    period: '2014 – 2019',
  },
]

const languages = [
  { name: 'Spanish', level: 'Native' },
  { name: 'English', level: 'Proficient' },
]

const certifications = [
  'Applied Data Science with Python Specialization (Mar 2022)',
  "SQL and PostgreSQL: The Complete Developer's Guide (Feb 2022)",
  'IBM Data Engineering Specialization (Feb 2022)',
  'NoSQL, Big Data, and Spark Foundations Specialization (Apr 2022)',
  'BI Foundations with SQL, ETL, and Data Warehousing Specialization (Apr 2022)',
  'Python for Everybody Specialization (Feb 2022)',
]

export default function CVPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="mb-10 border-b border-border pb-8 sm:mb-12 sm:pb-12">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent-green">
          // curriculum_vitae
        </p>
        <h1 className="mb-2 text-3xl font-bold text-gradient-green sm:text-4xl md:text-5xl">
          Raul Vasquez
        </h1>
        <p className="mb-6 text-base text-text-secondary sm:text-xl">
          Machine Learning Engineer · AI Systems
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs sm:text-sm">
          <a
            href="mailto:rulivas26@gmail.com"
            className="text-accent-cyan transition-colors hover:text-accent-green"
          >
            rulivas26@gmail.com
          </a>
          <span className="text-text-muted">Oaxaca de Juárez, México</span>
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
          // summary
        </p>
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <p className="text-sm leading-relaxed text-text-secondary">{summary}</p>
        </div>
      </section>

      {/* Skills */}
      <section className="mb-12 sm:mb-16">
        <p className="mb-8 font-mono text-xs uppercase tracking-widest text-accent-green">
          // skills
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(skills).map(([category, items]) => (
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
          // experience
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

              {exp.bullets && (
                <ul className="space-y-2">
                  {exp.bullets.map((point, j) => (
                    <li key={j} className="flex gap-2 text-sm text-text-secondary">
                      <span className="mt-0.5 shrink-0 text-accent-green">›</span>
                      {point}
                    </li>
                  ))}
                </ul>
              )}

              {exp.groups && (
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
          // projects
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
        </div>
      </section>

      {/* Education */}
      <section className="mb-12 sm:mb-16">
        <p className="mb-8 font-mono text-xs uppercase tracking-widest text-accent-green">
          // education
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
            // languages
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
            // certifications
          </p>
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <ul className="space-y-2">
              {certifications.map((cert) => (
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
