from typing import Annotated, Any, NotRequired, TypedDict

from langchain_core.messages import AnyMessage, ToolCall
from langgraph.graph.message import add_messages


class GuardrailVerdict(TypedDict):
    verdict: str  # "allow" | "block"
    reason: str


class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    # Set by the guardrail node on every turn.
    guardrail: NotRequired[GuardrailVerdict]
    # Rolling summary of the turns before `summary_cutoff`. Messages are never deleted: the
    # agent is sent the summary plus the messages from the cutoff on, and the thread keeps
    # its full history for the UI and for checkpoint rewinds.
    summary: NotRequired[str]
    summary_cutoff: NotRequired[str]  # id of the first message still sent verbatim


class DocumentSearchState(TypedDict):
    """State of one document_search run, started per `search_user_documents` tool call."""

    tool_call: ToolCall
    query: str  # current search query; replaced by rewrite_query
    attempts: int  # retrievals done so far
    hits: NotRequired[list[dict[str, Any]]]
    relevant: NotRequired[list[dict[str, Any]]]
    note: NotRequired[str]  # the tool's own text when it returned no hits
    failed: NotRequired[bool]  # search itself errored; rewriting the query will not help
    messages: Annotated[list[AnyMessage], add_messages]


class DocumentSearchOutput(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
