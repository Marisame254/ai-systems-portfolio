"""Helpers for the graph's auxiliary LLM calls (classification, grading, summarizing)."""

import json
from typing import Any

from langchain_core.messages import BaseMessage
from langchain_core.runnables import RunnableConfig

# Calls tagged with this are plumbing: the chat stream does not forward their tokens to the user.
INTERNAL_TAG = "internal"


def internal_config(run_name: str) -> RunnableConfig:
    return {"tags": [INTERNAL_TAG], "run_name": run_name}


def message_text(message: BaseMessage) -> str:
    content = message.content
    return content if isinstance(content, str) else str(content)


def parse_json_object(raw: str) -> dict[str, Any]:
    """First-to-last-brace JSON object in a model reply; {} when there is none."""
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end < start:
        return {}
    try:
        data = json.loads(raw[start : end + 1])
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}
