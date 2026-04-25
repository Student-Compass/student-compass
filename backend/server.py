"""Student Compass — FastAPI backend with JWT auth + per-campus theming."""
from __future__ import annotations

import asyncio
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("student_compass")

# ---------------------------------------------------------------------------
# Mongo
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ["DB_NAME"]]

# ---------------------------------------------------------------------------
# Auth config
# ---------------------------------------------------------------------------
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.environ.get("JWT_EXPIRE_HOURS", "72"))
LOCKOUT_THRESHOLD = 3
LOCKOUT_SECONDS = 60

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY")
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY")

# ---------------------------------------------------------------------------
# CUNY campuses with full per-campus theme
# theme.primary = main brand color, theme.accent = secondary, theme.tint = soft bg
# ---------------------------------------------------------------------------
CUNY_CAMPUSES = [
    {"slug": "john-jay", "name": "John Jay College of Criminal Justice", "short": "John Jay",
     "domain": "jjay.cuny.edu",
     "resource_urls": ["https://www.jjay.cuny.edu/student-life", "https://www.jjay.cuny.edu/events"],
     "tier": "senior",
     "theme": {"primary": "#003366", "accent": "#F1B521", "tint": "#EAF1F8", "ink": "#001A33"}},
    {"slug": "baruch", "name": "Baruch College", "short": "Baruch",
     "domain": "baruch.cuny.edu",
     "resource_urls": ["https://www.baruch.cuny.edu/campus-life/"],
     "tier": "senior",
     "theme": {"primary": "#0033A0", "accent": "#A6CE39", "tint": "#E5ECF8", "ink": "#001E63"}},
    {"slug": "hunter", "name": "Hunter College", "short": "Hunter",
     "domain": "hunter.cuny.edu",
     "resource_urls": ["https://hunter.cuny.edu/students/"],
     "tier": "senior",
     "theme": {"primary": "#7B2D8E", "accent": "#F1B521", "tint": "#F2E7F5", "ink": "#4A1B57"}},
    {"slug": "city", "name": "The City College of New York", "short": "CCNY",
     "domain": "ccny.cuny.edu",
     "resource_urls": ["https://www.ccny.cuny.edu/campus-life"],
     "tier": "senior",
     "theme": {"primary": "#8B0000", "accent": "#000000", "tint": "#F8E8E8", "ink": "#5C0000"}},
    {"slug": "brooklyn", "name": "Brooklyn College", "short": "Brooklyn",
     "domain": "brooklyn.cuny.edu",
     "resource_urls": ["https://www.brooklyn.cuny.edu/web/about/campuslife.php"],
     "tier": "senior",
     "theme": {"primary": "#990000", "accent": "#F1B521", "tint": "#F8E8E8", "ink": "#5C0000"}},
    {"slug": "queens", "name": "Queens College", "short": "Queens",
     "domain": "qc.cuny.edu",
     "resource_urls": ["https://www.qc.cuny.edu/student-life/"],
     "tier": "senior",
     "theme": {"primary": "#A6192E", "accent": "#003366", "tint": "#FBE5E9", "ink": "#6E0F1E"}},
    {"slug": "lehman", "name": "Lehman College", "short": "Lehman",
     "domain": "lehman.edu",
     "resource_urls": ["https://www.lehman.edu/campus-life/"],
     "tier": "senior",
     "theme": {"primary": "#003B5C", "accent": "#76BC21", "tint": "#E5EEF4", "ink": "#001E2F"}},
    {"slug": "york", "name": "York College", "short": "York",
     "domain": "york.cuny.edu",
     "resource_urls": ["https://www.york.cuny.edu/student-development"],
     "tier": "senior",
     "theme": {"primary": "#003F87", "accent": "#F1B521", "tint": "#E5EBF4", "ink": "#001F44"}},
    {"slug": "csi", "name": "College of Staten Island", "short": "CSI",
     "domain": "csi.cuny.edu",
     "resource_urls": ["https://www.csi.cuny.edu/campus-life"],
     "tier": "senior",
     "theme": {"primary": "#003478", "accent": "#FFD400", "tint": "#E5EBF3", "ink": "#001A3C"}},
    {"slug": "medgar-evers", "name": "Medgar Evers College", "short": "Medgar Evers",
     "domain": "mec.cuny.edu",
     "resource_urls": ["https://www.mec.cuny.edu/student-affairs/"],
     "tier": "senior",
     "theme": {"primary": "#5C2D91", "accent": "#F1B521", "tint": "#EFE7F5", "ink": "#391857"}},
    {"slug": "bmcc", "name": "Borough of Manhattan Community College", "short": "BMCC",
     "domain": "bmcc.cuny.edu",
     "resource_urls": ["https://www.bmcc.cuny.edu/student-affairs/"],
     "tier": "community",
     "theme": {"primary": "#0033A0", "accent": "#F1B521", "tint": "#E5ECF8", "ink": "#001E63"}},
    {"slug": "laguardia", "name": "LaGuardia Community College", "short": "LaGuardia",
     "domain": "laguardia.edu",
     "resource_urls": ["https://www.laguardia.edu/students/"],
     "tier": "community",
     "theme": {"primary": "#C8102E", "accent": "#003B5C", "tint": "#FBE5EA", "ink": "#7C0A1D"}},
    {"slug": "kingsborough", "name": "Kingsborough Community College", "short": "Kingsborough",
     "domain": "kbcc.cuny.edu",
     "resource_urls": ["https://www.kbcc.cuny.edu/student_life/"],
     "tier": "community",
     "theme": {"primary": "#005EB8", "accent": "#F1B521", "tint": "#E5EFF8", "ink": "#003472"}},
    {"slug": "queensborough", "name": "Queensborough Community College", "short": "Queensborough",
     "domain": "qcc.cuny.edu",
     "resource_urls": ["https://www.qcc.cuny.edu/studentAffairs/"],
     "tier": "community",
     "theme": {"primary": "#003F87", "accent": "#F2A900", "tint": "#E5EBF4", "ink": "#001F44"}},
    {"slug": "bronx-cc", "name": "Bronx Community College", "short": "Bronx CC",
     "domain": "bcc.cuny.edu",
     "resource_urls": ["https://www.bcc.cuny.edu/student-life/"],
     "tier": "community",
     "theme": {"primary": "#003B5C", "accent": "#F1B521", "tint": "#E5EEF4", "ink": "#001E2F"}},
    {"slug": "hostos", "name": "Hostos Community College", "short": "Hostos",
     "domain": "hostos.cuny.edu",
     "resource_urls": ["https://www.hostos.cuny.edu/Student-Services"],
     "tier": "community",
     "theme": {"primary": "#7B2D8E", "accent": "#F1B521", "tint": "#F2E7F5", "ink": "#4A1B57"}},
    {"slug": "guttman", "name": "Stella & Charles Guttman Community College", "short": "Guttman",
     "domain": "guttman.cuny.edu",
     "resource_urls": ["https://guttman.cuny.edu/students/"],
     "tier": "community",
     "theme": {"primary": "#005EB8", "accent": "#F1B521", "tint": "#E5EFF8", "ink": "#003472"}},
]
CAMPUS_BY_SLUG = {c["slug"]: c for c in CUNY_CAMPUSES}

