from fastapi import APIRouter

router = APIRouter()

GRAPH_DEFINITION = {
    "nodes": [
        {"id": "start", "type": "start", "label": "__start__"},
        {"id": "router", "type": "conditional", "label": "router"},
        {"id": "retriever", "type": "tool", "label": "retriever"},
        {"id": "llm_call", "type": "llm", "label": "llm_call"},
        {"id": "synthesizer", "type": "llm", "label": "synthesizer"},
        {"id": "end", "type": "end", "label": "__end__"},
    ],
    "edges": [
        {"source": "start", "target": "router"},
        {"source": "router", "target": "retriever", "condition": "needs_retrieval"},
        {"source": "router", "target": "llm_call", "condition": "direct_llm"},
        {"source": "retriever", "target": "synthesizer"},
        {"source": "llm_call", "target": "synthesizer"},
        {"source": "synthesizer", "target": "end"},
    ],
}


@router.get("/graph")
async def get_graph():
    return GRAPH_DEFINITION


@router.post("/run")
async def run_agent(request: dict):
    return {
        "status": "completed",
        "trace": [
            {"node": "router", "output": {"route": "needs_retrieval"}, "duration_ms": 12},
            {"node": "retriever", "output": {"chunks": 3}, "duration_ms": 45},
            {"node": "synthesizer", "output": {"response": "Demo agent response"}, "duration_ms": 230},
        ],
    }
