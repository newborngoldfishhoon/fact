import os
from typing import Annotated, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from services import ClaimAnalysis, SearchSource, analyze_with_gemini, search_web

load_dotenv()

app = FastAPI(title="FactCheck AI API", version="0.1.0")

frontend_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class ClaimRequest(BaseModel):
    claim: Annotated[str, Field(min_length=3, max_length=500)]

    @field_validator("claim", mode="before")
    @classmethod
    def strip_claim(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class ClaimResponse(BaseModel):
    claim: str
    status: Literal["analyzed"]
    verdict: Literal["Likely true", "Likely false", "Mixed evidence", "Unclear"]
    confidence: Literal["Low", "Medium", "High"]
    supporting_evidence: list[str]
    contradicting_evidence: list[str]
    limitations: str
    sources: list[SearchSource]
    message: str


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/claims", response_model=ClaimResponse)
async def receive_claim(request: ClaimRequest) -> ClaimResponse:
    missing_keys = [
        key for key in ("TAVILY_API_KEY", "GEMINI_API_KEY") if not os.getenv(key)
    ]
    if missing_keys:
        raise HTTPException(
            status_code=503,
            detail=f"Missing server configuration: {', '.join(missing_keys)}.",
        )

    sources = await search_web(request.claim)
    analysis: ClaimAnalysis = await analyze_with_gemini(request.claim, sources)

    return ClaimResponse(
        claim=request.claim,
        status="analyzed",
        verdict=analysis.verdict,
        confidence=analysis.confidence,
        supporting_evidence=analysis.supporting_evidence,
        contradicting_evidence=analysis.contradicting_evidence,
        limitations=analysis.limitations,
        sources=sources,
        message=(
            "AI-generated assessment based on web search. Read the sources and "
            "limitations; this result is not definitive proof."
        ),
    )
