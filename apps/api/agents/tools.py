from datetime import datetime, timezone

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import BaseTool, tool

from core.config import settings
from services.rag import RAGService


@tool
def get_current_datetime() -> str:
    """Return the current UTC date and time in ISO 8601 format.
    Use this whenever the user asks about the current time, date, day of the week,
    or anything that depends on "now"."""
    return datetime.now(timezone.utc).isoformat()


def _make_rag_tool(rag_service: RAGService) -> BaseTool:
    @tool
    async def search_user_documents(
        query: str,
        filename: str | None = None,
        config: RunnableConfig | None = None,
    ) -> str:
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
            return "Error: no user_id in context; RAG search unavailable."

        hits = await rag_service.search(
            query=query,
            user_id=user_id,
            top_k=settings.rag_top_k,
            filename=filename,
        )
        if not hits:
            return "No relevant chunks found in the user's documents."

        formatted = []
        for h in hits:
            header = f"[{h.filename}"
            if h.page is not None:
                header += f", page {h.page}"
            header += f", score {h.score:.2f}]"
            formatted.append(f"{header}\n{h.content}")
        return "\n---\n".join(formatted)

    return search_user_documents


def build_tools(rag_service: RAGService | None = None) -> list[BaseTool]:
    tools: list[BaseTool] = [get_current_datetime]

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
