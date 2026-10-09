import type { Dictionary } from './en'

export const es: Dictionary = {
  navbar: {
    home: 'Inicio',
    cv: 'CV',
    demos: 'Demos',
    github: 'GitHub',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    language: 'Idioma',
  },
  footer: {
    builtWith: 'Hecho con LangGraph, FastAPI y Next.js.',
    source: 'Código fuente',
  },
  common: {
    demosCrumb: 'Demos',
    justNow: 'ahora mismo',
    minutesAgo: (n: number) => `hace ${n} min`,
    hoursAgo: (n: number) => `hace ${n} h`,
    daysAgo: (n: number) => `hace ${n} d`,
    loading: 'Cargando…',
  },
  home: {
    role: 'Ingeniero de sistemas de IA',
    pitch:
      'Diseño y pongo en producción agentes LLM que mantienen estado, usan herramientas y responden a partir de tus documentos. Todos los demos de este sitio corren sobre el mismo backend de LangGraph y FastAPI, así que puedes probar el trabajo en lugar de solo leer sobre él.',
    primaryCta: 'Probar los demos',
    secondaryCta: 'Ver mi CV',
    graphCaption: 'El grafo que ejecuta el demo de chat.',
    graphLink: 'Verlo en ejecución',
    graphAlt:
      'Grafo del agente: inicio, luego un guardrail que rechaza o continúa a load_memory y agent. El agente hace ciclos con tools y con el subgrafo document_search (retrieve, grade_documents, rewrite_query, return_documents), y termina pasando por save_memory y summarize.',
    buildTitle: 'Qué construyo',
    build: {
      chat: {
        title: 'Agentes que usan herramientas',
        body: 'Grafos de estado propios en LangGraph con tool calling y streaming de tokens. Los hilos se guardan como checkpoints en Postgres, así que una conversación se puede retomar, rebobinar o ramificar.',
        link: 'Abrir el demo de chat',
      },
      rag: {
        title: 'Recuperación sobre documentos privados',
        body: 'Ingesta, fragmentación y búsqueda con pgvector aislada por usuario, con umbral de relevancia y respuestas que citan los pasajes que usaron.',
        link: 'Abrir el demo de RAG',
      },
      memory: {
        title: 'Memoria que sobrevive a la conversación',
        body: 'Después de cada turno el agente extrae hechos duraderos sobre el usuario y más adelante recupera los relevantes con búsqueda semántica.',
        link: 'Abrir el demo de memoria',
      },
    },
    demosTitle: 'Demos en vivo',
    demosIntro: 'Nada está simulado. Cada demo llama a la API en ejecución.',
    workTitle: 'Trabajo seleccionado',
    workLink: 'Ver toda la experiencia en el CV',
    contactTitle: 'Contacto',
    contactBody:
      'Estoy abierto a puestos y proyectos de sistemas de agentes y recuperación. El correo es la forma más rápida de escribirme.',
    emailCta: 'Enviar un correo',
  },
  demosPage: {
    title: 'Demos en vivo',
    description:
      'Cinco vistas de un mismo backend de agentes: conversa con él, dale documentos, mira su grafo ejecutarse, lee lo que recuerda e inspecciona su estado guardado.',
  },
  demos: {
    openDemo: 'Abrir demo',
    chat: {
      title: 'Chat con el agente',
      description:
        'Habla con un agente de LangGraph con tool calling. Transmite tokens, busca en la web y en tus documentos, y guarda cada hilo en Postgres.',
    },
    rag: {
      title: 'Preguntas sobre documentos',
      description:
        'Sube un PDF o archivo de texto y pregunta sobre él. Las respuestas llegan en streaming con citas numeradas a los pasajes recuperados.',
    },
    agents: {
      title: 'Grafo del agente',
      description:
        'El agente tal como lo ve LangGraph. Envía un mensaje y mira cómo se ilumina cada nodo al ejecutarse.',
    },
    memory: {
      title: 'Memoria de largo plazo',
      description:
        'Hechos que el agente ha aprendido sobre ti entre conversaciones, guardados en Postgres y recuperados con búsqueda semántica.',
    },
    state: {
      title: 'Inspector de estado',
      description:
        'Abre cualquier hilo para leer su estado guardado y su historial de checkpoints, y continúa el chat desde un punto anterior.',
    },
  },
  cv: {
    name: 'Raul Vasquez',
    subtitle: 'Ingeniero de Machine Learning · Sistemas de IA',
    location: 'Oaxaca de Juárez, México',
    sections: {
      summary: 'Resumen',
      skills: 'Habilidades',
      experience: 'Experiencia',
      projects: 'Proyectos',
      education: 'Educación',
      languages: 'Idiomas',
      certifications: 'Certificaciones',
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
    subtitleStateful: 'Agente LangGraph con hilos guardados',
    subtitleProvider: (provider: string, model: string) =>
      `Agente LangGraph sobre ${provider} ${model}`,
    thread: 'hilo',
    threadsHeader: 'Hilos',
    newChat: 'Nuevo chat',
    noThreadsYet: 'Aún no hay hilos',
    untitled: 'Sin título',
    inspectState: 'Inspeccionar estado guardado',
    loadingThread: 'Cargando hilo…',
    emptyTitle: 'Pregúntale algo al agente',
    emptySubtitle: 'Los hilos se guardan en Postgres y sobreviven a una recarga.',
    suggestions: [
      '¿Qué ha construido Raúl con LangGraph y RAG?',
      'Busca en la web la última versión de LangGraph y resúmela.',
      'Resume el documento que subí en el demo de preguntas sobre documentos.',
      'Trabajo sobre todo en Python y prefiero respuestas cortas. Recuérdalo.',
    ],
    inputPlaceholder: 'Escribe un mensaje al agente',
    inputHint: 'Enter para enviar, Shift+Enter para nueva línea',
    sendAria: 'Enviar mensaje',
    stop: 'Detener',
    savingMemory: 'Guardando memoria…',
    openThreadsAria: 'Abrir hilos',
    closeSidebarAria: 'Cerrar hilos',
    deleteThreadAria: 'Eliminar hilo',
    connectionError: 'No se pudo conectar con la API. Revisa que el backend esté corriendo.',
    streamError: 'El agente falló al generar esta respuesta. Envía el mensaje de nuevo.',
    maxThreadsWarning: (n: number) =>
      `Tienes ${n} hilos. Al enviar este mensaje se elimina el más antiguo.`,
    branchBanner: 'Tu próximo mensaje crea una rama nueva desde este checkpoint.',
    branchCancel: 'Cancelar',
    branchLoadFailed: 'No se pudo cargar ese checkpoint. Se muestra el estado más reciente.',
  },
  agentsDemo: {
    title: 'Grafo del agente',
    description:
      'Este es el grafo compilado de LangGraph que ejecuta el demo de chat. Selecciona un nodo para ver qué hace, o envía un mensaje abajo y sigue la ejecución.',
    legend: {
      startEnd: 'inicio / fin',
      llm: 'agente (LLM)',
      tools: 'herramientas',
      memory: 'memoria',
      guard: 'guardrail',
      rag: 'recuperación de documentos',
      conditional: 'arista condicional',
    },
    subgraphLabel: (name: string) => `subgrafo: ${name}`,
    errorTitle: 'No se pudo cargar el grafo del agente.',
    errorHint: 'Revisa que el backend esté corriendo y sea accesible.',
    loading: 'Cargando grafo…',
    closeAria: 'Cerrar detalles',
    run: {
      title: 'Ejecuta un mensaje en el grafo',
      placeholder: 'ej. ¿Qué ha construido Raúl con LangGraph?',
      button: 'Ejecutar',
      stop: 'Detener',
      hint: 'Corre en un hilo desechable que se elimina al terminar.',
      logTitle: 'Traza de ejecución',
      logEmpty: 'Ejecuta un mensaje para ver cada nodo y cuánto tardó.',
      running: 'en ejecución',
      answerLabel: 'Respuesta',
      failed: 'La ejecución falló. Revisa que el backend y el modelo sean accesibles.',
    },
    panel: {
      provider: 'Proveedor',
      model: 'Modelo',
      systemPrompt: 'System prompt',
      unknown: 'desconocido',
      boundTools: (n: number) => `Herramientas asociadas (${n})`,
      noDescription: 'Sin descripción',
      noTools: 'No hay herramientas asociadas.',
      llmDescription:
        'Invoca al LLM con las herramientas asociadas. Si la respuesta trae tool calls, las búsquedas en documentos van al subgrafo document_search y el resto a tools, en paralelo. Una respuesta final va a save_memory, y también a summarize cuando el hilo ya es largo.',
      toolDescription:
        'ToolNode ejecuta las herramientas que pidió el LLM y agrega los resultados a state.messages; luego vuelve a agent. search_user_documents no aparece aquí: la responde el subgrafo document_search.',
      builtIn: 'Nodo integrado de LangGraph.',
      partOf: 'Subgrafo',
      storage: 'Almacenamiento',
      memoryDescription:
        'Los nodos de memoria envuelven el paso del agente. load_memory busca en el store los hechos relevantes al último mensaje y los inyecta como mensaje de sistema; save_memory extrae nuevos hechos duraderos del intercambio y los guarda. Ninguno hace nada sin un user_id.',
    },
    inspectState: 'Inspeccionar estado guardado',
  },
  memoryDemo: {
    title: 'Memoria de largo plazo',
    description:
      'Hechos que el agente recuerda sobre ti entre hilos. Viven en el store de Postgres de LangGraph con un índice vectorial, así que cada turno recupera los más cercanos a lo que acabas de preguntar.',
    userIdLabel: 'Tu id de usuario anónimo',
    entryCount: (n: number) => `${n} ${n === 1 ? 'entrada' : 'entradas'}`,
    refresh: 'Actualizar',
    clearAll: 'Eliminar todo',
    noEntriesTitle: 'Aún no hay memorias',
    noEntriesHint: 'Cuéntale algo sobre ti al agente en el chat, o agrega una entrada abajo.',
    addEntryHeader: 'Agregar una memoria',
    addEntryPlaceholder: 'ej. Prefiere respuestas concisas con ejemplos de código',
    addEntryButton: 'Agregar memoria',
    deleteEntryAria: 'Eliminar memoria',
    sourceAuto: 'Extraída por el agente',
    sourceManual: 'Agregada por ti',
    errors: {
      load: 'No se pudieron cargar las memorias. Revisa que el backend esté corriendo.',
      add: 'No se pudo agregar la memoria.',
      remove: 'No se pudo eliminar la memoria.',
      clear: 'No se pudieron eliminar las memorias.',
    },
  },
  ragDemo: {
    title: 'Preguntas sobre documentos',
    descBefore: 'Sube hasta',
    descMiddle:
      'documentos y haz preguntas que se responden solo con su contenido. Los mismos documentos están disponibles para el',
    chatAgent: 'agente del chat',
    descAfter: 'mediante su herramienta',
    descToolSuffix: '.',
    accepted: 'Aceptados:',
    yourDocuments: 'Tus documentos',
    limitReached: 'Límite alcanzado',
    embedding: 'Generando embeddings e indexando…',
    limitDelete: 'Elimina un documento para subir otro',
    uploadDrop: 'Arrastra aquí un PDF, TXT o MD, o haz clic para elegir uno',
    noDocs: 'Aún no hay documentos',
    chunks: (n: number) => `${n} ${n === 1 ? 'fragmento' : 'fragmentos'}`,
    ask: 'Haz una pregunta',
    filter: 'Buscar en',
    allDocuments: 'Todos los documentos',
    queryPlaceholder: 'Qué dice el documento sobre…',
    queryButton: 'Preguntar',
    querying: 'Buscando…',
    stop: 'Detener',
    uploadFirst: 'Sube un documento para empezar a preguntar.',
    answer: 'Respuesta',
    modelLabel: 'Generada por',
    noRelevant:
      'Nada en tus documentos fue lo bastante relevante para responder eso. Reformula la pregunta o sube un documento que lo cubra.',
    retrievedSources: 'Pasajes recuperados',
    sourcesHint: 'Selecciona una cita en la respuesta para ir a su pasaje.',
    pageLabel: 'página',
    chunkLabel: 'fragmento',
    similarity: 'coincidencia',
    citationAria: (n: number) => `Ir al pasaje ${n}`,
    deleteAria: 'Eliminar',
    queryFailed: 'No se pudo responder la pregunta. Inténtalo de nuevo.',
    uploadFailed: 'La subida falló. Inténtalo de nuevo.',
    deleteFailed: 'No se pudo eliminar el documento.',
    listFailed: 'No se pudieron cargar tus documentos. Revisa que el backend esté corriendo.',
  },
  stateDemo: {
    title: 'Inspector de estado',
    description:
      'Lee el estado que LangGraph guardó para un hilo y recorre su historial de checkpoints. Cualquier checkpoint se puede reabrir en el chat para ramificar desde ahí.',
    threadLabel: 'Hilo',
    noThreads: 'Aún no hay hilos. Empieza uno en el demo de chat.',
    currentState: 'Estado actual',
    history: 'Historial',
    errorTitle: 'No se pudo cargar el estado del hilo.',
    loading: 'Cargando…',
    empty: 'Aún no hay nada guardado para este hilo.',
    emptySnapshot: 'Este checkpoint no tiene mensajes.',
    messagesLabel: (n: number) => `state.values.messages (${n})`,
    noMessages: 'Aún no hay mensajes',
    summaryLabel: 'state.values.summary',
    summaryHint: 'Los turnos antiguos se condensan en este resumen. El modelo lo recibe en su lugar.',
    nextNodes: 'Próximos nodos',
    terminal: 'ninguno (terminado)',
    checkpointId: 'Id del checkpoint',
    created: 'Creado',
    checkpointsCount: (n: number) =>
      `${n} checkpoint${n === 1 ? '' : 's'}, del más nuevo al más antiguo`,
    noCheckpoints: 'Aún no hay checkpoints',
    msgs: 'mensajes',
    next: 'siguiente',
    rewindHere: 'Continuar desde aquí',
    rewindAria: 'Continuar el chat desde este checkpoint',
    rewindDisabled: 'Este checkpoint no se puede reabrir',
  },
}
