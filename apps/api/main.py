from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from psycopg_pool import AsyncConnectionPool

from agents.chat_agent import build_chat_graph
from agents.tools import build_tools
from api.routes import agents, chat, memory, rag
from core.config import settings
from core.dependencies import get_chat_model
from services.threads import ensure_schema


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.app_name}")

    pool = AsyncConnectionPool(
        settings.postgres_dsn,
        max_size=20,
        kwargs={"autocommit": True},
        open=False,
    )
    await pool.open()

    saver = AsyncPostgresSaver(pool)
    await saver.setup()
    await ensure_schema(pool)

    app.state.checkpoint_pool = pool
    app.state.chat_agent = build_chat_graph(
        get_chat_model(),
        build_tools(),
        checkpointer=saver,
    )

    try:
        yield
    finally:
        await pool.close()
        print(f"Shutting down {settings.app_name}")


app = FastAPI(
    title="AI Systems Portfolio API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(rag.router, prefix="/api/rag", tags=["rag"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": settings.app_name}
