# ReturnShield

ReturnShield is a hackathon MVP that helps shoppers decide whether a product will work for them before checkout. It retrieves product-specific customer reviews, grounds fit guidance in those reviews, and can suggest a better-matching product.

## Stack

- **API:** FastAPI, Pydantic, Uvicorn; JSON data and an in-memory analysis cache
- **Retrieval:** FAISS + `all-MiniLM-L6-v2` index builder; lexical retrieval keeps the seeded demo quick and offline before indexing
- **LLMs:** Anthropic or Gemini, selected using `LLM_PROVIDER`; deterministic offline demo with `MOCK_LLM=true`
- **UI:** React, Vite, Tailwind configuration, responsive CSS

## Run locally

Use Python 3.11 and Node.js 20+.

1. Copy `.env.example` to `.env`. Leave `MOCK_LLM=true` for a no-key demo.
2. Install and start the API from the repository root:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r backend\requirements.txt
   uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
   ```

3. In a second terminal, install and start the UI:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

4. Open <http://localhost:5173>. API health and interactive docs are at <http://127.0.0.1:8000/health> and <http://127.0.0.1:8000/docs>.

The checked-in JSON files contain 40 products and 30 mixed synthetic reviews per product. The analysis cache is process-local; there is no database or account system.

### Optional semantic index

The demo works without downloading a model. To build the review-vector index (the first run downloads `all-MiniLM-L6-v2`):

```powershell
python backend\ingest.py
```

The resulting FAISS index and chunk map are written under `backend\index\` and intentionally ignored by Git.

### Optional hosted LLM

Set `MOCK_LLM=false`, choose `LLM_PROVIDER=anthropic` or `LLM_PROVIDER=gemini`, and provide the matching API key in `.env`. The adapter requests JSON at temperature 0.2. Responses are Pydantic-validated and citations are checked against the retrieved review IDs; malformed or ungrounded output is retried once, then returned as an explicit API error.

## API

- `GET /products` and `GET /products/{id}`
- `POST /analyze` with `product_id`, `shopper_context`, and optional `chips`
- `GET /products/{id}/alternatives?context=...`
- `GET /products/{id}/evidence/{review_id}` for the cited review text

When fewer than five relevant reviews match, `/analyze` returns `label: "LowData"` with `score: null`, no reasons, and no fabricated evidence.

## Tests

```powershell
python -m pytest backend\tests -q
```

## 60-second demo

1. Choose the **Running shoes** category and open **Stride Pro 1 Running Shoe**.
2. In ReturnShield, choose **Check my fit**.
3. Enter `I'm 5'8, wide feet, daily walking` and click **Analyze my fit**.
4. Show the **Low** score, expand the reasons, and point to the exact customer review about a **narrow toe box**.
5. Show the amber fit warning and the **Better match for you** options.
6. Click **Smart Swap** on **WideCloud Walker**. The product page changes, retains the shopper context, and shows its **High** score.
7. Optionally enter an unrelated request to show the honest **LowData** state.

### Recorded screenshots

The browser-verified demo states are saved in [`screenshots/`](./screenshots/):

- `01-catalog.png` — catalog
- `02-idle.png` — idle widget
- `03-input.png` — shopper context and fit chips
- `04-loading.png` — review retrieval in progress
- `05-low-score-evidence-and-swaps.png` — low score, cited review, and alternatives
- `06-smart-swap-high.png` — swapped product with high score
- `07-low-data.png` — low-data response
- `08-error.png` — visible API error and retry state

These are synthetic demo states; no shopper data is stored.
