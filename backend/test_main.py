from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_check() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_claim_is_trimmed_and_not_misrepresented_as_checked() -> None:
    response = client.post("/api/claims", json={"claim": "  The moon is made of cheese.  "})

    assert response.status_code == 200
    assert response.json() == {
        "claim": "The moon is made of cheese.",
        "status": "received",
        "message": (
            "Your claim reached the API. It has not been fact-checked yet; "
            "web search and AI analysis are not connected."
        ),
    }


def test_claim_must_be_between_three_and_500_characters() -> None:
    short_response = client.post("/api/claims", json={"claim": "  "})
    long_response = client.post("/api/claims", json={"claim": "x" * 501})

    assert short_response.status_code == 422
    assert long_response.status_code == 422
