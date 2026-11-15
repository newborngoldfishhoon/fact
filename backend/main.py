from typing import Annotated

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

app = FastAPI(title="FactCheck AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
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
    status: str
    message: str


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/claims", response_model=ClaimResponse)
def receive_claim(request: ClaimRequest) -> ClaimResponse:
    return ClaimResponse(
        claim=request.claim,
        status="received",
        message=(
            "Your claim reached the API. It has not been fact-checked yet; "
            "web search and AI analysis are not connected."
        ),
    )
