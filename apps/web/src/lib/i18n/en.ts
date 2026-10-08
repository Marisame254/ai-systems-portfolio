export const en = {
  navbar: {
    home: 'Home',
    cv: 'CV',
    demos: 'Demos',
    github: 'GitHub',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    language: 'Language',
  },
  footer: {
    builtWith: 'Built with LangGraph, FastAPI and Next.js.',
    source: 'Source code',
  },
  common: {
    demosCrumb: 'Demos',
    justNow: 'just now',
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    daysAgo: (n: number) => `${n}d ago`,
    loading: 'Loading…',
  },
  home: {
    role: 'AI systems engineer',
    pitch:
      'I design and ship LLM agents that keep state, call tools and answer from your documents. Every demo on this site runs on the same LangGraph and FastAPI backend, so you can try the work instead of reading about it.',
    primaryCta: 'Try the live demos',
    secondaryCta: 'Read my CV',
    graphCaption: 'The graph that runs the chat demo.',
    graphLink: 'Watch it execute',
    graphAlt:
      'Agent graph: start, load_memory, agent, a loop between agent and tools, save_memory, end.',
    buildTitle: 'What I build',
    build: {
      chat: {
        title: 'Agents that use tools',
        body: 'Custom LangGraph state graphs with tool calling and token streaming. Threads are checkpointed in Postgres, so a conversation can be resumed, rewound or branched.',
        link: 'Open the chat demo',
      },
      rag: {
        title: 'Retrieval over private documents',
        body: 'Ingestion, chunking and pgvector search isolated per user, with a relevance threshold and answers that cite the passages they used.',
        link: 'Open the RAG demo',
      },
      memory: {
        title: 'Memory that outlives the conversation',
        body: 'After each turn the agent extracts durable facts about the user and recalls the relevant ones later by semantic search.',
        link: 'Open the memory demo',
      },
    },
    demosTitle: 'Live demos',
    demosIntro: 'Nothing here is mocked. Each demo calls the running API.',
    workTitle: 'Selected work',
    workLink: 'See full experience in the CV',
    contactTitle: 'Get in touch',
    contactBody:
      'I am open to roles and projects building agent and retrieval systems. Email is the fastest way to reach me.',
    emailCta: 'Send an email',
  },
  demosPage: {
    title: 'Live demos',
    description:
      'Five views into one agent backend: chat with it, feed it documents, watch its graph execute, read what it remembers, and inspect its saved state.',
  },
  demos: {
    openDemo: 'Open demo',
    chat: {
      title: 'Agent chat',
      description:
        'Talk to a tool-calling LangGraph agent. It streams tokens, searches the web and your documents, and keeps each thread in Postgres.',
    },
    rag: {
      title: 'Document Q&A',
      description:
        'Upload a PDF or text file and ask about it. Answers stream in with numbered citations to the retrieved passages.',
    },
    agents: {
      title: 'Agent graph',
      description:
        'The agent as LangGraph sees it. Send a message and watch each node light up as it runs.',
    },
    memory: {
      title: 'Long-term memory',
      description:
        'Facts the agent has learned about you across conversations, stored in Postgres and recalled by semantic search.',
    },
    state: {
      title: 'State inspector',
      description:
        'Open any thread to read its saved state and checkpoint history, then continue the chat from an earlier point.',
    },
  },
  cv: {
    name: 'Raul Vasquez',
    subtitle: 'Machine Learning Engineer · AI Systems',
    location: 'Oaxaca de Juárez, México',
    sections: {
      summary: 'Summary',
      skills: 'Skills',
      experience: 'Experience',
      projects: 'Projects',
      education: 'Education',
      languages: 'Languages',
      certifications: 'Certifications',
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
    subtitleStateful: 'LangGraph agent with saved threads',
    subtitleProvider: (provider: string, model: string) =>
      `LangGraph agent on ${provider} ${model}`,
    thread: 'thread',
    threadsHeader: 'Threads',
    newChat: 'New chat',
    noThreadsYet: 'No threads yet',
    untitled: 'Untitled',
    inspectState: 'Inspect saved state',
    loadingThread: 'Loading thread…',
    emptyTitle: 'Ask the agent something',
    emptySubtitle: 'Threads are saved in Postgres and survive a reload.',
    suggestions: [
      'What tools do you have, and when do you use each one?',
      'Search the web for the latest LangGraph release and summarize it.',
      'Summarize the document I uploaded in the Document Q&A demo.',
      'I work mostly in Python and prefer short answers. Remember that.',
    ],
    inputPlaceholder: 'Message the agent',
    inputHint: 'Enter to send, Shift+Enter for a new line',
    sendAria: 'Send message',
    stop: 'Stop',
    savingMemory: 'Saving memory…',
    openThreadsAria: 'Open threads',
    closeSidebarAria: 'Close threads',
    deleteThreadAria: 'Delete thread',
    connectionError: 'Could not reach the API. Check that the backend is running.',
    streamError: 'The agent failed while generating this reply. Send the message again.',
    maxThreadsWarning: (n: number) =>
      `You have ${n} threads. Sending this message deletes the oldest one.`,
    branchBanner: 'Your next message starts a new branch from this checkpoint.',
    branchCancel: 'Cancel',
    branchLoadFailed: 'Could not load that checkpoint. Showing the latest state instead.',
  },
  agentsDemo: {
    title: 'Agent graph',
    description:
      'This is the compiled LangGraph the chat demo runs. Select a node to see what it does, or send a message below and follow the execution.',
    legend: {
      startEnd: 'start / end',
      llm: 'agent (LLM)',
      tools: 'tools',
      memory: 'memory',
      conditional: 'conditional edge',
    },
    errorTitle: 'Could not load the agent graph.',
    errorHint: 'Check that the backend is running and reachable.',
    loading: 'Loading graph…',
    closeAria: 'Close details',
    run: {
      title: 'Run a message through the graph',
      placeholder: 'e.g. What time is it in UTC?',
      button: 'Run',
      stop: 'Stop',
      hint: 'Runs in a throwaway thread that is deleted afterwards.',
      logTitle: 'Execution trace',
      logEmpty: 'Run a message to see each node and how long it took.',
      running: 'running',
      answerLabel: 'Reply',
      failed: 'The run failed. Check that the backend and the model are reachable.',
    },
    panel: {
      provider: 'Provider',
      model: 'Model',
      systemPrompt: 'System prompt',
      unknown: 'unknown',
      boundTools: (n: number) => `Bound tools (${n})`,
      noDescription: 'No description',
      noTools: 'No tools are bound.',
      llmDescription:
        'Invokes the LLM with the bound tools. The response is appended to state.messages; if it contains tool_calls, the conditional edge routes to tools.',
      toolDescription:
        'ToolNode executes whichever tool the LLM requested and appends the result to state.messages, then loops back to agent.',
      builtIn: 'Built-in LangGraph node.',
      role: 'Role',
      behavior: 'Behavior',
      storage: 'Storage',
      memoryLoad: 'Runs before the agent',
      memorySave: 'Runs after the agent',
      memoryDescription:
        'The memory nodes wrap the agent step. load_memory searches the store for facts relevant to the latest message and injects them as a system message; save_memory extracts new durable facts from the exchange and persists them. Both do nothing without a user_id.',
    },
    inspectState: 'Inspect saved state',
  },
  memoryDemo: {
    title: 'Long-term memory',
    description:
      'Facts the agent remembers about you across threads. They live in the LangGraph Postgres store with a vector index, so each turn recalls the ones closest to what you just asked.',
    userIdLabel: 'Your anonymous user id',
    entryCount: (n: number) => `${n} ${n === 1 ? 'entry' : 'entries'}`,
    refresh: 'Refresh',
    clearAll: 'Delete all',
    noEntriesTitle: 'No memories yet',
    noEntriesHint: 'Tell the agent something about yourself in the chat, or add an entry below.',
    addEntryHeader: 'Add a memory',
    addEntryPlaceholder: 'e.g. Prefers concise answers with code examples',
    addEntryButton: 'Add memory',
    deleteEntryAria: 'Delete memory',
    sourceAuto: 'Extracted by the agent',
    sourceManual: 'Added by you',
    errors: {
      load: 'Could not load memories. Check that the backend is running.',
      add: 'Could not add the memory.',
      remove: 'Could not delete the memory.',
      clear: 'Could not delete the memories.',
    },
  },
  ragDemo: {
    title: 'Document Q&A',
    descBefore: 'Upload up to',
    descMiddle:
      'documents and ask questions answered only from their content. The same documents are available to the',
    chatAgent: 'chat agent',
    descAfter: 'through its',
    descToolSuffix: 'tool.',
    accepted: 'Accepted:',
    yourDocuments: 'Your documents',
    limitReached: 'Limit reached',
    embedding: 'Embedding and indexing…',
    limitDelete: 'Delete a document to upload another',
    uploadDrop: 'Drop a PDF, TXT or MD file here, or click to choose one',
    noDocs: 'No documents yet',
    chunks: (n: number) => `${n} ${n === 1 ? 'chunk' : 'chunks'}`,
    ask: 'Ask a question',
    filter: 'Search in',
    allDocuments: 'All documents',
    queryPlaceholder: 'What does the document say about…',
    queryButton: 'Ask',
    querying: 'Searching…',
    stop: 'Stop',
    uploadFirst: 'Upload a document to start asking.',
    answer: 'Answer',
    modelLabel: 'Generated by',
    noRelevant:
      'Nothing in your documents was relevant enough to answer that. Rephrase the question or upload a document that covers it.',
    retrievedSources: 'Retrieved passages',
    sourcesHint: 'Select a citation in the answer to jump to its passage.',
    pageLabel: 'page',
    chunkLabel: 'chunk',
    similarity: 'match',
    citationAria: (n: number) => `Go to passage ${n}`,
    deleteAria: 'Delete',
    queryFailed: 'The question could not be answered. Try again.',
    uploadFailed: 'The upload failed. Try again.',
    deleteFailed: 'Could not delete the document.',
    listFailed: 'Could not load your documents. Check that the backend is running.',
  },
  stateDemo: {
    title: 'State inspector',
    description:
      'Read the state LangGraph saved for a thread and step through its checkpoint history. Any checkpoint can be reopened in the chat to branch from it.',
    threadLabel: 'Thread',
    noThreads: 'No threads yet. Start one in the chat demo.',
    currentState: 'Current state',
    history: 'History',
    errorTitle: 'Could not load the thread state.',
    loading: 'Loading…',
    empty: 'Nothing saved for this thread yet.',
    emptySnapshot: 'This checkpoint has no messages.',
    messagesLabel: (n: number) => `state.values.messages (${n})`,
    noMessages: 'No messages yet',
    nextNodes: 'Next nodes',
    terminal: 'none (finished)',
    checkpointId: 'Checkpoint id',
    created: 'Created',
    checkpointsCount: (n: number) => `${n} checkpoint${n === 1 ? '' : 's'}, newest first`,
    noCheckpoints: 'No checkpoints yet',
    msgs: 'messages',
    next: 'next',
    rewindHere: 'Continue from here',
    rewindAria: 'Continue the chat from this checkpoint',
    rewindDisabled: 'This checkpoint cannot be reopened',
  },
}

export type Dictionary = typeof en
