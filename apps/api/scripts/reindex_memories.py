"""One-off: embed memories written before the store had a vector index.

Run once per database from apps/api:  uv run python -m scripts.reindex_memories
"""

import asyncio

from langgraph.store.postgres.aio import AsyncPostgresStore
from psycopg_pool import AsyncConnectionPool

from core.config import settings
from core.dependencies import get_embeddings

BATCH = 200


async def main() -> None:
    pool = AsyncConnectionPool(
        settings.postgres_dsn, max_size=5, kwargs={"autocommit": True}, open=False
    )
    await pool.open()
    try:
        store = AsyncPostgresStore(
            pool,
            index={"dims": settings.embedding_dim, "embed": get_embeddings(), "fields": ["text"]},
        )
        await store.setup()

        # Read everything before writing: a put bumps updated_at, which would shift the pages.
        items = []
        while True:
            page = await store.asearch(("memories",), limit=BATCH, offset=len(items))
            if not page:
                break
            items.extend(page)

        for item in items:
            # Re-putting the same value makes the store compute and persist its embedding.
            await store.aput(item.namespace, item.key, item.value)
        print(f"Re-indexed {len(items)} memories ({settings.embedding_model}, {settings.embedding_dim}d)")
    finally:
        await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
