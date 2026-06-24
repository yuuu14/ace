"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import agent, capabilities, ledger
from app.seed import seed_all


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_all()
    yield


app = FastAPI(
    title="Agent Capability Exchange",
    description="AI-agent marketplace for verified operational experience packs.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(capabilities.router)
app.include_router(agent.router)
app.include_router(ledger.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "ace-backend"}
