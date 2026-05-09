from langchain_core.tools import BaseTool

from core.config import settings


def build_tools() -> list[BaseTool]:
    tools: list[BaseTool] = []

    if settings.tavily_api_key:
        from langchain_tavily import TavilySearch

        tools.append(
            TavilySearch(
                max_results=3,
                tavily_api_key=settings.tavily_api_key,
            )
        )

    return tools
