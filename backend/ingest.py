import json
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = Path(__file__).resolve().parent / "index"


def chunk_text(text: str, size: int = 320, overlap: int = 40) -> list[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + size, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
        start = end - overlap
    return chunks


def main() -> None:
    reviews = json.loads((DATA / "reviews.json").read_text(encoding="utf-8"))
    chunks = [
        {"review_id": review["id"], "product_id": review["product_id"], "text": text}
        for review in reviews
        for text in chunk_text(review["text"])
    ]
    model = SentenceTransformer("all-MiniLM-L6-v2")
    vectors = model.encode([item["text"] for item in chunks], normalize_embeddings=True)
    index = faiss.IndexFlatIP(vectors.shape[1])
    index.add(np.asarray(vectors, dtype="float32"))
    OUT.mkdir(exist_ok=True)
    faiss.write_index(index, str(OUT / "reviews.faiss"))
    (OUT / "chunks.json").write_text(json.dumps(chunks, indent=2), encoding="utf-8")
    print(f"Indexed {len(chunks)} review chunks at {OUT}")


if __name__ == "__main__":
    main()
