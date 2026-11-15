from fastapi.testclient import TestClient

from main import app
from services import ClaimAnalysis, SearchSource

client = TestClient(app)


def test_health_check() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_local_frontend_origin_is_allowed() -> None:
    response = client.options(
        "/api/claims",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_claim_requires_both_provider_keys(monkeypatch) -> None:
    monkeypatch.delenv("TAVILY_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    response = client.post("/api/claims", json={"claim": "A test claim."})

    assert response.status_code == 503
    assert "TAVILY_API_KEY" in response.json()["detail"]
    assert "GEMINI_API_KEY" in response.json()["detail"]


def test_claim_returns_search_sources_and_analysis(monkeypatch) -> None:
    monkeypatch.setenv("TAVILY_API_KEY", "test-tavily-key")
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")

    async def fake_search(claim: str) -> list[SearchSource]:
        assert claim == "A test claim."
        return [
            SearchSource(
                title="Example evidence",
                url="https://example.org/article",
                snippet="A short sample snippet.",
                score=0.9,
            )
        ]

    async def fake_analysis(
        claim: str,
        sources: list[SearchSource],
    ) -> ClaimAnalysis:
        assert claim == "A test claim."
        assert len(sources) == 1
        return ClaimAnalysis(
            verdict="Unclear",
            confidence="Low",
            supporting_evidence=[],
            contradicting_evidence=[],
            limitations="This test uses sample evidence.",
        )

    monkeypatch.setattr("main.search_web", fake_search)
    monkeypatch.setattr("main.analyze_with_gemini", fake_analysis)

    response = client.post("/api/claims", json={"claim": "  A test claim.  "})

    assert response.status_code == 200
    assert response.json()["claim"] == "A test claim."
    assert response.json()["status"] == "analyzed"
    assert response.json()["verdict"] == "Unclear"
    assert response.json()["sources"][0]["url"] == "https://example.org/article"


def test_claim_must_be_between_three_and_500_characters() -> None:
    short_response = client.post("/api/claims", json={"claim": "  "})
    long_response = client.post("/api/claims", json={"claim": "x" * 501})

    assert short_response.status_code == 422
    assert long_response.status_code == 422
