"""In-memory sliding-window rate limiter, used as a FastAPI dependency.

State lives in the process, so limits are per worker. That is enough to keep a public demo
from burning through the LLM budget; it is not a distributed limiter.
"""

import time
from collections import deque
from collections.abc import Awaitable, Callable

from fastapi import HTTPException, Request

from core.config import settings

_MAX_TRACKED_KEYS = 10_000

_hits: dict[tuple[str, str], deque[float]] = {}


def client_ip(request: Request) -> str:
    # Behind a proxy (Railway, Vercel) the socket peer is the proxy; the first hop is the client.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _prune(now: float, window: float) -> None:
    stale = [key for key, hits in _hits.items() if not hits or now - hits[-1] >= window]
    for key in stale:
        del _hits[key]


def rate_limit(scope: str, limit_setting: str) -> Callable[[Request], Awaitable[None]]:
    """Limit a route to `settings.<limit_setting>` requests per window, per client IP."""

    async def dependency(request: Request) -> None:
        limit: int = getattr(settings, limit_setting)
        window = settings.rate_limit_window_seconds
        now = time.monotonic()

        if len(_hits) > _MAX_TRACKED_KEYS:
            _prune(now, window)

        hits = _hits.setdefault((scope, client_ip(request)), deque())
        while hits and now - hits[0] >= window:
            hits.popleft()

        if len(hits) >= limit:
            retry_after = max(1, int(window - (now - hits[0])) + 1)
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Try again in {retry_after}s.",
                headers={"Retry-After": str(retry_after)},
            )
        hits.append(now)

    return dependency
