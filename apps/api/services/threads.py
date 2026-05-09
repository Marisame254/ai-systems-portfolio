from typing import Any

from psycopg_pool import AsyncConnectionPool

DDL = """
CREATE TABLE IF NOT EXISTS chat_threads (
    thread_id   TEXT PRIMARY KEY,
    title       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""


async def ensure_schema(pool: AsyncConnectionPool) -> None:
    async with pool.connection() as conn, conn.cursor() as cur:
        await cur.execute(DDL)


async def list_threads(pool: AsyncConnectionPool, limit: int = 50) -> list[dict[str, Any]]:
    async with pool.connection() as conn, conn.cursor() as cur:
        await cur.execute(
            "SELECT thread_id, title, created_at, updated_at "
            "FROM chat_threads ORDER BY updated_at DESC LIMIT %s",
            (limit,),
        )
        rows = await cur.fetchall()
    return [
        {
            "thread_id": r[0],
            "title": r[1],
            "created_at": r[2].isoformat() if r[2] else None,
            "updated_at": r[3].isoformat() if r[3] else None,
        }
        for r in rows
    ]


async def upsert_thread(
    pool: AsyncConnectionPool, thread_id: str, title: str | None = None
) -> None:
    async with pool.connection() as conn, conn.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO chat_threads (thread_id, title)
            VALUES (%s, %s)
            ON CONFLICT (thread_id) DO UPDATE
            SET updated_at = NOW(),
                title = COALESCE(chat_threads.title, EXCLUDED.title)
            """,
            (thread_id, title),
        )


async def delete_thread_row(pool: AsyncConnectionPool, thread_id: str) -> None:
    async with pool.connection() as conn, conn.cursor() as cur:
        await cur.execute("DELETE FROM chat_threads WHERE thread_id = %s", (thread_id,))
