"""Student Compass — FastAPI backend.

Endpoints:
- POST /api/chat                  : RAG chat (Firecrawl + Claude Sonnet 4.5)
- GET  /api/campuses              : list of CUNY campuses
- GET  /api/sessions/{sid}/history: recent queries for a session
- POST /api/saved-resources       : save an AI reply / chunk
- GET  /api/saved-resources       : list saved resources for a session
- DELETE /api/saved-resources/{id}: delete a saved resource
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("student_compass")

# ---------------------------------------------------------------------------
# Mongo
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ["DB_NAME"]]

# ---------------------------------------------------------------------------
# 3rd-party clients (lazy import & init for nicer error messages)
# ---------------------------------------------------------------------------
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY")
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY")

# ---------------------------------------------------------------------------
# CUNY campuses registry
# ---------------------------------------------------------------------------
CUNY_CAMPUSES = [
    {"slug": "john-jay", "name": "John Jay College of Criminal Justice", "short": "John Jay",
     "domain": "jjay.cuny.edu",
     "resource_urls": [
         "https://www.jjay.cuny.edu/student-life",
         "https://www.jjay.cuny.edu/events",
     ],
     "tier": "senior", "color": "#003366"},
    {"slug": "baruch", "name": "Baruch College", "short": "Baruch",
     "domain": "baruch.cuny.edu",
     "resource_urls": ["https://www.baruch.cuny.edu/campus-life/"],
     "tier": "senior", "color": "#0033A0"},
    {"slug": "hunter", "name": "Hunter College", "short": "Hunter",
     "domain": "hunter.cuny.edu",
     "resource_urls": ["https://hunter.cuny.edu/students/"],
     "tier": "senior", "color": "#7B2D8E"},
    {"slug": "city", "name": "The City College of New York", "short": "CCNY",
     "domain": "ccny.cuny.edu",
     "resource_urls": ["https://www.ccny.cuny.edu/campus-life"],
     "tier": "senior", "color": "#8B0000"},
    {"slug": "brooklyn", "name": "Brooklyn College", "short": "Brooklyn",
     "domain": "brooklyn.cuny.edu",
     "resource_urls": ["https://www.brooklyn.cuny.edu/web/about/campuslife.php"],
     "tier": "senior", "color": "#990000"},
    {"slug": "queens", "name": "Queens College", "short": "Queens",
     "domain": "qc.cuny.edu",
     "resource_urls": ["https://www.qc.cuny.edu/student-life/"],
     "tier": "senior", "color": "#A6192E"},
    {"slug": "lehman", "name": "Lehman College", "short": "Lehman",
     "domain": "lehman.edu",
     "resource_urls": ["https://www.lehman.edu/campus-life/"],
     "tier": "senior", "color": "#003B5C"},
    {"slug": "york", "name": "York College", "short": "York",
     "domain": "york.cuny.edu",
     "resource_urls": ["https://www.york.cuny.edu/student-development"],
     "tier": "senior", "color": "#003F87"},
    {"slug": "csi", "name": "College of Staten Island", "short": "CSI",
     "domain": "csi.cuny.edu",
     "resource_urls": ["https://www.csi.cuny.edu/campus-life"],
     "tier": "senior", "color": "#003478"},
    {"slug": "medgar-evers", "name": "Medgar Evers College", "short": "Medgar Evers",
     "domain": "mec.cuny.edu",
     "resource_urls": ["https://www.mec.cuny.edu/student-affairs/"],
     "tier": "senior", "color": "#5C2D91"},
    {"slug": "bmcc", "name": "Borough of Manhattan Community College", "short": "BMCC",
     "domain": "bmcc.cuny.edu",
     "resource_urls": ["https://www.bmcc.cuny.edu/student-affairs/"],
     "tier": "community", "color": "#0033A0"},
    {"slug": "laguardia", "name": "LaGuardia Community College", "short": "LaGuardia",
     "domain": "laguardia.edu",
     "resource_urls": ["https://www.laguardia.edu/students/"],
     "tier": "community", "color": "#003B5C"},
    {"slug": "kingsborough", "name": "Kingsborough Community College", "short": "Kingsborough",
     "domain": "kbcc.cuny.edu",
     "resource_urls": ["https://www.kbcc.cuny.edu/student_life/"],
     "tier": "community", "color": "#005EB8"},
    {"slug": "queensborough", "name": "Queensborough Community College", "short": "Queensborough",
     "domain": "qcc.cuny.edu",
     "resource_urls": ["https://www.qcc.cuny.edu/studentAffairs/"],
     "tier": "community", "color": "#003F87"},
    {"slug": "bronx-cc", "name": "Bronx Community College", "short": "Bronx CC",
     "domain": "bcc.cuny.edu",
     "resource_urls": ["https://www.bcc.cuny.edu/student-life/"],
     "tier": "community", "color": "#003B5C"},
    {"slug": "hostos", "name": "Hostos Community College", "short": "Hostos",
     "domain": "hostos.cuny.edu",
     "resource_urls": ["https://www.hostos.cuny.edu/Student-Services"],
     "tier": "community", "color": "#7B2D8E"},
    {"slug": "guttman", "name": "Stella & Charles Guttman Community College", "short": "Guttman",
     "domain": "guttman.cuny.edu",
     "resource_urls": ["https://guttman.cuny.edu/students/"],
     "tier": "community", "color": "#005EB8"},
]
CAMPUS_BY_SLUG = {c["slug"]: c for c in CUNY_CAMPUSES}


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str
    campus: str = "john-jay"
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class CitedSource(BaseModel):
    url: str
    title: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    session_id: str
    campus: str
    sources: List[CitedSource] = []
    cross_campus_redirect: Optional[str] = None


class SavedResourceCreate(BaseModel):
    session_id: str
    title: str
    content: str
    campus: str = "john-jay"
    sources: List[CitedSource] = []


class SavedResource(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    title: str
    content: str
    campus: str
    sources: List[CitedSource] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class HistoryItem(BaseModel):
    id: str
    query: str
    campus: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
CROSS_CAMPUS_TRIGGERS = {
    # Distinctive phrases that strongly indicate a specific campus.
    "john-jay": ["john jay"],
    "baruch": ["baruch"],
    "hunter": ["hunter college", "hunter cuny", "at hunter"],
    "city": ["ccny", "city college"],
    "brooklyn": ["brooklyn college"],
    "queens": ["queens college"],
    "lehman": ["lehman college", "lehman"],
    "york": ["york college"],
    "csi": ["college of staten island", "csi cuny"],
    "medgar-evers": ["medgar evers"],
    "bmcc": ["bmcc", "borough of manhattan"],
    "laguardia": ["laguardia"],
    "kingsborough": ["kingsborough"],
    "queensborough": ["queensborough"],
    "bronx-cc": ["bronx community"],
    "hostos": ["hostos"],
    "guttman": ["guttman"],
}


def detect_cross_campus(message: str, current_slug: str) -> Optional[str]:
    """Detect whether the user mentions a different CUNY campus by curated triggers."""
    msg = message.lower()
    for slug, triggers in CROSS_CAMPUS_TRIGGERS.items():
        if slug == current_slug:
            continue
        for t in triggers:
            if re.search(rf"\b{re.escape(t)}\b", msg):
                return slug
    return None


async def firecrawl_scrape(url: str, timeout_s: int = 25) -> dict:
    """Run Firecrawl scrape in a thread (SDK is sync)."""
    if not FIRECRAWL_API_KEY:
        return {"markdown": "", "title": "", "url": url, "error": "no_api_key"}

    def _scrape() -> dict:
        try:
            from firecrawl import Firecrawl  # type: ignore

            fc = Firecrawl(api_key=FIRECRAWL_API_KEY)
            res = fc.scrape(
                url,
                formats=["markdown"],
                only_main_content=True,
                timeout=timeout_s * 1000,
            )
            # SDK returns a Document-like object; normalize to dict
            md = getattr(res, "markdown", None) or (res.get("markdown") if isinstance(res, dict) else "")
            meta = getattr(res, "metadata", None) or (res.get("metadata") if isinstance(res, dict) else {}) or {}
            if hasattr(meta, "model_dump"):
                meta = meta.model_dump()
            title = meta.get("title") if isinstance(meta, dict) else None
            return {"markdown": md or "", "title": title or url, "url": url}
        except Exception as exc:  # noqa: BLE001
            logger.warning("Firecrawl error for %s: %s", url, exc)
            return {"markdown": "", "title": url, "url": url, "error": str(exc)}

    return await asyncio.to_thread(_scrape)


async def tavily_search(query: str, include_domains: Optional[List[str]] = None, max_results: int = 4) -> List[dict]:
    """Run Tavily search in a thread (SDK sync)."""
    if not TAVILY_API_KEY:
        return []

    def _search() -> List[dict]:
        try:
            from tavily import TavilyClient  # type: ignore

            tv = TavilyClient(api_key=TAVILY_API_KEY)
            params = {
                "query": query[:380],
                "max_results": min(max_results, 8),
                "search_depth": "basic",
                "include_answer": False,
            }
            if include_domains:
                params["include_domains"] = include_domains
            resp = tv.search(**params)
            return resp.get("results", []) or []
        except Exception as exc:  # noqa: BLE001
            logger.warning("Tavily error: %s", exc)
            return []

    return await asyncio.to_thread(_search)


async def gather_context(message: str, campus: dict) -> tuple[str, List[CitedSource]]:
    """Build RAG context: scrape known resource URLs + Tavily-discover top URLs."""
    discovery_query = f"site:{campus['domain']} {message}"
    discovered = await tavily_search(discovery_query, include_domains=[campus["domain"]], max_results=3)

    discovered_urls = [r["url"] for r in discovered if r.get("url")]
    seed_urls = list(dict.fromkeys(campus["resource_urls"] + discovered_urls))[:4]

    scrapes = await asyncio.gather(*(firecrawl_scrape(u) for u in seed_urls))

    chunks: List[str] = []
    sources: List[CitedSource] = []
    for s in scrapes:
        md = (s.get("markdown") or "").strip()
        if not md:
            continue
        # Trim each source to keep prompt manageable
        snippet = md[:3500]
        chunks.append(f"### Source: {s['title']}\nURL: {s['url']}\n\n{snippet}")
        sources.append(CitedSource(url=s["url"], title=s.get("title")))

    # Add Tavily content as fallback for sources we couldn't scrape
    if not chunks and discovered:
        for r in discovered[:3]:
            chunks.append(f"### Source: {r.get('title','')}\nURL: {r.get('url','')}\n\n{r.get('content','')[:1500]}")
            sources.append(CitedSource(url=r.get("url", ""), title=r.get("title")))

    context = "\n\n---\n\n".join(chunks) if chunks else "(No fresh data could be retrieved; answer from general CUNY knowledge.)"
    return context, sources


async def claude_answer(message: str, context: str, campus_name: str) -> str:
    """Call Claude Sonnet 4.5 via emergentintegrations."""
    if not EMERGENT_LLM_KEY:
        return "Compass AI is offline (missing LLM key)."

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage  # type: ignore
    except Exception as exc:  # noqa: BLE001
        logger.error("emergentintegrations import failed: %s", exc)
        return "Compass AI failed to load its LLM client."

    system_message = (
        "You are Student Compass — a warm, concise AI guide for CUNY students. "
        f"You are currently focused on {campus_name}. "
        "Use ONLY the crawled data below to answer the student's question. "
        "Style rules: \n"
        "• Keep answers short (3–6 sentences max) unless the user asks for detail.\n"
        "• If the info is about a time-sensitive event, deadline, or a specific room/building number, **bold** it with markdown.\n"
        "• If the user asks about events, prioritize ones explicitly open to all CUNY students.\n"
        "• If the data does not contain the answer, say so plainly and suggest who to contact.\n"
        "• Never invent URLs, room numbers, dates, or names that aren't in the data.\n"
        "Format with light markdown (lists, **bold**), no headings.\n\n"
        f"=== CRAWLED DATA ===\n{context}\n=== END DATA ==="
    )

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system_message,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    try:
        reply = await chat.send_message(UserMessage(text=message))
        return str(reply).strip()
    except Exception as exc:  # noqa: BLE001
        logger.exception("Claude error: %s", exc)
        return "Compass AI hit a snag generating that response. Please try again."


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="Student Compass API")
api = APIRouter(prefix="/api")


@api.get("/")
async def root():
    return {"app": "Student Compass", "version": "1.0"}


@api.get("/campuses")
async def list_campuses():
    return {
        "campuses": [
            {k: c[k] for k in ("slug", "name", "short", "domain", "tier", "color")}
            for c in CUNY_CAMPUSES
        ]
    }


@api.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(400, "message cannot be empty")

    campus_slug = req.campus if req.campus in CAMPUS_BY_SLUG else "john-jay"

    # Cross-campus detection — if user mentions a different campus, use that one's URLs.
    redirect = detect_cross_campus(req.message, campus_slug)
    target_slug = redirect or campus_slug
    campus = CAMPUS_BY_SLUG[target_slug]

    context, sources = await gather_context(req.message, campus)
    answer = await claude_answer(req.message, context, campus["name"])

    # Persist to history
    doc = {
        "id": str(uuid.uuid4()),
        "session_id": req.session_id,
        "campus": target_slug,
        "query": req.message,
        "answer": answer,
        "sources": [s.model_dump() for s in sources],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.chat_messages.insert_one(doc)

    return ChatResponse(
        answer=answer,
        session_id=req.session_id,
        campus=target_slug,
        sources=sources,
        cross_campus_redirect=redirect,
    )


@api.get("/sessions/{session_id}/history")
async def history(session_id: str, limit: int = 25):
    cur = (
        db.chat_messages.find({"session_id": session_id}, {"_id": 0})
        .sort("created_at", -1)
        .limit(limit)
    )
    items = await cur.to_list(length=limit)
    return {"items": items}


@api.post("/saved-resources", response_model=SavedResource)
async def save_resource(payload: SavedResourceCreate):
    obj = SavedResource(**payload.model_dump())
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.saved_resources.insert_one(doc)
    return obj


@api.get("/saved-resources")
async def list_saved(session_id: str):
    cur = (
        db.saved_resources.find({"session_id": session_id}, {"_id": 0})
        .sort("created_at", -1)
    )
    items = await cur.to_list(length=200)
    return {"items": items}


@api.delete("/saved-resources/{resource_id}")
async def delete_saved(resource_id: str):
    res = await db.saved_resources.delete_one({"id": resource_id})
    return {"deleted": res.deleted_count}


# ---------------------------------------------------------------------------
# Wire-up
# ---------------------------------------------------------------------------
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()
