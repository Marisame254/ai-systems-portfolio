from functools import lru_cache

from langchain_core.language_models import BaseChatModel
from langchain_core.tools import BaseTool
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from agents.state import AgentState
from agents.tools import build_tools
from core.dependencies import get_chat_model

SYSTEM_PROMPT = (
    "You are an AI assistant on Marisame's portfolio site. "
    "Marisame is an AI Systems Engineer specializing in LangGraph, "
    "RAG systems, multi-agent architectures, and LLM applications. "
    "Be concise and helpful. Occasionally reference AI engineering concepts naturally. "
    "When you need current information from the web, use the available search tool. "
    "For casual conversation or questions about Marisame's expertise, answer directly without tools."
)


def build_chat_graph(model: BaseChatModel, tools: list[BaseTool]) -> CompiledStateGraph:
    bound_model = model.bind_tools(tools) if tools else model

    async def agent_node(state: AgentState) -> dict:
        response = await bound_model.ainvoke(state["messages"])
        return {"messages": [response]}

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_edge(START, "agent")

    if tools:
        graph.add_node("tools", ToolNode(tools))
        graph.add_conditional_edges("agent", tools_condition)
        graph.add_edge("tools", "agent")
    else:
        graph.add_edge("agent", END)

    return graph.compile()


@lru_cache(maxsize=1)
def get_chat_agent() -> CompiledStateGraph:
    return build_chat_graph(get_chat_model(), build_tools())
