import hashlib
import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from . import llm
from .retrieval import get_review, retrieve_reviews, review_stats
from .schemas import AnalysisRequest, AnalysisResponse, Theme


ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")
PRODUCTS = json.loads((ROOT / "data" / "products.json").read_text(encoding="utf-8"))
PRODUCT_BY_ID = {product["id"]: product for product in PRODUCTS}
REVIEW_STATS = review_stats()
_cache: dict[tuple[str, str], AnalysisResponse] = {}

app = FastAPI(title="ReturnShield API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _mock_response(product: dict, query: str, reviews: list[dict]) -> AnalysisResponse:
    if len(reviews) < 5:
        return AnalysisResponse(label="LowData", score=None)

    positive = [review for review in reviews if review["rating"] >= 4]
    negative = [review for review in reviews if review["rating"] <= 2]
    neutral = [review for review in reviews if 2 < review["rating"] < 4]
    score = round((len(positive) + 0.5 * len(neutral)) / len(reviews) * 100)
    wide_query = any(word in query.lower() for word in ("wide", "roomy", "toe", "forefoot"))
    is_wide_option = product["id"] == "widecloud-walker"
    if product["category"] == "running shoes" and wide_query:
        score = 91 if is_wide_option else min(score, 34)

    label = "High" if score >= 75 else "Medium" if score >= 50 else "Low"
    if score < 50:
        reasons = [
            ("Shoppers with wider feet repeatedly mention a narrow or pinching toe box.", negative),
            ("Several reviewers say the fit runs small compared with their usual size.", negative),
            ("The same forefoot fit concern appears across multiple reviews, not just one outlier.", negative),
        ]
        flags = ["Narrow toe box reported by shoppers", "Consider sizing up; wide fit is not available"]
    else:
        reasons = [
            ("Reviewers describe a comfortable fit for everyday use.", positive),
            ("Shoppers mention useful cushioning and comfort over longer walks.", positive),
            ("Most cited buyers found the sizing and room through the toes comfortable.", positive),
        ]
        flags = ["A few shoppers would like more arch support"] if neutral else []

    output_reasons = [
        {"text": text, "evidence_ids": [review["id"] for review in group[:3]] or [reviews[index]["id"]]}
        for index, (text, group) in enumerate(reasons)
    ]
    for i, reason in enumerate(output_reasons):
        if not reason["evidence_ids"]:
            reason["evidence_ids"] = [reviews[min(i, len(reviews) - 1)]["id"]]

    total = max(len(reviews), 1)
    fit_negative = sum(any(word in review["text"].lower() for word in ("fit", "toe", "size", "feet", "roomy", "narrow")) for review in negative)
    quality_negative = sum(any(word in review["text"].lower() for word in ("wear", "quality", "pilled", "battery")) for review in negative)
    themes = [
        Theme(aspect="fit", sentiment="negative" if fit_negative >= 3 else "mixed" if fit_negative else "positive", share=round(min(1, max(0.1, (fit_negative + len(positive) / 2) / total)), 2)),
        Theme(aspect="quality", sentiment="negative" if quality_negative >= 3 else "mixed" if quality_negative else "positive", share=round(min(1, max(0.1, (quality_negative + len(positive) / 3) / total)), 2)),
        Theme(aspect="listing_accuracy", sentiment="mixed", share=round(min(1, max(0.1, sum("listing" in review["text"].lower() or "photo" in review["text"].lower() for review in reviews) / total)), 2)),
    ]
    return AnalysisResponse(
        score=score,
        label=label,
        reasons=output_reasons,
        red_flags=flags,
        themes=themes,
        swap_needed=score < 50,
    )


def _validate_citations(result: AnalysisResponse, retrieved: list[dict]) -> AnalysisResponse:
    available = {review["id"] for review in retrieved}
    for reason in result.reasons:
        if not reason.evidence_ids or any(review_id not in available for review_id in reason.evidence_ids):
            raise ValueError("The model cited an evidence ID outside the retrieved review set.")
    if result.label == "LowData":
        if result.score is not None or result.reasons:
            raise ValueError("LowData responses must not include a score or reasons.")
    elif result.score is None or len(result.reasons) != 3:
        raise ValueError("Scored responses require a score and exactly three reasons.")
    return result


async def _analyze(product: dict, query: str, context_key: str) -> AnalysisResponse:
    cache_key = (product["id"], hashlib.sha256(context_key.encode("utf-8")).hexdigest())
    if cache_key in _cache:
        return _cache[cache_key].model_copy(deep=True)

    reviews = retrieve_reviews(product["id"], query, limit=15)
    if len(reviews) < 5:
        result = AnalysisResponse(label="LowData", score=None)
    elif os.getenv("MOCK_LLM", "true").lower() == "true":
        result = _mock_response(product, query, reviews)
    else:
        last_error: Exception | None = None
        result = None
        for _ in range(2):
            try:
                raw = await llm.complete(product, query, reviews)
                result = _validate_citations(AnalysisResponse.model_validate_json(raw), reviews)
                break
            except (ValidationError, ValueError, json.JSONDecodeError) as error:
                last_error = error
        if result is None:
            raise HTTPException(status_code=502, detail=f"LLM returned invalid or ungrounded analysis: {last_error}")

    _cache[cache_key] = result.model_copy(deep=True)
    return result


def _query(request: AnalysisRequest) -> str:
    chip_values = request.chips.model_dump(exclude_none=True)
    return " ".join(value for value in [request.shopper_context, *chip_values.values()] if value.strip())


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/products")
def list_products(category: str | None = Query(default=None)) -> list[dict[str, Any]]:
    products = [product for product in PRODUCTS if category is None or product["category"] == category]
    return [{**product, **REVIEW_STATS[product["id"]]} for product in products]


@app.get("/products/{product_id}")
def get_product(product_id: str) -> dict:
    product = PRODUCT_BY_ID.get(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return {**product, **REVIEW_STATS[product_id]}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest) -> AnalysisResponse:
    product = PRODUCT_BY_ID.get(request.product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    query = _query(request)
    return await _analyze(product, query, json.dumps({"context": request.shopper_context, "chips": request.chips.model_dump()}, sort_keys=True))


@app.get("/products/{product_id}/evidence/{review_id}")
def evidence(product_id: str, review_id: str) -> dict:
    review = get_review(product_id, review_id)
    if review is None:
        raise HTTPException(status_code=404, detail="Review evidence not found")
    return review


@app.get("/products/{product_id}/alternatives")
async def alternatives(product_id: str, context: str = "") -> list[dict]:
    product = PRODUCT_BY_ID.get(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    candidates = [item for item in PRODUCTS if item["category"] == product["category"] and item["id"] != product_id]
    results = []
    for candidate in candidates:
        result = await _analyze(candidate, context, context)
        results.append({"product": candidate, "score": result.score, "label": result.label})
    results.sort(key=lambda item: (item["score"] if item["score"] is not None else -1), reverse=True)
    return results[:2]
