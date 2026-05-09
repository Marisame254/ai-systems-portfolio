from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage


def _message_type(msg: BaseMessage) -> str:
    if isinstance(msg, HumanMessage):
        return "human"
    if isinstance(msg, AIMessage):
        return "ai"
    if isinstance(msg, ToolMessage):
        return "tool"
    if isinstance(msg, SystemMessage):
        return "system"
    return msg.__class__.__name__.lower().replace("message", "")


def serialize_message(msg: BaseMessage) -> dict[str, Any]:
    out: dict[str, Any] = {
        "type": _message_type(msg),
        "content": msg.content if isinstance(msg.content, str) else str(msg.content),
    }
    if isinstance(msg, AIMessage):
        if msg.tool_calls:
            out["tool_calls"] = [
                {"name": tc["name"], "args": tc.get("args", {}), "id": tc.get("id")}
                for tc in msg.tool_calls
            ]
    if isinstance(msg, ToolMessage):
        out["tool_call_id"] = msg.tool_call_id
        out["name"] = msg.name
    return out


def serialize_state(state) -> dict[str, Any]:
    """Serialize a langgraph StateSnapshot for JSON transport."""
    messages = state.values.get("messages", []) if state.values else []
    return {
        "values": {
            "messages": [serialize_message(m) for m in messages],
        },
        "next": list(state.next) if state.next else [],
        "checkpoint_id": state.config.get("configurable", {}).get("checkpoint_id"),
        "created_at": state.created_at,
    }
