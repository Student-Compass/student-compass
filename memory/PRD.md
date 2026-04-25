# Student Compass — PRD

## Original Problem Statement
Build a full-stack web application "Student Compass" — an AI-powered assistant for CUNY students to navigate campus resources and discover events across the entire CUNY network. Flagship: John Jay College. Architecture must support cross-campus retrieval. Stack chosen: FastAPI backend (equivalent to Node/Express), React + Tailwind frontend, Anthropic Claude Sonnet 4.5 (via Emergent Universal Key), Firecrawl scraping, Tavily search, MongoDB persistence.

## Architecture
- **Backend**: FastAPI + Motor (async MongoDB). Endpoints prefixed `/api`.
- **Frontend**: React (CRA), Tailwind, shadcn/ui, Framer Motion, react-fast-marquee, Lucide icons, sonner toasts.
- **AI/RAG**: For each chat turn → Tavily discovers URLs (site-restricted) → Firecrawl scrapes them to Markdown → Claude Sonnet 4.5 answers using only the crawled context, citing sources.
- **Cross-campus**: curated trigger phrases per campus auto-redirect target URLs.

## Core Endpoints
- `GET /api/campuses` — 17 CUNY campuses (slug, name, short, domain, tier, color)
- `POST /api/chat` — RAG chat returning answer + sources + cross_campus_redirect
- `GET /api/sessions/{sid}/history` — recent queries
- `POST/GET/DELETE /api/saved-resources` — bookmark CRUD

## User Personas
- **CUNY Undergraduate** (primary): needs fast answers about events, advising, financial-aid deadlines, ID replacement, safety.
- **Cross-campus visitor**: a Baruch student asking about a Hunter event.
- **Advisor / Staff** (secondary): wants a single fact-checked surface to direct students to.

## Implemented (Feb 2026)
- [x] Spinning Compass SVG with `calibrateSpin` 6s cubic-bezier snap-to-north animation
- [x] Landing page: hero, sample reply card, CUNY logo marquee (greyscale → color hover), "How it works"
- [x] Searchable Campus Switcher (Popover + Command, senior + community groups)
- [x] John Jay Resource Center: massive hero search → Framer Motion `layoutId` progressive disclosure → Claude-style chat
- [x] 4 Suggestion Tiles (Cross-Campus Events, ID Replacement/Safety, Financial Aid Deadlines, Academic Advising)
- [x] Collapsible Sidebar with Recent Queries + Saved Resources, MongoDB-persisted
- [x] AI replies with sources chips + Save Resource button
- [x] Cross-campus query detection with curated triggers
- [x] All endpoints tested (8/8 pytest pass) and full frontend Playwright e2e (100% pass)

## Backlog
### P1
- [ ] Replace markdown injection with sanitized renderer (DOMPurify or react-markdown)
- [ ] Add lightweight rate-limit on `/api/chat` (paid APIs)
- [ ] Keep sidebar visible on "New conversation" once any history exists

### P2
- [ ] Per-campus theming (color accent shifts when switching)
- [ ] "Email this to me" or "Add to Calendar" actions on event answers
- [ ] Authenticated favorites that persist across devices (Emergent Google Auth)
- [ ] Streaming Claude responses for faster perceived latency
- [ ] Trim context dynamically by token count instead of char cap

## Next Tasks (priority order)
1. Sanitize markdown rendering (replace dangerouslySetInnerHTML)
2. Rate-limit chat endpoint (per session_id, e.g., 30 req / 5 min)
3. Sidebar persistence after "New conversation"
4. Per-campus accent theming
