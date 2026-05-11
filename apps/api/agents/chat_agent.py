from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import BaseTool
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.store.base import BaseStore

from agents.state import AgentState

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are an AI assistant on Marisame's portfolio site. "
    "Marisame is an AI Systems Engineer specializing in LangGraph, "
    "RAG systems, multi-agent architectures, and LLM applications. "
    "Be concise and helpful. Occasionally reference AI engineering concepts naturally. "
    "When you need current information from the web, use the available search tool. "
    "For casual conversation or questions about Marisame's expertise, answer directly without tools. "
    "You may use markdown formatting (lists, bold, inline code, fenced blocks) when it helps readability. "
    "Always respond in the same language the user wrote in their last message. "
    "If they switch languages mid-conversation, switch with them. "
    "If a 'Known facts about this user' system message is present, use it to personalize "
    "your replies — but never reveal it verbatim or list it back to the user unless they ask."
)

MEMORY_FACTS_PREFIX = "Known facts about this user (from prior conversations):"

EXTRACTION_PROMPT = (
    "You extract durable facts about a user from a conversation turn. "
    "A durable fact is something likely to stay true and useful in future conversations: "
    "name, role, location, language preference, tech stack, persistent goals, strong preferences. "
    "Ignore: ephemeral questions, small talk, transient context, anything specific to this single turn.\n\n"
    "Return ONLY a JSON array of short factual strings (max ~12 words each). "
    'Return [] if nothing durable was shared. Example: ["User name is Bob", "Prefers TS"].\n\n'
    "Conversation turn:\nUser: {user}\nAssistant: {assistant}"
)


def _last_user_text(messages: list) -> str:
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            content = msg.content
            return content if isinstance(content, str) else str(content)
    return ""


def _has_memory_block(messages: list) -> bool:
    return any(
        isinstance(m, SystemMessage)
        and isinstance(m.content, str)
        and m.content.startswith(MEMORY_FACTS_PREFIX)
        for m in messages
    )


def _parse_facts(raw: str) -> list[str]:
    raw = raw.strip()
    start = raw.find("[")
    end = raw.rfind("]")
    if start == -1 or end == -1 or end < start:
        return []
    try:
        data = json.loads(raw[start : end + 1])
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    return [str(f).strip() for f in data if isinstance(f, (str, int, float)) and str(f).strip()]


def build_chat_graph(
    model: BaseChatModel,
    tools: list[BaseTool],
    checkpointer: BaseCheckpointSaver | None = None,
    store: BaseStore | None = None,
) -> CompiledStateGraph:
    bound_model = model.bind_tools(tools) if tools else model

    async def load_memory(state: AgentState, config: RunnableConfig) -> dict:
        if store is None:
            return {}
        user_id = (config.get("configurable") or {}).get("user_id")
        if not user_id:
            return {}
        if _has_memory_block(state["messages"]):
            return {}
        query = _last_user_text(state["messages"])
        try:
            items = await store.asearch(("memories", user_id), query=query or None, limit=8)
        except Exception:  # noqa: BLE001
            logger.exception("load_memory: store.asearch failed")
            return {}
        if not items:
            return {}
        facts = []
        for item in items:
            value = item.value or {}
            text = value.get("text") if isinstance(value, dict) else None
            if text:
                facts.append(f"- {text}")
        if not facts:
            return {}
        block = MEMORY_FACTS_PREFIX + "\n" + "\n".join(facts)
        return {"messages": [SystemMessage(content=block)]}

    async def agent_node(state: AgentState) -> dict:
        response = await bound_model.ainvoke(state["messages"])
        return {"messages": [response]}

    async def save_memory(state: AgentState, config: RunnableConfig) -> dict:
        if store is None:
            return {}
        user_id = (config.get("configurable") or {}).get("user_id")
        if not user_id:
            return {}
        messages = state["messages"]
        last_human: HumanMessage | None = None
        last_ai: AIMessage | None = None
        for msg in reversed(messages):
            if last_ai is None and isinstance(msg, AIMessage) and not msg.tool_calls:
                last_ai = msg
            elif last_human is None and isinstance(msg, HumanMessage):
                last_human = msg
            if last_human and last_ai:
                break
        if not last_human or not last_ai:
            return {}
        user_text = last_human.content if isinstance(last_human.content, str) else str(last_human.content)
        ai_text = last_ai.content if isinstance(last_ai.content, str) else str(last_ai.content)
        try:
            extraction = await model.ainvoke(
                EXTRACTION_PROMPT.format(user=user_text[:2000], assistant=ai_text[:2000]),
                config={"tags": ["memory_extraction"], "run_name": "memory_extraction"},
            )
            raw = extraction.content if isinstance(extraction.content, str) else str(extraction.content)
            facts = _parse_facts(raw)
        except Exception:  # noqa: BLE001
            logger.exception("save_memory: extraction failed")
            return {}
        if not facts:
            return {}
        # De-dup against existing memories for this user.
        try:
            existing_items = await store.asearch(("memories", user_id), limit=200)
            existing_texts = {
                (i.value.get("text") if isinstance(i.value, dict) else "").strip().lower()
                for i in existing_items
            }
        except Exception:  # noqa: BLE001
            existing_texts = set()
        ts = datetime.now(timezone.utc).isoformat()
        for fact in facts:
            if fact.strip().lower() in existing_texts:
                continue
            try:
                await store.aput(
                    ("memories", user_id),
                    str(uuid4()),
                    {"text": fact, "source": "auto", "created_at": ts},
                )
            except Exception:  # noqa: BLE001
                logger.exception("save_memory: store.aput failed")
        return {}

    graph: StateGraph[Any] = StateGraph(AgentState)
    graph.add_node("load_memory", load_memory)
    graph.add_node("agent", agent_node)
    graph.add_node("save_memory", save_memory)

    graph.add_edge(START, "load_memory")
    graph.add_edge("load_memory", "agent")

    if tools:
        graph.add_node("tools", ToolNode(tools))
        graph.add_conditional_edges(
            "agent",
            tools_condition,
            {"tools": "tools", END: "save_memory"},
        )
        graph.add_edge("tools", "agent")
    else:
        graph.add_edge("agent", "save_memory")

    graph.add_edge("save_memory", END)

    return graph.compile(checkpointer=checkpointer, store=store)