CROSS_CAMPUS_TRIGGERS = {
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
    msg = message.lower()
    for slug, triggers in CROSS_CAMPUS_TRIGGERS.items():
        if slug == current_slug:
            continue
        for t in triggers:
            if re.search(rf"\b{re.escape(t)}\b", msg):
                return slug
    return None


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, username: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    token = authorization[7:].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=24)
    password: str = Field(min_length=6, max_length=128)
    home_campus: str = "john-jay"

    @field_validator("username")
    @classmethod
    def username_clean(cls, v: str) -> str:
        v = v.strip()
        if not re.fullmatch(r"[A-Za-z0-9_.\-]+", v):
            raise ValueError("Username may only contain letters, numbers, _ . -")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PublicUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    username: str
    home_campus: str
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: PublicUser


class ChatRequest(BaseModel):
    message: str
    campus: str = "john-jay"


class CitedSource(BaseModel):
    url: str
    title: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    campus: str
    sources: List[CitedSource] = []
    cross_campus_redirect: Optional[str] = None


class SavedResourceCreate(BaseModel):
    title: str
    content: str
    campus: str = "john-jay"
    sources: List[CitedSource] = []


class SavedResource(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    content: str
    campus: str
    sources: List[CitedSource] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# 3rd-party calls (Firecrawl + Tavily + Claude)
# ---------------------------------------------------------------------------
async def firecrawl_scrape(url: str, timeout_s: int = 25) -> dict:
    if not FIRECRAWL_API_KEY:
        return {"markdown": "", "title": url, "url": url}

    def _scrape() -> dict:
        try:
            from firecrawl import Firecrawl  # type: ignore
            fc = Firecrawl(api_key=FIRECRAWL_API_KEY)
            res = fc.scrape(url, formats=["markdown"], only_main_content=True, timeout=timeout_s * 1000)
            md = getattr(res, "markdown", None) or (res.get("markdown") if isinstance(res, dict) else "")
            meta = getattr(res, "metadata", None) or (res.get("metadata") if isinstance(res, dict) else {}) or {}
            if hasattr(meta, "model_dump"):
                meta = meta.model_dump()
            title = meta.get("title") if isinstance(meta, dict) else None
            return {"markdown": md or "", "title": title or url, "url": url}
        except Exception as exc:  # noqa: BLE001
            logger.warning("Firecrawl error %s: %s", url, exc)
            return {"markdown": "", "title": url, "url": url}

    return await asyncio.to_thread(_scrape)


async def tavily_search(query: str, include_domains: Optional[List[str]] = None, max_results: int = 4) -> List[dict]:
    if not TAVILY_API_KEY:
        return []

    def _search() -> List[dict]:
        try:
            from tavily import TavilyClient  # type: ignore
            tv = TavilyClient(api_key=TAVILY_API_KEY)
            params = {"query": query[:380], "max_results": min(max_results, 8), "search_depth": "basic"}
            if include_domains:
                params["include_domains"] = include_domains
            return tv.search(**params).get("results", []) or []
        except Exception as exc:  # noqa: BLE001
            logger.warning("Tavily error: %s", exc)
            return []

    return await asyncio.to_thread(_search)


async def gather_context(message: str, campus: dict) -> tuple[str, List[CitedSource]]:
    discovery = await tavily_search(f"site:{campus['domain']} {message}", include_domains=[campus["domain"]], max_results=3)
    discovered_urls = [r["url"] for r in discovery if r.get("url")]
    seed_urls = list(dict.fromkeys(campus["resource_urls"] + discovered_urls))[:4]
    scrapes = await asyncio.gather(*(firecrawl_scrape(u) for u in seed_urls))

    chunks: List[str] = []
    sources: List[CitedSource] = []
    for s in scrapes:
        md = (s.get("markdown") or "").strip()
        if not md:
            continue
        chunks.append(f"### Source: {s['title']}\nURL: {s['url']}\n\n{md[:3500]}")
        sources.append(CitedSource(url=s["url"], title=s.get("title")))

    if not chunks and discovery:
        for r in discovery[:3]:
            chunks.append(f"### Source: {r.get('title','')}\nURL: {r.get('url','')}\n\n{r.get('content','')[:1500]}")
            sources.append(CitedSource(url=r.get("url", ""), title=r.get("title")))

    context = "\n\n---\n\n".join(chunks) if chunks else "(No fresh data could be retrieved.)"
    return context, sources


async def claude_answer(message: str, context: str, campus_name: str) -> str:
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
        "Use ONLY the crawled data below to answer the student's question.\n"
        "Style rules: 3–6 sentences max unless asked for detail; **bold** time-sensitive events, "
        "deadlines, and specific room/building numbers; for events, prioritize ones open to all CUNY "
        "students; if data lacks the answer, say so and suggest who to contact; never invent URLs, "
        "rooms, dates, or names. Use light markdown.\n\n"
        f"=== CRAWLED DATA ===\n{context}\n=== END DATA ==="
    )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system_message,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    try:
        return str(await chat.send_message(UserMessage(text=message))).strip()
    except Exception as exc:  # noqa: BLE001
        logger.exception("Claude error: %s", exc)
        return "Compass AI hit a snag generating that response. Please try again."


