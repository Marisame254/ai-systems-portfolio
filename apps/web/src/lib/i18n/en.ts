export const en = {
  navbar: {
    home: 'Home',
    cv: 'CV',
    demos: 'Demos',
    github: 'github',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    language: 'Language',
  },
  footer: {
    builtBy: 'built by',
    with: 'with',
  },
  hero: {
    role: 'AI Systems Engineer',
    stack: 'LangGraph · RAG · Multi-Agent · LLM',
    tagline: 'Building AI that thinks in graphs',
  },
  home: {
    viewCv: 'View CV',
    exploreDemos: 'Explore Demos',
    liveDemosLabel: '// live_demos',
    sectionTitle: 'AI Systems in Action',
  },
  demosPage: {
    label: '// ai_demos',
    title: 'AI Systems Demos',
    description:
      'Interactive demonstrations of AI engineering patterns — from streaming chat to multi-agent graphs. Each demo showcases a real architecture pattern used in production AI systems.',
  },
  demos: {
    openDemo: 'open demo',
    badges: {
      live: 'Live',
      preview: 'Preview',
    },
    chat: {
      title: 'AI Chat Playground',
      description: 'Streaming chat with real-time token rendering. Ollama in dev, OpenAI in prod.',
    },
    rag: {
      title: 'RAG Demo',
      description:
        'Upload documents and query them using pgvector-powered retrieval augmented generation.',
    },
    agents: {
      title: 'Agent Visualization',
      description: 'Interactive LangGraph state machine graph with live node execution traces.',
    },
    memory: {
      title: 'Memory Demo',
      description: 'Redis-backed conversation memory with cross-session context persistence.',
    },
  },
  cv: {
    label: '// curriculum_vitae',
    name: 'Raul Vasquez',
    subtitle: 'Machine Learning Engineer · AI Systems',
    location: 'Oaxaca de Juárez, México',
    sections: {
      summary: '// summary',
      skills: '// skills',
      experience: '// experience',
      projects: '// projects',
      education: '// education',
      languages: '// languages',
      certifications: '// certifications',
    },
    summary:
      'Machine Learning Engineer with solid experience in AI, data engineering, and cloud computing. Specialized in designing, optimizing, and deploying scalable ML systems and full-stack applications. Builds advanced agent-based architectures and retrieval-augmented generation (RAG) systems with LangChain/LangGraph, integrating tool orchestration, persistent memory, and human-in-the-loop workflows.',
    skillCategories: {
      agents: 'AI Agents & Orchestration',
      rag: 'RAG & Vector Search',
      mcp: 'MCP (Model Context Protocol)',
      backend: 'Backend & Data',
      ml: 'ML & Deep Learning',
      frontend: 'Frontend',
      cloud: 'Cloud & DevOps',
      languages: 'Languages & Tools',
    },
    experience: {
      w3b: {
        title: 'Full-Stack Developer & AI Engineer',
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
      datyra: {
        title: 'Machine Learning Engineer',
        location: 'San Diego, USA',
        period: '2022 – 2024',
        groups: {
          ml: {
            heading: 'ML & Data Modeling',
            bullets: [
              'Developed and deployed scalable ML systems with TensorFlow, PyTorch, Scikit-learn, and Keras: regression, classification, clustering.',
              'Fine-tuned vision-language and LLM models (X-CLIP, LLaMA) for object detection, semantic understanding, and domain-specific response generation.',
              'Built LLM-powered systems for automated reporting, structured data analysis, and conversational interfaces using prompt engineering and customized RAG pipelines.',
            ],
          },
          cloud: {
            heading: 'Cloud & Data',
            bullets: [
              'Managed PostgreSQL, MySQL, MongoDB; designed scalable architectures on AWS and Azure.',
            ],
          },
          automation: {
            heading: 'Automation & Deployment',
            bullets: [
              'Designed automated training/validation/deployment pipelines (Python + Bash, CI/CD); deployed containerized apps via Docker and Kubernetes.',
            ],
          },
          software: {
            heading: 'Software & Web',
            bullets: [
              'Implemented GraphQL services in Go; integrated Stripe payments and referral systems; built secure RBAC authentication.',
            ],
          },
          productivity: {
            heading: 'Productivity & Visualization',
            bullets: [
              'Built dashboards and internal tools with Apache Superset, Mercury, and Retool; managed audience segmentation via Mailchimp.',
            ],
          },
        },
      },
    },
    projects: {
      portfolio: {
        name: 'AI Systems Portfolio',
        description:
          'This monorepo — Next.js 14 + FastAPI + LangGraph + pgvector. Live demos for streaming chat, RAG, and agent visualization. Provider-agnostic LLM (Ollama in dev, OpenAI in prod).',
      },
      lyra: {
        name: 'Lyra',
        description:
          'Python CLI agent with MCP tool integration, persistent memory (filesystem + PostgreSQL), configurable models (Ollama local + cloud), and thread management.',
      },
      mcpServers: {
        name: 'mcp-servers',
        description:
          'Chat platform on LangGraph + Chainlit + MCP. Uses AsyncPostgresSaver/Store, summarization / HITL / todo-list middleware, and multi-server MCP integration.',
      },
      enterpriseRag: {
        name: 'Enterprise RAG Platform',
        description:
          'Client project (anonymized). FastAPI backend with LangGraph SDK; React Router v7 + Tailwind v4 frontend. Polymorphic RBAC, MCP server with API keys, conversation sharing, WebSocket token streaming.',
      },
    },
    education: {
      masters: {
        degree: 'Master in Robotics',
        institution: 'Universidad Tecnológica de la Mixteca',
        period: '2019 – 2021',
      },
      bachelors: {
        degree: 'Bachelor in Mechatronics',
        institution: 'Universidad Tecnológica de la Mixteca',
        period: '2014 – 2019',
      },
    },
    languages: {
      spanish: { name: 'Spanish', level: 'Native' },
      english: { name: 'English', level: 'Proficient' },
    },
    certifications: [
      'Applied Data Science with Python Specialization (Mar 2022)',
      "SQL and PostgreSQL: The Complete Developer's Guide (Feb 2022)",
      'IBM Data Engineering Specialization (Feb 2022)',
      'NoSQL, Big Data, and Spark Foundations Specialization (Apr 2022)',
      'BI Foundations with SQL, ETL, and Data Warehousing Specialization (Apr 2022)',
      'Python for Everybody Specialization (Feb 2022)',
    ],
  },
  chatDemo: {
    label: '// ai_chat_playground',
    title: 'AI Chat',
    subtitleStateful: 'LangGraph agent · stateful',
    subtitleProvider: (provider: string, model: string) =>
      `LangGraph · ${provider} ${model} · stateful`,
    thread: 'thread',
    threadsHeader: 'threads',
    newChat: 'new chat',
    noThreadsYet: 'no threads yet',
    untitled: 'untitled',
    inspectState: 'inspect state →',
    loadingThread: 'loading thread…',
    emptyTitle: 'Start a conversation...',
    emptySubtitle: 'This conversation persists across reloads in Postgres.',
    inputPlaceholder: 'Ask anything about AI systems...',
    sendAria: 'Send',
    openThreadsAria: 'Open threads',
    closeSidebarAria: 'Close sidebar',
    deleteThreadAria: 'Delete thread',
    connectionError: 'Error: Could not connect to the API. Is the backend running?',
    maxThreadsWarning: (n: number) => `max ${n} threads — sending will evict oldest`,
    justNow: 'just now',
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    daysAgo: (n: number) => `${n}d ago`,
  },
  agentsDemo: {
    label: '// agent_visualization',
    title: 'LangGraph Agent Graph',
    subtitlePrefix: 'Tool-calling agent ·',
    subtitleSuffix: 'loop with conditional edge · click any node for details',
    loopText: 'agent ↔ tools',
    legend: {
      startEnd: 'start / end',
      llm: 'agent (llm)',
      tools: 'tools',
      conditional: 'conditional edge',
    },
    errorTitle: 'Could not load agent graph.',
    errorHint: 'Is the backend running on /api/agents/graph?',
    loading: 'loading graph...',
    closeAria: 'Close',
    panel: {
      provider: 'provider',
      model: 'model',
      systemPrompt: 'system prompt',
      unknown: 'unknown',
      boundTools: (n: number) => `bound tools (${n})`,
      noDescription: 'no description',
      noTools: 'No tools wired. Set',
      noToolsTail: 'to enable web search.',
      llmDescription:
        'Invokes the LLM with the bound tools. The response is appended to state.messages; if it contains tool_calls, the conditional edge routes to tools.',
      toolDescription:
        'ToolNode executes whichever tool the LLM requested and appends the result to state.messages, then loops back to agent.',
      builtIn: 'Built-in LangGraph node.',
    },
    footer:
      'Click any node to inspect it: see the model and system prompt for agent, the bound tools and their descriptions for tools, or the role of __start__ / __end__ in the LangGraph runtime.',
    inspectState: 'inspect state →',
  },
  memoryDemo: {
    label: '// memory_demo',
    title: 'Long-term Memory',
    description:
      "Cross-thread facts the agent remembers about you. Stored in Postgres via LangGraph's AsyncPostgresStore under ('memories', user_id).",
    userIdLabel: 'user_id',
    entryCount: (n: number) => `${n} ${n === 1 ? 'entry' : 'entries'}`,
    refresh: 'refresh',
    clearAll: 'clear all',
    noEntriesTitle: 'No memories yet',
    noEntriesHint: 'Chat with the agent or add an entry below.',
    addEntryHeader: 'Add Memory Entry',
    addEntryPlaceholder: 'e.g. Prefers concise answers with code examples',
    addEntryButton: 'Add Entry',
    deleteEntryAria: 'Delete memory',
    errors: {
      load: 'Could not reach the API. Is the backend running?',
      add: 'Failed to add memory.',
      remove: 'Failed to delete memory.',
      clear: 'Failed to clear memories.',
    },
    footer:
      "The agent's graph has load_memory and save_memory nodes. On every turn it pulls relevant facts for your user_id and, after replying, extracts new durable facts via the LLM and persists them here.",
  },
  ragDemo: {
    label: '// rag_demo',
    title: 'RAG Demo',
    descBefore: 'Upload up to',
    descMiddle:
      'documents, ask questions grounded in their content. The same documents are searchable from the',
    chatAgent: 'chat agent',
    descAfter: 'via the',
    descToolSuffix: 'tool.',
    pgvector: 'pgvector',
    accepted: 'accepted:',
    yourDocuments: 'Your documents',
    limitReached: 'limit reached',
    embedding: 'embedding & indexing…',
    limitDelete: 'Delete a document to upload another',
    uploadDrop: 'Drop a PDF, TXT, or MD — or click to upload',
    loading: 'loading…',
    noDocs: 'no documents yet',
    ask: 'Ask a question',
    filter: 'filter:',
    allDocuments: 'all documents',
    queryPlaceholder: 'What does the document say about...',
    queryButton: 'Query',
    querying: 'Searching…',
    uploadFirst: 'Upload a document first.',
    answer: 'Answer',
    modelLabel: 'model:',
    retrievedSources: 'Retrieved sources',
    pageLabel: 'page',
    chunkLabel: 'chunk',
    scoreLabel: 'score:',
    deleteAria: 'Delete',
    queryFailed: 'Query failed',
    uploadFailed: 'Upload failed',
  },
  stateDemo: {
    label: '// state_inspector',
    title: 'LangGraph State Inspector',
    description:
      "Live view of any thread's persisted state and checkpoint history (Postgres-backed).",
    threadLabel: 'thread:',
    noThreads: 'no threads',
    currentState: 'current state',
    history: 'history',
    errorTitle: 'Could not load thread state.',
    loading: 'loading…',
    empty: 'empty',
    emptySnapshot: 'empty snapshot',
    suspenseLoading: 'loading…',
    messagesLabel: (n: number) => `state.values.messages (${n})`,
    noMessages: 'no messages yet',
    nextNodes: 'next nodes',
    terminal: '∅ (terminal)',
    checkpointId: 'checkpoint id',
    created: 'created',
    checkpointsCount: (n: number) => `${n} checkpoint${n === 1 ? '' : 's'} (newest first)`,
    noCheckpoints: 'no checkpoints yet',
    msgs: 'msgs',
    next: 'next',
  },
}

export type Dictionary = typeof en
