import logging
from dataclasses import asdict
from datetime import datetime, timezone
from typing import Any

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import BaseTool, tool

from core.config import settings
from services.portfolio import PortfolioSearch, format_sections
from services.rag import RAGError, RAGService

logger = logging.getLogger(__name__)

# Answered by the document_search subgraph instead of the generic ToolNode.
DOCUMENT_TOOL_NAME = "search_user_documents"

NO_CHUNKS_TEXT = "No relevant chunks found in the user's documents."


@tool
def get_current_datetime() -> str:
    """Return the current UTC date and time in ISO 8601 format.
    Use this whenever the user asks about the current time, date, day of the week,
    or anything that depends on "now"."""
    return datetime.now(timezone.utc).isoformat()


def format_hits(hits: list[dict[str, Any]]) -> str:
    formatted = []
    for h in hits:
        header = f"[{h['filename']}"
        if h.get("page") is not None:
            header += f", page {h['page']}"
        header += f", similarity {h['score']:.2f}]"
        formatted.append(f"{header}\n{h['content']}")
    return "\n---\n".join(formatted)


def _make_rag_tool(rag_service: RAGService) -> BaseTool:
    # The artifact carries the raw hits so the document_search subgraph can grade them.
    @tool(response_format="content_and_artifact")
    async def search_user_documents(
        query: str,
        filename: str | None = None,
        config: RunnableConfig = None,  # type: ignore[assignment]  # auto-injected by LangChain
    ) -> tuple[str, dict[str, Any]]:
        """Search the current user's uploaded documents (PDF, TXT, MD) with semantic search.

        Use this whenever the user refers to "my document(s)", "the PDF I uploaded",
        "the file", or asks a factual question that could plausibly be answered from
        their uploaded files. Prefer this over web search when the question is about
        the user's own content.

        Args:
            query: What to search for. Phrase it as a question or topic, not a single keyword.
            filename: Optional. Restrict the search to one filename (e.g. "report.pdf").
                Leave empty to search across all of the user's documents.
        """
        user_id = None
        if config is not None:
            user_id = (config.get("configurable") or {}).get("user_id")
        if not user_id:
            cfg_keys = list(config.keys()) if config is not None else None
            conf_keys = (
                list((config.get("configurable") or {}).keys())
                if config is not None
                else None
            )
            logger.warning(
                "search_user_documents: missing user_id "
                "(config_keys=%s configurable_keys=%s)",
                cfg_keys,
                conf_keys,
            )
            return "Error: no user_id in context; RAG search unavailable.", {"hits": [], "error": True}

        try:
            hits = await rag_service.search(
                query=query,
                user_id=user_id,
                top_k=settings.rag_top_k,
                filename=filename,
            )
        except RAGError as exc:
            return f"Error: {exc}", {"hits": [], "error": True}
        if not hits:
            return NO_CHUNKS_TEXT, {"hits": [], "error": False}

        rows = [asdict(h) for h in hits]
        return format_hits(rows), {"hits": rows, "error": False}

    return search_user_documents


def _make_portfolio_tool(portfolio: PortfolioSearch) -> BaseTool:
    @tool
    async def search_portfolio(query: str) -> str:
        """Search the professional profile of Raul Vasquez (handle: Marisame), the engineer
        this site belongs to: work experience, projects, skills, education, certifications
        and contact details.

        Use this for any question about Raul — his background, what he has built, which
        technologies he works with, or how to reach him — instead of answering from memory.

        Args:
            query: What to look up, phrased as a question or topic.
        """
        return format_sections(await portfolio.search(query))

    return search_portfolio


def build_tools(
    rag_service: RAGService | None = None,
    portfolio: PortfolioSearch | None = None,
) -> list[BaseTool]:
    tools: list[BaseTool] = [get_current_datetime]

    if portfolio is not None:
        tools.append(_make_portfolio_tool(portfolio))

    if rag_service is not None:
        tools.append(_make_rag_tool(rag_service))

    if settings.tavily_api_key:
        from langchain_tavily import TavilySearch

        tools.append(
            TavilySearch(
                max_results=3,
                tavily_api_key=settings.tavily_api_key,
            )
        )

    return tools