# ---------------------------------------------------------------------------
# FastAPI app + routes
# ---------------------------------------------------------------------------
app = FastAPI(title="Student Compass API")
api = APIRouter(prefix="/api")


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.chat_messages.create_index([("user_id", 1), ("created_at", -1)])
    await db.saved_resources.create_index([("user_id", 1), ("created_at", -1)])
    logger.info("indexes ready")


@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()


# ---------- Public ----------
@api.get("/")
async def root():
    return {"app": "Student Compass", "version": "2.0"}


@api.get("/campuses")
async def list_campuses():
    return {
        "campuses": [
            {k: c[k] for k in ("slug", "name", "short", "domain", "tier", "theme")}
            for c in CUNY_CAMPUSES
        ]
    }


# ---------- Auth ----------
@api.post("/auth/register", response_model=AuthResponse)
async def register(payload: RegisterRequest):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(409, "An account with that email already exists.")
    if await db.users.find_one({"username": payload.username}):
        raise HTTPException(409, "That username is taken — try another.")
    if payload.home_campus not in CAMPUS_BY_SLUG:
        raise HTTPException(400, "Invalid home campus.")

    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "username": payload.username,
        "password_hash": hash_password(payload.password),
        "home_campus": payload.home_campus,
        "failed_attempts": 0,
        "lock_until": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)

    public = PublicUser(
        id=user_doc["id"],
        email=email,
        username=payload.username,
        home_campus=payload.home_campus,
        created_at=datetime.fromisoformat(user_doc["created_at"]),
    )
    token = create_access_token(public.id, public.email, public.username)
    return AuthResponse(token=token, user=public)


