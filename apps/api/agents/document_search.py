"""Corrective-RAG subgraph that answers the agent's `search_user_documents` tool calls.

    retrieve -> grade_documents -> return_documents
                      |  ^
                      v  |  (nothing relevant and rewrites left)
                 rewrite_query -> retrieve

An LLM grades the retrieved chunks against the question. If none are relevant the query is
rewritten and retrieval runs again, up to `settings.rag_max_rewrites` times. The run ends with
the ToolMessage the agent is waiting for.
"""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import BaseTool
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from agents.llm import internal_config, message_text, parse_json_object
from agents.state import DocumentSearchOutput, DocumentSearchState
from agents.tools import NO_CHUNKS_TEXT, format_hits
from core.config import settings

logger = logging.getLogger(__name__)

GRADE_CHUNK_CHARS = 1200

GRADE_PROMPT = (
    "You grade passages retrieved from a user's documents for a question. A passage is "
    "relevant if it contains information that helps answer the question, even partially. "
    "Passages on the same broad topic that do not help answer it are not relevant.\n\n"
    'Return ONLY a JSON object with the numbers of the relevant passages, e.g. {{"relevant": [1, 3]}}. '
    'Return {{"relevant": []}} if none are relevant.\n\n'
    "Question: {question}\n\nPassages:\n{passages}"
)

REWRITE_PROMPT = (
    "A semantic search over a user's documents found nothing relevant for the query below. "
    "Rewrite it to improve retrieval: use different wording, add likely synonyms or more "
    "specific terms, and keep the original intent and language. "
    "Return ONLY the rewritten query, with no quotes or explanation.\n\n"
    "Query: {query}"
)


def parse_relevant(raw: str, total: int) -> list[int] | None:
    """Zero-based indexes of the passages the grader kept; None when the reply is unusable."""
    data = parse_json_object(raw)
    numbers = data.get("relevant")
    if not isinstance(numbers, list):
        return None
    indexes: list[int] = []
    for n in numbers:
        if isinstance(n, bool) or not isinstance(n, (int, float, str)):
            continue
        try:
            i = int(n) - 1
        except ValueError:
            continue
        if 0 <= i < total and i not in indexes:
            indexes.append(i)
    return indexes


def route_after_grade(state: DocumentSearchState) -> str:
    if state.get("relevant") or state.get("failed"):
        return "return_documents"
    if state["attempts"] > settings.rag_max_rewrites:
        return "return_documents"
    return "rewrite_query"


def build_document_search_graph(model: BaseChatModel, search_tool: BaseTool) -> CompiledStateGraph:
    async def retrieve(state: DocumentSearchState, config: RunnableConfig) -> dict:
        call = state["tool_call"]
        # Invoking with the tool call (not bare args) returns a ToolMessage carrying the artifact.
        result: ToolMessage = await search_tool.ainvoke(
            {**call, "args": {**call["args"], "query": state["query"]}}, config
        )
        artifact = result.artifact if isinstance(result.artifact, dict) else {}
        hits = artifact.get("hits") or []
        return {
            "hits": hits,
            "relevant": [],
            "note": "" if hits else message_text(result),
            "failed": bool(artifact.get("error")),
            "attempts": state["attempts"] + 1,
        }

    async def grade_documents(state: DocumentSearchState) -> dict:
        hits = state.get("hits") or []
        if not hits:
            return {"relevant": []}
        passages = "\n\n".join(
            f"[{i}] {h['content'][:GRADE_CHUNK_CHARS]}" for i, h in enumerate(hits, 1)
        )
        # Grade against what the agent asked for, not against a rewritten query.
        question = str(state["tool_call"]["args"].get("query") or state["query"])
        try:
            reply = await model.ainvoke(
                GRADE_PROMPT.format(question=question, passages=passages),
                config=internal_config("grade_documents"),
            )
            kept = parse_relevant(message_text(reply), len(hits))
        except Exception:  # noqa: BLE001
            logger.exception("grade_documents: grading failed")
            kept = None
        if kept is None:
            # No usable verdict: similarity already filtered these, so pass them through.
            return {"relevant": hits}
        return {"relevant": [hits[i] for i in kept]}

    async def rewrite_query(state: DocumentSearchState) -> dict:
        try:
            reply = await model.ainvoke(
                REWRITE_PROMPT.format(query=state["query"]),
                config=internal_config("rewrite_query"),
            )
            rewritten = message_text(reply).strip().strip('"').strip()
        except Exception:  # noqa: BLE001
            logger.exception("rewrite_query: rewriting failed")
            rewritten = ""
        return {"query": rewritten[:500] or state["query"]}

    async def return_documents(state: DocumentSearchState) -> dict:
        relevant: list[dict[str, Any]] = state.get("relevant") or []
        if relevant:
            content = format_hits(relevant)
        elif state.get("failed"):
            content = state.get("note") or "Error: document search failed."
        else:
            content = NO_CHUNKS_TEXT
        call = state["tool_call"]
        return {
            "messages": [ToolMessage(content=content, tool_call_id=call["id"], name=call["name"])]
        }

    graph = StateGraph(DocumentSearchState, output_schema=DocumentSearchOutput)
    graph.add_node("retrieve", retrieve)
    graph.add_node("grade_documents", grade_documents)
    graph.add_node("rewrite_query", rewrite_query)
    graph.add_node("return_documents", return_documents)

    graph.add_edge(START, "retrieve")
    graph.add_edge("retrieve", "grade_documents")
    graph.add_conditional_edges(
        "grade_documents", route_after_grade, ["rewrite_query", "return_documents"]
    )
    graph.add_edge("rewrite_query", "retrieve")
    graph.add_edge("return_documents", END)

    return graph.compile()
