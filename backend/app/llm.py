import json
import os

import httpx

from .schemas import AnalysisResponse


def _prompt(product: dict, query: str, reviews: list[dict]) -> str:
    """Keep the model grounded: all evidence must come from these retrieved reviews."""
    evidence = [{"id": review["id"], "rating": review["rating"], "text": review["text"]} for review in reviews]
    return (
        "Decide whether this product fits the shopper. Treat review evidence as the only source of "
        "product-specific claims; do not infer facts. Cite only IDs in the evidence list. Return JSON "
        "matching the supplied schema. Give at most 3 concise reasons, each citing one or more review "
        "IDs. Use label LowData only when evidence is insufficient. Theme shares are 0..1.\n"
        f"Product: {json.dumps(product, ensure_ascii=False)}\n"
        f"Shopper context: {query}\n"
        f"Retrieved evidence: {json.dumps(evidence, ensure_ascii=False)}"
    )


async def complete(product: dict, query: str, reviews: list[dict]) -> str:
    provider = os.getenv("LLM_PROVIDER", "").lower()
    prompt = _prompt(product, query, reviews)
    schema = AnalysisResponse.model_json_schema()

    async with httpx.AsyncClient(timeout=35) as client:
        if provider == "anthropic":
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": os.environ["ANTHROPIC_API_KEY"],
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-latest"),
                    "max_tokens": 1200,
                    "temperature": 0.2,
                    "messages": [{"role": "user", "content": prompt}],
                    "tools": [{
                        "name": "returnshield_analysis",
                        "description": "Return the validated shopper fit analysis.",
                        "input_schema": schema,
                    }],
                    "tool_choice": {"type": "tool", "name": "returnshield_analysis"},
                },
            )
            response.raise_for_status()
            return json.dumps(response.json()["content"][0]["input"])
        if provider == "gemini":
            key = os.environ["GEMINI_API_KEY"]
            model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "responseMimeType": "application/json",
                        "responseSchema": schema,
                    },
                },
            )
            response.raise_for_status()
            return response.json()["candidates"][0]["content"]["parts"][0]["text"]

    raise ValueError("LLM_PROVIDER must be 'anthropic' or 'gemini' when MOCK_LLM is false.")