@api.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(404, "No account found for that email.")

    # Brute-force lock
    lock_until = user.get("lock_until")
    if lock_until:
        if isinstance(lock_until, str):
            lock_dt = datetime.fromisoformat(lock_until)
        else:
            lock_dt = lock_until
        if lock_dt > datetime.now(timezone.utc):
            wait_s = int((lock_dt - datetime.now(timezone.utc)).total_seconds())
            raise HTTPException(403, f"Too many attempts. Try again in {wait_s}s.")

    if not verify_password(payload.password, user["password_hash"]):
        attempts = int(user.get("failed_attempts", 0)) + 1
        update = {"failed_attempts": attempts}
        if attempts >= LOCKOUT_THRESHOLD:
            update["lock_until"] = (datetime.now(timezone.utc) + timedelta(seconds=LOCKOUT_SECONDS)).isoformat()
        await db.users.update_one({"id": user["id"]}, {"$set": update})
        if attempts >= LOCKOUT_THRESHOLD:
            raise HTTPException(403, f"Too many attempts. Account locked for {LOCKOUT_SECONDS}s.")
        raise HTTPException(401, "Wrong password.")

    # Success — clear lock
    await db.users.update_one({"id": user["id"]}, {"$set": {"failed_attempts": 0, "lock_until": None}})

    public = PublicUser(
        id=user["id"],
        email=user["email"],
        username=user["username"],
        home_campus=user.get("home_campus", "john-jay"),
        created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"],
    )
    token = create_access_token(public.id, public.email, public.username)
    return AuthResponse(token=token, user=public)


@api.get("/auth/me", response_model=PublicUser)
async def me(user=Depends(get_current_user)):
    created = user["created_at"]
    if isinstance(created, str):
        created = datetime.fromisoformat(created)
    return PublicUser(
        id=user["id"],
        email=user["email"],
        username=user["username"],
        home_campus=user.get("home_campus", "john-jay"),
        created_at=created,
    )


# ---------- Chat (auth required) ----------
@api.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, user=Depends(get_current_user)):
    if not req.message.strip():
        raise HTTPException(400, "message cannot be empty")
    campus_slug = req.campus if req.campus in CAMPUS_BY_SLUG else "john-jay"
    redirect = detect_cross_campus(req.message, campus_slug)
    target_slug = redirect or campus_slug
    campus = CAMPUS_BY_SLUG[target_slug]

    context, sources = await gather_context(req.message, campus)
    answer = await claude_answer(req.message, context, campus["name"])

    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "campus": target_slug,
        "query": req.message,
        "answer": answer,
        "sources": [s.model_dump() for s in sources],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return ChatResponse(answer=answer, campus=target_slug, sources=sources, cross_campus_redirect=redirect)


@api.get("/history")
async def history(limit: int = 25, user=Depends(get_current_user)):
    cur = (
        db.chat_messages.find({"user_id": user["id"]}, {"_id": 0})
        .sort("created_at", -1)
        .limit(limit)
    )
    return {"items": await cur.to_list(length=limit)}


# ---------- Saved resources (auth required) ----------
@api.post("/saved-resources", response_model=SavedResource)
async def save_resource(payload: SavedResourceCreate, user=Depends(get_current_user)):
    obj = SavedResource(user_id=user["id"], **payload.model_dump())
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.saved_resources.insert_one(doc)
    return obj


@api.get("/saved-resources")
async def list_saved(user=Depends(get_current_user)):
    cur = db.saved_resources.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    return {"items": await cur.to_list(length=200)}


@api.delete("/saved-resources/{resource_id}")
async def delete_saved(resource_id: str, user=Depends(get_current_user)):
    res = await db.saved_resources.delete_one({"id": resource_id, "user_id": user["id"]})
    return {"deleted": res.deleted_count}


# ---------------------------------------------------------------------------
# Wire up
# ---------------------------------------------------------------------------
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
