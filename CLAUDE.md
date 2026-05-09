# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack & topology

Turborepo monorepo with two apps that talk over HTTP:

- `apps/web` — Next.js 14 (App Router), Tailwind, shadcn/ui, framer-motion, `@xyflow/react` for graph viz. Package name `@portfolio/web`.
- `apps/api` — FastAPI (Python 3.11, managed by `uv`). Routes in `api/routes/{chat,rag,agents,memory}.py`, mounted under `/api/*` in `main.py`. Wheels package list in `pyproject.toml` `[tool.hatch.build.targets.wheel]`: `api`, `core`, `agents`, `services`, `schemas` — new top-level Python modules must be added there or they won't ship.
- Postgres 16 + pgvector, Redis 7. Both started via `docker-compose.yml`.
- LangGraph + LangChain orchestrate the LLM. `core/dependencies.py::get_chat_model()` selects provider by `ENVIRONMENT`: `dev` → Ollama (`llama3.1:8b` via `langchain-ollama`), `prod` → OpenAI (`gpt-4o-mini` via `langchain-openai`). Models/URLs configurable in `apps/api/core/config.py`.

Data flow: Next.js UI → FastAPI gateway → LangGraph orchestrator → {pgvector RAG, Redis memory, agent tools}.

## Common commands

Root (pnpm + Turbo drive only the JS workspace; the Python API is not a Turbo task):

```bash
pnpm install                # install JS deps
pnpm dev                    # turbo dev — runs apps/web only (api is uv-managed)
pnpm build                  # turbo build
pnpm lint                   # turbo lint
pnpm format                 # prettier across ts/tsx/md/json
```

API (`apps/api/`, requires `uv`):

```bash
uv sync                                              # install incl. dev extras
uv run uvicorn main:app --reload --port 8000         # run dev server
uv run pytest                                        # run tests (asyncio_mode=auto)
uv run pytest path/to/test_file.py::test_name        # single test
uv run ruff check .                                  # lint (rules: E, F, I; line-length 100)
uv run ruff format .                                 # format
```

Infra:

```bash
docker compose up postgres redis -d   # just the databases (typical dev flow)
docker compose up --build             # full stack incl. api + web
```

Env: copy `.env.example` to `.env` at repo root and set `ANTHROPIC_API_KEY`. Settings are loaded by `pydantic-settings` from `.env` (case-insensitive).

## Conventions worth knowing

- Frontend talks to the API via `apps/web/src/lib/api.ts`; base URL comes from `NEXT_PUBLIC_API_URL` (defaults assume `http://localhost:8000`).
- CORS allow-list is driven by `settings.cors_origins` — update there (or via `CORS_ORIGINS` env) when adding new frontend origins.
- The API package is flat (no `src/`): imports are `from core.config import settings`, `from api.routes import ...`. Run uvicorn from `apps/api/` so these resolve.
- Ruff is the only Python linter/formatter; there is no separate black/isort config.
