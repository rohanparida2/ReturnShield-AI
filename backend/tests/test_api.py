from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_analyze_returns_valid_schema_and_retrievable_evidence(monkeypatch):
    monkeypatch.setenv("MOCK_LLM", "true")
    response = client.post(
        "/analyze",
        json={"product_id": "stride-pro-1", "shopper_context": "I'm 5'8, wide feet, daily walking"},
    )
    assert response.status_code == 200
    body = response.json()
    assert 0 <= body["score"] <= 100
    assert body["label"] == "Low"
    assert len(body["reasons"]) == 3
    assert len(body["themes"]) == 3
    for reason in body["reasons"]:
        assert reason["evidence_ids"]
        for evidence_id in reason["evidence_ids"]:
            evidence = client.get(f"/products/stride-pro-1/evidence/{evidence_id}")
            assert evidence.status_code == 200


def test_low_relevance_context_returns_low_data(monkeypatch):
    monkeypatch.setenv("MOCK_LLM", "true")
    response = client.post(
        "/analyze",
        json={"product_id": "stride-pro-1", "shopper_context": "I want an astrophotography telescope"},
    )
    assert response.status_code == 200
    assert response.json() == {
        "score": None,
        "label": "LowData",
        "reasons": [],
        "red_flags": [],
        "themes": [],
        "swap_needed": False,
    }


def test_low_data_response_keeps_score_absent(monkeypatch):
    monkeypatch.setenv("MOCK_LLM", "true")
    response = client.post("/analyze", json={"product_id": "stride-pro-1", "shopper_context": ""})
    assert response.status_code == 200
    assert response.json()["label"] == "LowData"
