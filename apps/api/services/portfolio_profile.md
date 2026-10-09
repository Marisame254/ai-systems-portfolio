# Raul Vasquez

Source for the `search_portfolio` agent tool. Each `##` section is indexed as one passage.
Keep it in sync with the CV in apps/web (src/lib/i18n/*.ts and src/app/cv/page.tsx).

## Summary

Raul Vasquez (handle: Marisame) is a Machine Learning Engineer and AI Systems Engineer based in Oaxaca de Juárez, México. He has solid experience in AI, data engineering, and cloud computing, and specializes in designing, optimizing, and deploying scalable ML systems and full-stack applications. He builds agent-based architectures and retrieval-augmented generation (RAG) systems with LangChain and LangGraph, integrating tool orchestration, persistent memory, and human-in-the-loop workflows.

## Contact

Email: rulivas26@gmail.com. GitHub: https://github.com/marisame254. Portfolio site: https://marisame.dev. Source code of this portfolio: https://github.com/Marisame254/ai-systems-portfolio. Location: Oaxaca de Juárez, México; works remotely.

## Experience: Full-Stack Developer & AI Engineer at W3bInnovation (2025 – present, remote)

- Designed and deployed intelligent-agent architectures with LangChain and LangGraph: agent workflows, tool orchestration, persistent memory (PostgreSQL checkpointer + store), and structured decision pipelines.
- Built multi-tenant RAG systems with pgvector and Ollama embeddings, improving factual consistency and traceability of conversational AI for enterprise clients.
- Implemented an MCP server (fastapi-mcp) exposing project, document, and RAG tools to external agents, with API-key authentication, scoped permissions, and request logging.
- Developed FastAPI services for LLM inference, authentication, session management, and agent lifecycle orchestration; designed a polymorphic RBAC system with resource-grant inheritance (organization → project → conversation).
- Built React + TailwindCSS + React Router v7 frontends with WebSocket streaming for real-time agent token responses, tool-use indicators, and human-in-the-loop interrupts.

## Experience: Machine Learning Engineer at Datyra (2022 – 2024, San Diego, USA)

- ML and data modeling: developed and deployed scalable ML systems with TensorFlow, PyTorch, Scikit-learn, and Keras (regression, classification, clustering). Fine-tuned vision-language and LLM models (X-CLIP, LLaMA) for object detection, semantic understanding, and domain-specific response generation. Built LLM-powered systems for automated reporting, structured data analysis, and conversational interfaces using prompt engineering and customized RAG pipelines.
- Cloud and data: managed PostgreSQL, MySQL, and MongoDB; designed scalable architectures on AWS and Azure.
- Automation and deployment: designed automated training, validation, and deployment pipelines (Python + Bash, CI/CD); deployed containerized apps with Docker and Kubernetes.
- Software and web: implemented GraphQL services in Go, integrated Stripe payments and referral systems, built secure RBAC authentication.
- Productivity and visualization: built dashboards and internal tools with Apache Superset, Mercury, and Retool; managed audience segmentation with Mailchimp.

## Projects

- Lyra: Python CLI agent with MCP tool integration, persistent memory (filesystem + PostgreSQL), configurable models (Ollama local and cloud), and thread management. Tech: Python, DeepAgents, MCP, Ollama, PostgreSQL.
- mcp-servers: chat platform on LangGraph + Chainlit + MCP. Uses AsyncPostgresSaver/Store, summarization, human-in-the-loop and todo-list middleware, and multi-server MCP integration. Tech: LangGraph, Chainlit, MCP, Ollama, PostgreSQL.
- Enterprise RAG Platform: client project (anonymized). FastAPI backend with the LangGraph SDK; React Router v7 + Tailwind v4 frontend. Polymorphic RBAC, MCP server with API keys, conversation sharing, WebSocket token streaming. Tech: FastAPI, LangGraph SDK, React Router v7, pgvector, fastapi-mcp.
- AI Systems Portfolio (this site): Next.js frontend and FastAPI backend running a LangGraph agent with a guardrail, long-term semantic memory, a corrective-RAG subgraph over uploaded documents, conversation summarization, and a live execution trace.

## Skills: AI agents, RAG and MCP

- AI agents and orchestration: LangGraph (checkpointer, store, HITL middleware), LangChain agents (deepagents, create_agent), tool orchestration and multi-step reasoning, streaming token responses (SSE / WebSocket).
- RAG and vector search: pgvector, Chromadb, Hugging Face and Ollama embeddings, hybrid retrieval, document chunking and ingestion.
- MCP (Model Context Protocol): MCP servers (fastapi-mcp, FastMCP), MCP clients (MultiServerMCPClient), MCP OAuth and API-key authentication.

## Skills: backend, ML, frontend and cloud

- Backend and data: FastAPI, SQLAlchemy async + asyncpg, Alembic, PostgreSQL, Supabase, Redis, JWT + refresh tokens, polymorphic RBAC, multi-tenant architecture.
- ML and deep learning: TensorFlow, PyTorch, Scikit-learn, Keras, vision-language models (X-CLIP), LLM fine-tuning (LLaMA), prompt engineering.
- Frontend: React, Next.js (App Router), React Router v7, TailwindCSS, TypeScript.
- Cloud and DevOps: AWS, Docker, Kubernetes, CI/CD (Python + Bash).
- Languages and tools: Python, TypeScript, Go (GraphQL), SQL, uv, pnpm, Git.

## Education, languages and certifications

- Master in Robotics, Universidad Tecnológica de la Mixteca (2019 – 2021).
- Bachelor in Mechatronics, Universidad Tecnológica de la Mixteca (2014 – 2019).
- Languages: Spanish (native), English (proficient).
- Certifications: Applied Data Science with Python Specialization (Mar 2022); SQL and PostgreSQL: The Complete Developer's Guide (Feb 2022); IBM Data Engineering Specialization (Feb 2022); NoSQL, Big Data, and Spark Foundations Specialization (Apr 2022); BI Foundations with SQL, ETL, and Data Warehousing Specialization (Apr 2022); Python for Everybody Specialization (Feb 2022).
