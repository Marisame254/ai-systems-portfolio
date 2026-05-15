import type { Dictionary } from './en'

export const es: Dictionary = {
  navbar: {
    home: 'Inicio',
    cv: 'CV',
    demos: 'Demos',
    github: 'github',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    language: 'Idioma',
  },
  footer: {
    builtBy: 'hecho por',
    with: 'con',
  },
  hero: {
    role: 'Ingeniero de Sistemas de IA',
    stack: 'LangGraph · RAG · Multi-Agente · LLM',
    tagline: 'Construyendo IA que piensa en grafos',
  },
  home: {
    viewCv: 'Ver CV',
    exploreDemos: 'Explorar Demos',
    liveDemosLabel: '// demos_en_vivo',
    sectionTitle: 'Sistemas de IA en Acción',
  },
  demosPage: {
    label: '// demos_ia',
    title: 'Demos de Sistemas de IA',
    description:
      'Demostraciones interactivas de patrones de ingeniería de IA — desde chat por streaming hasta grafos multi-agente. Cada demo muestra un patrón de arquitectura real usado en sistemas de IA en producción.',
  },
  demos: {
    openDemo: 'abrir demo',
    badges: {
      live: 'En vivo',
      preview: 'Avance',
    },
    chat: {
      title: 'Playground de Chat con IA',
      description:
        'Chat con streaming y renderizado de tokens en tiempo real. Ollama en desarrollo, OpenAI en producción.',
    },
    rag: {
      title: 'Demo de RAG',
      description:
        'Subí documentos y consultalos usando generación aumentada por recuperación con pgvector.',
    },
    agents: {
      title: 'Visualización de Agentes',
      description:
        'Grafo interactivo de la máquina de estados de LangGraph con trazas de ejecución en vivo.',
    },
    memory: {
      title: 'Demo de Memoria',
      description:
        'Memoria conversacional respaldada por Redis con persistencia de contexto entre sesiones.',
    },
  },
  cv: {
    label: '// curriculum_vitae',
    name: 'Raul Vasquez',
    subtitle: 'Ingeniero de Machine Learning · Sistemas de IA',
    location: 'Oaxaca de Juárez, México',
    sections: {
      summary: '// resumen',
      skills: '// habilidades',
      experience: '// experiencia',
      projects: '// proyectos',
      education: '// educación',
      languages: '// idiomas',
      certifications: '// certificaciones',
    },
    summary:
      'Ingeniero de Machine Learning con sólida experiencia en IA, ingeniería de datos y cloud computing. Especializado en diseñar, optimizar y desplegar sistemas de ML escalables y aplicaciones full-stack. Construyo arquitecturas avanzadas basadas en agentes y sistemas de generación aumentada por recuperación (RAG) con LangChain/LangGraph, integrando orquestación de herramientas, memoria persistente y flujos human-in-the-loop.',
    skillCategories: {
      agents: 'Agentes de IA y Orquestación',
      rag: 'RAG y Búsqueda Vectorial',
      mcp: 'MCP (Model Context Protocol)',
      backend: 'Backend y Datos',
      ml: 'ML y Deep Learning',
      frontend: 'Frontend',
      cloud: 'Cloud y DevOps',
      languages: 'Lenguajes y Herramientas',
    },
    experience: {
      w3b: {
        title: 'Desarrollador Full-Stack e Ingeniero de IA',
        location: 'Remoto',
        period: '2025 – Presente',
        bullets: [
          'Diseñé y desplegué arquitecturas de agentes inteligentes con LangChain y LangGraph — flujos de agentes, orquestación de herramientas, memoria persistente (checkpointer + store en PostgreSQL) y pipelines de decisión estructurada.',
          'Construí sistemas RAG multi-tenant con pgvector y embeddings de Ollama, mejorando la consistencia factual y la trazabilidad de la IA conversacional para clientes empresariales.',
          'Implementé un servidor MCP (fastapi-mcp) que expone herramientas de proyectos, documentos y RAG a agentes externos — con autenticación por API key, permisos con scope y logging de requests.',
          'Desarrollé servicios FastAPI para inferencia de LLM, autenticación, gestión de sesiones y orquestación del ciclo de vida de agentes; diseñé un sistema RBAC polimórfico con herencia de permisos por recurso (organización → proyecto → conversación).',
          'Construí frontends en React + TailwindCSS + React Router v7 con streaming por WebSocket para respuestas en tiempo real, indicadores de uso de herramientas e interrupciones human-in-the-loop.',
        ],
      },
      datyra: {
        title: 'Ingeniero de Machine Learning',
        location: 'San Diego, EE.UU.',
        period: '2022 – 2024',
        groups: {
          ml: {
            heading: 'ML y Modelado de Datos',
            bullets: [
              'Desarrollé y desplegué sistemas de ML escalables con TensorFlow, PyTorch, Scikit-learn y Keras: regresión, clasificación, clustering.',
              'Hice fine-tuning de modelos vision-language y LLM (X-CLIP, LLaMA) para detección de objetos, comprensión semántica y generación de respuestas específicas de dominio.',
              'Construí sistemas basados en LLM para reportes automatizados, análisis estructurado de datos e interfaces conversacionales mediante prompt engineering y pipelines RAG personalizados.',
            ],
          },
          cloud: {
            heading: 'Cloud y Datos',
            bullets: [
              'Gestioné PostgreSQL, MySQL, MongoDB; diseñé arquitecturas escalables en AWS y Azure.',
            ],
          },
          automation: {
            heading: 'Automatización y Despliegue',
            bullets: [
              'Diseñé pipelines automatizados de entrenamiento/validación/despliegue (Python + Bash, CI/CD); desplegué apps containerizadas con Docker y Kubernetes.',
            ],
          },
          software: {
            heading: 'Software y Web',
            bullets: [
              'Implementé servicios GraphQL en Go; integré pagos con Stripe y sistemas de referidos; construí autenticación RBAC segura.',
            ],
          },
          productivity: {
            heading: 'Productividad y Visualización',
            bullets: [
              'Construí dashboards y herramientas internas con Apache Superset, Mercury y Retool; gestioné la segmentación de audiencias con Mailchimp.',
            ],
          },
        },
      },
    },
    projects: {
      portfolio: {
        name: 'AI Systems Portfolio',
        description:
          'Este monorepo — Next.js 14 + FastAPI + LangGraph + pgvector. Demos en vivo de chat por streaming, RAG y visualización de agentes. LLM agnóstico al proveedor (Ollama en dev, OpenAI en prod).',
      },
      lyra: {
        name: 'Lyra',
        description:
          'Agente CLI en Python con integración de herramientas MCP, memoria persistente (filesystem + PostgreSQL), modelos configurables (Ollama local + cloud) y gestión de threads.',
      },
      mcpServers: {
        name: 'mcp-servers',
        description:
          'Plataforma de chat sobre LangGraph + Chainlit + MCP. Usa AsyncPostgresSaver/Store, middleware de resumen / HITL / todo-list, e integración multi-server con MCP.',
      },
      enterpriseRag: {
        name: 'Enterprise RAG Platform',
        description:
          'Proyecto de cliente (anonimizado). Backend en FastAPI con LangGraph SDK; frontend React Router v7 + Tailwind v4. RBAC polimórfico, servidor MCP con API keys, compartir conversaciones, streaming de tokens por WebSocket.',
      },
    },
    education: {
      masters: {
        degree: 'Maestría en Robótica',
        institution: 'Universidad Tecnológica de la Mixteca',
        period: '2019 – 2021',
      },
      bachelors: {
        degree: 'Licenciatura en Mecatrónica',
        institution: 'Universidad Tecnológica de la Mixteca',
        period: '2014 – 2019',
      },
    },
    languages: {
      spanish: { name: 'Español', level: 'Nativo' },
      english: { name: 'Inglés', level: 'Avanzado' },
    },
    certifications: [
      'Applied Data Science with Python Specialization (Mar 2022)',
      "SQL and PostgreSQL: The Complete Developer's Guide (Feb 2022)",
      'IBM Data Engineering Specialization (Feb 2022)',
      'NoSQL, Big Data, and Spark Foundations Specialization (Abr 2022)',
      'BI Foundations with SQL, ETL, and Data Warehousing Specialization (Abr 2022)',
      'Python for Everybody Specialization (Feb 2022)',
    ],
  },
  chatDemo: {
    label: '// playground_chat_ia',
    title: 'Chat con IA',
    subtitleStateful: 'Agente LangGraph · con estado',
    subtitleProvider: (provider: string, model: string) =>
      `LangGraph · ${provider} ${model} · con estado`,
    thread: 'thread',
    threadsHeader: 'threads',
    newChat: 'nuevo chat',
    noThreadsYet: 'aún no hay threads',
    untitled: 'sin título',
    inspectState: 'inspeccionar estado →',
    loadingThread: 'cargando thread…',
    emptyTitle: 'Iniciá una conversación...',
    emptySubtitle: 'Esta conversación persiste entre recargas en Postgres.',
    inputPlaceholder: 'Preguntá lo que quieras sobre sistemas de IA...',
    sendAria: 'Enviar',
    openThreadsAria: 'Abrir threads',
    closeSidebarAria: 'Cerrar panel',
    deleteThreadAria: 'Eliminar thread',
    connectionError: 'Error: No se pudo conectar con la API. ¿Está corriendo el backend?',
    maxThreadsWarning: (n: number) =>
      `máx. ${n} threads — enviar va a eliminar el más viejo`,
    justNow: 'recién',
    minutesAgo: (n: number) => `hace ${n}m`,
    hoursAgo: (n: number) => `hace ${n}h`,
    daysAgo: (n: number) => `hace ${n}d`,
  },
  agentsDemo: {
    label: '// visualización_agente',
    title: 'Grafo de Agente LangGraph',
    subtitlePrefix: 'Agente con tool-calling ·',
    subtitleSuffix: 'loop con arista condicional · cliqueá cualquier nodo para ver detalles',
    loopText: 'agent ↔ tools',
    legend: {
      startEnd: 'inicio / fin',
      llm: 'agente (llm)',
      tools: 'herramientas',
      memory: 'memoria',
      conditional: 'arista condicional',
    },
    errorTitle: 'No se pudo cargar el grafo del agente.',
    errorHint: '¿Está corriendo el backend en /api/agents/graph?',
    loading: 'cargando grafo...',
    closeAria: 'Cerrar',
    panel: {
      provider: 'proveedor',
      model: 'modelo',
      systemPrompt: 'system prompt',
      unknown: 'desconocido',
      boundTools: (n: number) => `herramientas asociadas (${n})`,
      noDescription: 'sin descripción',
      noTools: 'No hay herramientas conectadas. Definí',
      noToolsTail: 'para habilitar búsqueda web.',
      llmDescription:
        'Invoca al LLM con las herramientas asociadas. La respuesta se anexa a state.messages; si contiene tool_calls, la arista condicional rutea a tools.',
      toolDescription:
        'ToolNode ejecuta la herramienta que pidió el LLM y anexa el resultado a state.messages, luego vuelve a agent.',
      builtIn: 'Nodo built-in de LangGraph.',
      role: 'rol',
      behavior: 'comportamiento',
      storage: 'almacenamiento',
      memoryLoad: 'load_memory · pre-agente',
      memorySave: 'save_memory · post-agente',
      memoryDescription:
        'Los nodos de memoria de largo plazo envuelven al agente. load_memory levanta hechos cross-thread del usuario actual y los inyecta como mensaje de sistema; save_memory extrae nuevos hechos durables del último intercambio y los persiste. Ambos no hacen nada si no hay user_id configurado.',
    },
    footer:
      'Cliqueá cualquier nodo para inspeccionarlo: ver el modelo y el system prompt de agent, las herramientas asociadas y sus descripciones para tools, o el rol de __start__ / __end__ en el runtime de LangGraph.',
    inspectState: 'inspeccionar estado →',
  },
  memoryDemo: {
    label: '// demo_memoria',
    title: 'Memoria de Largo Plazo',
    description:
      "Hechos sobre vos que el agente recuerda entre threads. Guardados en Postgres vía AsyncPostgresStore de LangGraph bajo ('memories', user_id).",
    userIdLabel: 'user_id',
    entryCount: (n: number) => `${n} ${n === 1 ? 'entrada' : 'entradas'}`,
    refresh: 'refrescar',
    clearAll: 'borrar todo',
    noEntriesTitle: 'Aún no hay memorias',
    noEntriesHint: 'Chateá con el agente o agregá una entrada abajo.',
    addEntryHeader: 'Agregar Entrada de Memoria',
    addEntryPlaceholder: 'ej. Prefiere respuestas concisas con ejemplos de código',
    addEntryButton: 'Agregar Entrada',
    deleteEntryAria: 'Eliminar memoria',
    errors: {
      load: 'No se pudo alcanzar la API. ¿Está corriendo el backend?',
      add: 'No se pudo agregar la memoria.',
      remove: 'No se pudo eliminar la memoria.',
      clear: 'No se pudieron borrar las memorias.',
    },
    footer:
      'El grafo del agente tiene nodos load_memory y save_memory. En cada turno levanta los hechos relevantes para tu user_id y, tras responder, extrae nuevos hechos durables vía el LLM y los persiste acá.',
  },
  ragDemo: {
    label: '// demo_rag',
    title: 'Demo de RAG',
    descBefore: 'Subí hasta',
    descMiddle:
      'documentos y hacé preguntas ancladas en su contenido. Los mismos documentos están disponibles desde el',
    chatAgent: 'agente del chat',
    descAfter: 'mediante la',
    descToolSuffix: 'tool.',
    pgvector: 'pgvector',
    accepted: 'aceptados:',
    yourDocuments: 'Tus documentos',
    limitReached: 'límite alcanzado',
    embedding: 'embebiendo e indexando…',
    limitDelete: 'Borrá un documento para subir otro',
    uploadDrop: 'Arrastrá un PDF, TXT o MD — o cliqueá para subir',
    loading: 'cargando…',
    noDocs: 'todavía no hay documentos',
    ask: 'Hacé una pregunta',
    filter: 'filtro:',
    allDocuments: 'todos los documentos',
    queryPlaceholder: 'Qué dice el documento sobre...',
    queryButton: 'Consultar',
    querying: 'Buscando…',
    uploadFirst: 'Subí un documento primero.',
    answer: 'Respuesta',
    modelLabel: 'modelo:',
    retrievedSources: 'Fuentes recuperadas',
    pageLabel: 'página',
    chunkLabel: 'fragmento',
    scoreLabel: 'score:',
    deleteAria: 'Borrar',
    queryFailed: 'La consulta falló',
    uploadFailed: 'La subida falló',
  },
  stateDemo: {
    label: '// inspector_estado',
    title: 'Inspector de Estado de LangGraph',
    description:
      'Vista en vivo del estado persistido de cualquier thread y su historial de checkpoints (respaldado por Postgres).',
    threadLabel: 'thread:',
    noThreads: 'no hay threads',
    currentState: 'estado actual',
    history: 'historial',
    errorTitle: 'No se pudo cargar el estado del thread.',
    loading: 'cargando…',
    empty: 'vacío',
    emptySnapshot: 'snapshot vacío',
    suspenseLoading: 'cargando…',
    messagesLabel: (n: number) => `state.values.messages (${n})`,
    noMessages: 'aún no hay mensajes',
    nextNodes: 'próximos nodos',
    terminal: '∅ (terminal)',
    checkpointId: 'id del checkpoint',
    created: 'creado',
    checkpointsCount: (n: number) =>
      `${n} checkpoint${n === 1 ? '' : 's'} (más nuevos primero)`,
    noCheckpoints: 'aún no hay checkpoints',
    msgs: 'msgs',
    next: 'siguiente',
  },
}
