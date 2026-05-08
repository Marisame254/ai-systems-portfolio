# AI Systems Portfolio

Marisame's AI Systems Engineering portfolio — monorepo with a Next.js portfolio site and FastAPI AI demos.

```
User → Next.js UI → FastAPI Gateway → LangGraph Orchestrator
                                          ├── RAG (pgvector)
                                          ├── Memory (Redis)
                                          └── Agents
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 · Tailwind CSS · shadcn/ui |
| Backend | FastAPI · Python 3.11 · uv |
| AI | LangGraph · Anthropic Claude claude-sonnet-4-6 |
| Database | PostgreSQL 16 + pgvector |
| Cache | Redis 7 |
| Infra | Docker Compose · Turborepo |

## Quick Start

### Prerequisites

- Node.js 22+ · pnpm 10+
- Python 3.11+ · uv
- Docker & Docker Compose

### 1. Environment

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### 2. Start databases

```bash
docker compose up postgres redis -d
```

### 3. Start API

```bash
cd apps/api
uv run uvicorn main:app --reload --port 8000
```

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

| Demo | Description | Status |
|---|---|---|
| AI Chat | Streaming chat with Claude claude-sonnet-4-6 | Live |
| RAG | Document upload + pgvector retrieval | Preview |
| Agent Graph | Interactive LangGraph visualization | Preview |
| Memory | Redis-backed session memory | Preview |

## Development

```bash
# Install all dependencies
pnpm install

# Run all apps in parallel
pnpm dev

# Build everything
pnpm build

# Lint
pnpm lint
```
