# AI Systems Portfolio

Raul Vasquez's (Marisame) AI Systems Engineering portfolio — monorepo with a Next.js portfolio site and FastAPI AI demos.

```
User → Next.js UI → FastAPI Gateway → LangGraph Orchestrator
                                          ├── RAG (pgvector)
                                          ├── Long-term memory (Postgres store, vector-indexed)
                                          └── Agent tools (web search, document search, profile search)
```

The chat agent's graph (`apps/api/agents/chat_agent.py`):

```
START → guardrail ─block→ refuse → END
            └allow→ load_memory → agent ⇄ tools
                                    ⇅
                                  document_search (subgraph):
                                    retrieve → grade_documents → return_documents
                                        ↑            └→ rewrite_query ┘
                                  agent → save_memory (+ summarize on long threads) → END
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 · Tailwind CSS · React Flow |
| Backend | FastAPI · Python 3.11+ · uv |
| AI | LangGraph · LangChain · Ollama (dev) / OpenAI (prod) |
| Database | PostgreSQL 16 + pgvector |
| Infra | Docker Compose · Turborepo |

## Quick Start

### Prerequisites

- Node.js 22+ · pnpm 10+
- Python 3.11+ · uv
- Docker & Docker Compose
- Ollama for local dev (`ollama pull nomic-embed-text` plus the chat model set in `OLLAMA_MODEL`)

### 1. Environment

```bash
cp .env.example .env
# dev runs on Ollama; set OPENAI_API_KEY and ENVIRONMENT=prod to use OpenAI
```

### 2. Start the database

```bash
docker compose up postgres -d
```

If another Postgres already listens on 5432, set `POSTGRES_PORT=5433` in `.env` and use the same port in `DATABASE_URL`. A `password authentication failed` error at API startup usually means `DATABASE_URL` is reaching that other server.

### 3. Start API

```bash
cd apps/api
uv run uvicorn main:app --reload --port 8000
```

On Windows keep `--reload`: without it uvicorn uses the Proactor event loop, which psycopg's async mode does not support.

### 4. Start frontend

```bash
# From repo root
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Full stack with Docker

```bash
docker compose up --build
```

## Project Structure

```
ai-systems-portfolio/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── api/          # FastAPI backend
├── infrastructure/
│   └── docker/       # Dockerfiles + DB init
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Demos

| Demo | Description |
|---|---|
| AI Chat | LangGraph agent with an input guardrail, tool calling, a corrective-RAG subgraph, conversation summarization, token streaming, persistent threads, and checkpoint branching |
| RAG | Document upload, pgvector retrieval, streamed answers with numbered citations |
| Agent Graph | Interactive view of the agent's graph with a live execution trace |
| Memory | Long-term user facts in the LangGraph Postgres store, retrieved by semantic search |
| State Inspector | Per-thread state and checkpoint history, with rewind |

Public routes that reach an LLM or the embeddings provider are rate-limited per client IP (see `RATE_LIMIT_*` in `.env.example`).

## Development

```bash
# Install JS dependencies
pnpm install

# Run the web app
pnpm dev

# Build / lint the web app
pnpm build
pnpm lint

# API: lint and tests
cd apps/api
uv run ruff check .
uv run pytest
```

If memories were stored before the store had a vector index, embed them once:

```bash
cd apps/api
uv run python -m scripts.reindex_memories
```
