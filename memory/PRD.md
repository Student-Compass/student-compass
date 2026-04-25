# Student Compass — PRD

## Original Problem Statement
Build a full-stack web application "Student Compass" — an AI-powered assistant for CUNY students to navigate campus resources and discover events across the entire CUNY network. Flagship: John Jay College. Architecture must support cross-campus retrieval. Iteration 2 added: Home/About menu, JWT auth (username + password), per-campus accent theming.

## Architecture
- **Backend**: FastAPI + Motor (async MongoDB), bcrypt + pyjwt for JWT auth
- **Frontend**: React (CRA), Tailwind, shadcn/ui, Framer Motion, react-fast-marquee, Lucide, sonner
- **AI/RAG**: Tavily site-restricted search → Firecrawl scrape to Markdown → Claude Sonnet 4.5 answers with citations (auth-required)
- **Auth**: JWT in `Authorization: Bearer` header (token in localStorage), bcrypt hashing, brute-force lockout (3 attempts → 60s)
- **Cross-campus**: curated trigger phrases auto-redirect target URL

## Per-Campus Theming
Each of the 17 CUNY campuses has a `theme` object with `primary` / `accent` / `tint` / `ink` colors. The Resource Hub applies these as CSS variables and inline styles, so John Jay = navy, Hunter = purple, LaGuardia = red, CCNY = burgundy, etc.

## Endpoints
**Public**
- `GET /api/campuses` — 17 CUNY campuses with full theme
- `POST /api/auth/register` — `{email, username, password, home_campus}` → `{token, user}`
- `POST /api/auth/login` — `{email, password}` → `{token, user}` (generic 401 to prevent enumeration)

**Auth required**
- `GET /api/auth/me` — current user
- `POST /api/chat` — RAG chat
- `GET /api/history` — user's chat history
- `POST/GET/DELETE /api/saved-resources` — bookmark CRUD scoped per user

## User Personas
- **CUNY Undergraduate** (primary): one place to ask any campus question
- **Cross-campus visitor**: Baruch student asking about Hunter
- **Commuter** with 15 minutes between classes
- **Freshman** who hasn't memorized acronyms

## Implemented (Feb 2026)
### Iteration 1
- [x] Spinning Compass SVG with `calibrateSpin` 6s cubic-bezier snap-to-north
- [x] Searchable Campus Switcher (Popover + Command, senior + community)
- [x] CUNY logo marquee (greyscale → color hover)
- [x] Resource Center: massive hero search → Framer Motion `layoutId` progressive disclosure → Claude-style chat
- [x] 4 Suggestion Tiles, Chat with sources + Save Resource, Sidebar (Recent + Saved)
- [x] Cross-campus query detection
- [x] Real RAG (Tavily + Firecrawl + Claude Sonnet 4.5)

### Iteration 2 (current)
- [x] Home / Main Menu page with About story ("group of CUNY students building for CUNY students")
- [x] Login + Signup pages with split-panel CUNY-navy brand aesthetic
- [x] JWT auth (Bearer in localStorage), bcrypt, brute-force lockout (3 → 60s)
- [x] User menu in header (username chip, My Hub, Sign out)
- [x] Per-campus theming applied to Resource Hub (banner gradient, primary buttons, headings)
- [x] Protected Route — `/campus/*` redirects to `/login`
- [x] Generic 401 to prevent account-enumeration

## Backlog
### P1
- [ ] Replace markdown injection with sanitized renderer (DOMPurify or react-markdown)
- [ ] IP-based rate limit on `/api/auth/login` (defense vs. user-rotation brute-force)
- [ ] Per-session rate limit on `/api/chat` (paid APIs)
- [ ] Sidebar persistence after "New conversation"

### P2
- [ ] Forgot password / password reset flow
- [ ] Add-to-Calendar / Email-this on event answers (shareability)
- [ ] Streaming Claude responses
- [ ] Public profile pages with username (creative show-off)
- [ ] Migrate `on_event` to FastAPI lifespan context manager

## Next Tasks (priority order)
1. Markdown sanitization
2. IP-based login rate-limit
3. Forgot-password flow (Resend / SMTP)
4. Profile pages + share links
