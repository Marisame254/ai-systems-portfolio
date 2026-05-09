from datetime import datetime, timezone

from langchain_core.tools import BaseTool, tool

from core.config import settings


@tool
def get_current_datetime() -> str:
    """Return the current UTC date and time in ISO 8601 format.
    Use this whenever the user asks about the current time, date, day of the week,
    or anything that depends on "now"."""
    return datetime.now(timezone.utc).isoformat()


def build_tools() -> list[BaseTool]:
    tools: list[BaseTool] = [get_current_datetime]

    if settings.tavily_api_key:
        from langchain_tavily import TavilySearch

        tools.append(
            TavilySearch(
                max_results=3,
                tavily_api_key=settings.tavily_api_key,
            )
        )

    return tools
