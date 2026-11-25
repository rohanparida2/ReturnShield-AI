import json
import re
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REVIEWS_PATH = ROOT / "data" / "reviews.json"
_reviews = json.loads(REVIEWS_PATH.read_text(encoding="utf-8"))

_GROUPS = {
    "wide": {"wide", "wider", "roomy", "spacious", "narrow", "tight", "pinch"},
    "feet": {"feet", "foot", "toe", "toes", "forefoot"},
    "daily": {"daily", "everyday", "regular", "all-day"},
    "walking": {"walk", "walking", "walks", "cushion", "comfortable", "comfort"},
    "running": {"run", "running", "runner", "jog", "jogging"},
    "small": {"small", "size", "sizing", "snug", "runs"},
    "battery": {"battery", "charge", "hours", "drains", "runtime"},
    "sound": {"sound", "audio", "bass", "noise", "anc", "microphone"},
    "fabric": {"fabric", "material", "soft", "wash", "pilled", "seams"},
    "quality": {"quality", "durable", "wear", "build", "holds"},
    "listing": {"listing", "photos", "photo", "advertised", "described", "colour", "color"},
}
_STOPWORDS = {"i", "im", "my", "me", "a", "an", "the", "for", "and", "to", "of", "with", "is", "am", "be", "it"}
_vector_resources = None


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z]+", text.lower())) - _STOPWORDS


def _query_groups(query: str) -> list[set[str]]:
    words = _tokens(query)
    groups = []
    for word in words:
        matched = next((values for key, values in _GROUPS.items() if word == key or word in values), None)
        groups.append(matched or {word})
    return groups


def retrieve_reviews(product_id: str, query: str, limit: int = 15) -> list[dict]:
    """Rank product-scoped review snippets by query-term and fit-theme overlap."""
    groups = _query_groups(query)
    if not groups:
        return []
    vector_hits = _vector_search(product_id, query)

    ranked = {}
    for review in _reviews:
        if review["product_id"] != product_id:
            continue
        words = _tokens(review["text"])
        matched = sum(bool(group & words) for group in groups)
        if matched:
            ranked[review["id"]] = (matched / len(groups), matched, review)

    for review, similarity in vector_hits:
        if similarity >= 0.3:
            current = ranked.get(review["id"])
            semantic_score = (similarity, 0, review)
            if current is None or semantic_score[0] > current[0]:
                ranked[review["id"]] = semantic_score

    ordered = sorted(ranked.values(), key=lambda row: (row[0], row[1], row[2]["id"]), reverse=True)
    return [row[2] for row in ordered[:limit]]


def _vector_search(product_id: str, query: str) -> list[tuple[dict, float]]:
    """Use the seeded FAISS index when present; keep fresh clones fully offline otherwise."""
    global _vector_resources
    index_dir = ROOT / "backend" / "index"
    index_path = index_dir / "reviews.faiss"
    chunks_path = index_dir / "chunks.json"
    if not index_path.exists() or not chunks_path.exists():
        return []

    if _vector_resources is None:
        import faiss
        import numpy as np
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer("all-MiniLM-L6-v2")
        index = faiss.read_index(str(index_path))
        chunks = json.loads(chunks_path.read_text(encoding="utf-8"))
        _vector_resources = (model, index, chunks, np)

    model, index, chunks, np = _vector_resources
    vector = model.encode([query], normalize_embeddings=True)
    scores, indices = index.search(np.asarray(vector, dtype="float32"), index.ntotal)
    review_by_id = {review["id"]: review for review in _reviews}
    best: dict[str, float] = {}
    for score, chunk_index in zip(scores[0], indices[0]):
        chunk = chunks[int(chunk_index)]
        if chunk["product_id"] == product_id:
            review_id = chunk["review_id"]
            best[review_id] = max(best.get(review_id, 0), float(score))
    return [
        (review_by_id[review_id], score)
        for review_id, score in best.items()
        if review_id in review_by_id
    ]


def get_review(product_id: str, review_id: str) -> dict | None:
    return next(
        (review for review in _reviews if review["product_id"] == product_id and review["id"] == review_id),
        None,
    )


def review_counts() -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    for review in _reviews:
        counts[review["product_id"]] += 1
    return dict(counts)


def review_stats() -> dict[str, dict[str, float | int]]:
    ratings: dict[str, list[int]] = defaultdict(list)
    for review in _reviews:
        ratings[review["product_id"]].append(review["rating"])
    return {
        product_id: {
            "review_count": len(values),
            "average_rating": round(sum(values) / len(values), 1),
        }
        for product_id, values in ratings.items()
    }
