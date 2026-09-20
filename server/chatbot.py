# from dotenv import load_dotenv, find_dotenv
# import os
# import requests
# from pydantic import BaseModel
# from openai import OpenAI

# load_dotenv()

# META_API_KEY = os.getenv("META_API_KEY")

# client = OpenAI(
#     base_url="https://api.meta.ai/v1",
#     api_key=META_API_KEY,
# )

# response = client.responses.create(
#     model="muse-spark-1.3",
#     input="What is the capital of France?",
# )

# print(response.model_dump_json(indent=2))


# """
# server/chatbot.py

# Receives chat messages from the React app, sends them to the Meta model,
# processes the output, and returns JSON that ChatProvider.tsx can store.

# Run from the server/ folder:
#     pip install fastapi uvicorn openai python-dotenv
#     uvicorn chatbot:app --reload --port 8000
# """

import os
import re
from typing import Literal

from dotenv import find_dotenv, load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv(find_dotenv())

META_API_KEY = os.getenv("META_API_KEY")
if not META_API_KEY:
    raise RuntimeError("META_API_KEY not found. Check your .env file.")

# Model id for Meta's OpenAI-compatible Responses API (override in .env).
META_MODEL = os.getenv("META_MODEL", "muse-spark-1.3")

client = OpenAI(base_url="https://api.meta.ai/v1", api_key=META_API_KEY)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CoachTone = Literal["warm", "gentle", "grounding", "encouraging"]

TONE_GUIDE: dict[str, str] = {
    "warm": "Be warm and friendly.",
    "gentle": "Be soft and unhurried. Validate feelings before suggesting anything.",
    "grounding": (
        "Be calm and steady. Offer one simple grounding step, such as slow breathing "
        "or naming things they can see."
    ),
    "encouraging": "Be upbeat and encouraging without being dismissive.",
}


# ---------- Input shapes (must match src/lib/coachApi.ts) ----------


class Msg(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class CoachRequest(BaseModel):
    messages: list[Msg] = Field(min_length=1)
    tone: CoachTone = "warm"
    stress_score: int = 0
    display_name: str | None = None
    memory: list[str] = []  # summaries of past sessions


# ---------- Output processing ----------


def clean_reply(text: str) -> str:
    """
    The chat bubble renders plain text, so strip markdown that would show up
    as stray symbols (**bold**, # headings, `code`, leading bullets).
    """
    text = text.strip()
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)      # **bold**
    text = re.sub(r"__(.+?)__", r"\1", text)          # __bold__
    text = re.sub(r"`([^`]*)`", r"\1", text)          # `code`
    text = re.sub(r"^\s{0,3}#{1,6}\s*", "", text,
                  flags=re.MULTILINE)  # headings
    text = re.sub(r"^\s*[-*]\s+", "• ", text,
                  flags=re.MULTILINE)      # bullets
    text = re.sub(r"\n{3,}", "\n\n", text)            # extra blank lines
    return text.strip()


def extract_text(response) -> str:
    """Pull the reply text out of a Responses API result."""
    text = getattr(response, "output_text", None)
    if text:
        return text
    # Fallback: walk the output blocks manually
    parts: list[str] = []
    for item in getattr(response, "output", []) or []:
        for block in getattr(item, "content", []) or []:
            t = getattr(block, "text", None)
            if t:
                parts.append(t)
    return "".join(parts)


def build_instructions(req: CoachRequest) -> str:
    name = f"The user's name is {req.display_name}. " if req.display_name else ""
    memory = " | ".join(req.memory[-3:]) if req.memory else "none"
    return (
        "You are a supportive stress coach inside a wellbeing app. "
        f"{name}"
        f"{TONE_GUIDE[req.tone]} "
        f"The app's stress signal for the user's latest message is {req.stress_score}/100. "
        "Reply in plain text with no markdown, in under 110 words. "
        "Suggest at most one small, concrete destress step, and only if it fits. "
        "You are not a therapist. If the user mentions self-harm or being in danger, "
        "respond with care and encourage them to contact local emergency services "
        "or a crisis line.\n"
        f"Notes from past sessions: {memory}"
    )


# ---------- Routes ----------


@app.get("/api/health")
def health():
    return {"ok": True, "model": META_MODEL}


@app.post("/api/coach")
def coach(req: CoachRequest):
    try:
        response = client.responses.create(
            model=META_MODEL,
            instructions=build_instructions(req),
            input=[m.model_dump() for m in req.messages],
        )
    except Exception as e:
        # Shows up in the browser's Network tab as the response "detail"
        raise HTTPException(status_code=502, detail=f"Meta API error: {e}")

    reply = clean_reply(extract_text(response))
    if not reply:
        raise HTTPException(
            status_code=502, detail="Meta API returned an empty reply.")

    return {
        "reply": reply,
        "coach_tone": req.tone,
        "model": META_MODEL,
    }
