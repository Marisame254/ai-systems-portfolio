from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage

from agents.chat_agent import SUMMARY_PREFIX, model_messages, plan_summary
from agents.document_search import parse_relevant, route_after_grade
from agents.llm import parse_json_object
from core.config import settings
from services.portfolio import PROFILE_PATH, parse_sections


def _thread(turns: int) -> list:
    """System prompt followed by `turns` user/assistant exchanges, ids h0, a0, h1, a1, ..."""
    messages: list = [SystemMessage(content="system", id="sys")]
    for i in range(turns):
        messages.append(HumanMessage(content=f"question {i}", id=f"h{i}"))
        messages.append(AIMessage(content=f"answer {i}", id=f"a{i}"))
    return messages


def test_parse_json_object():
    assert parse_json_object('Sure: {"verdict": "block", "reason": "x"} done') == {
        "verdict": "block",
        "reason": "x",
    }
    assert parse_json_object("no json") == {}
    assert parse_json_object("[1, 2]") == {}
    assert parse_json_object('{"broken": ') == {}


def test_parse_relevant_keeps_valid_passage_numbers():
    assert parse_relevant('{"relevant": [1, 3]}', total=4) == [0, 2]
    assert parse_relevant('{"relevant": ["2", 2, 9, 0, true]}', total=3) == [1]
    assert parse_relevant('{"relevant": []}', total=3) == []


def test_parse_relevant_is_none_when_the_reply_is_unusable():
    assert parse_relevant("I think the first one", total=2) is None
    assert parse_relevant('{"relevant": "all"}', total=2) is None


def test_route_after_grade(monkeypatch):
    monkeypatch.setattr(settings, "rag_max_rewrites", 1)
    hit = {"content": "x"}

    assert route_after_grade({"relevant": [hit], "attempts": 1}) == "return_documents"
    assert route_after_grade({"relevant": [], "attempts": 1}) == "rewrite_query"
    # The one allowed rewrite is spent.
    assert route_after_grade({"relevant": [], "attempts": 2}) == "return_documents"
    # A failed search is not retried with a new query.
    assert route_after_grade({"relevant": [], "attempts": 1, "failed": True}) == "return_documents"


def test_plan_summary_waits_for_the_trigger():
    assert plan_summary(_thread(3), None, trigger=6, keep_turns=2) is None


def test_plan_summary_folds_everything_before_the_kept_turns():
    to_fold, cutoff = plan_summary(_thread(4), None, trigger=6, keep_turns=2)

    assert cutoff == "h2"
    assert [m.id for m in to_fold] == ["h0", "a0", "h1", "a1"]


def test_plan_summary_counts_only_messages_after_the_cutoff():
    messages = _thread(5)

    assert plan_summary(messages, "h2", trigger=6, keep_turns=2) is None
    to_fold, cutoff = plan_summary(messages, "h2", trigger=5, keep_turns=2)
    assert cutoff == "h3"
    assert [m.id for m in to_fold] == ["h2", "a2"]


def test_plan_summary_never_splits_a_turn():
    # One user turn with a long tool loop: nothing can be folded without orphaning tool results.
    messages = [HumanMessage(content="q", id="h0")]
    for i in range(6):
        messages.append(
            AIMessage(content="", id=f"a{i}", tool_calls=[{"name": "t", "args": {}, "id": f"c{i}"}])
        )
        messages.append(ToolMessage(content="r", tool_call_id=f"c{i}", id=f"t{i}"))

    assert plan_summary(messages, None, trigger=4, keep_turns=1) is None


def test_model_messages_without_a_summary_is_the_full_thread():
    messages = _thread(2)
    assert model_messages({"messages": messages}) == messages


def test_model_messages_replaces_old_turns_with_the_summary():
    sent = model_messages({"messages": _thread(4), "summary": "They talked.", "summary_cutoff": "h2"})

    assert [m.id for m in sent if m.id] == ["sys", "h2", "a2", "h3", "a3"]
    assert sent[1].content == f"{SUMMARY_PREFIX}\nThey talked."


def test_model_messages_falls_back_when_the_cutoff_is_gone():
    messages = _thread(2)
    state = {"messages": messages, "summary": "s", "summary_cutoff": "missing"}
    assert model_messages(state) == messages


def test_profile_has_the_sections_the_tool_searches():
    sections = parse_sections(PROFILE_PATH.read_text(encoding="utf-8"))
    titles = [s.title for s in sections]

    assert "Summary" in titles and "Contact" in titles and "Projects" in titles
    assert all(s.text for s in sections)
    # The editor's note above the first heading is not indexed.
    assert not any("Keep it in sync" in s.text for s in sections)
