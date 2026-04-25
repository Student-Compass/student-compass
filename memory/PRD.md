# Student Compass — PRD

## Original Problem Statement
Build a full-stack web application "Student Compass" — an AI assistant for CUNY students to navigate campus resources and discover events across the entire CUNY network. Flagship: John Jay; architecture supports cross-campus retrieval.

## Architecture
- **Backend**: FastAPI + Motor (async MongoDB), bcrypt + pyjwt for JWT auth
- **Frontend**: React (CRA), Tailwind, shadcn/ui, Framer Motion, react-fast-marquee, Lucide, sonner
- **AI/RAG**: Tavily site-restricted search → Firecrawl scrape to Markdown → Claude Sonnet 4.5
- **Auth model**: JWT in `Authorization: Bearer` header (token in localStorage); brute-force lockout 3 attempts → 60s; **guest mode** allows full chat usage without an account, but nothing persists
- **Per-campus theming**: each of 17 campuses has unique `{primary, accent, tint, ink}` palette applied via CSS variables in the Resource Hub

## Endpoints
**Public**
- `GET /api/campuses`
- `POST /api/auth/register`, `POST /api/auth/login` (generic 401 to prevent enumeration)
- `POST /api/chat` — **guest-friendly**, optional auth; persists only when authenticated

**Auth required**
- `GET /api/auth/me`
- `GET /api/history`
- `POST/GET/DELETE /api/saved-resources`

## User Personas
- **CUNY Undergraduate** (primary): one place to ask any campus question
- **Cross-campus visitor**: asking about a different CUNY college
- **Casual try-it-out user (guest)**: ask once, no signup, no save
- **Commuter** with 15 minutes between classes; **Freshman** learning acronyms

## Implemented (Feb 2026)
### Iteration 1
- [x] Spinning Compass logo with `calibrateSpin` animation
- [x] Searchable Campus Switcher (17 colleges)
- [x] CUNY logo marquee (greyscale → color hover)
- [x] Resource Center with progressive disclosure → Claude-style chat
- [x] 4 Suggestion Tiles, Sidebar (Recent + Saved), Save Resource
- [x] Cross-campus query detection
- [x] Real RAG (Tavily + Firecrawl + Claude Sonnet 4.5)

### Iteration 2 — Auth + Theming
- [x] Home / Main Menu page with About story
- [x] Login + Signup pages with split-panel CUNY-navy aesthetic
- [x] JWT auth, bcrypt, brute-force lockout (3 → 60s)
- [x] User menu in header (My Hub, Sign out)
- [x] Per-campus accent theming on Resource Hub (banner gradient, primary buttons)
- [x] Generic 401 to prevent account-enumeration

### Iteration 3 — Guest Mode (current)
- [x] `POST /api/chat` accepts optional auth — guests get full Claude RAG, no persistence
- [x] Removed ProtectedRoute on `/campus/*` — public access
- [x] Three CTAs on home: "Create your account", "Sign in", "Try without signing up"
- [x] Guest disclaimer copy on home page
- [x] Resource Hub gold banner: "Guest mode — ask anything you want. Nothing is saved..."
- [x] "Sign up to save" CTA in banner; clicking Save Resource as guest → toast + redirect to /signup
- [x] Pill differentiator: "Guest hub" vs "Resource Hub"
- [x] Guest recent queries kept in component state (last 25); wiped on reload (expected)

## Backlog
### P1
- [ ] Persist guest recent-queries to sessionStorage (survives campus switching within same tab)
- [ ] Sanitize markdown rendering (DOMPurify or react-markdown)
- [ ] IP-based rate-limit on `/api/auth/login`
- [ ] Per-IP rate-limit on `/api/chat` (paid Firecrawl + Claude)

### P2
- [ ] Forgot-password flow (Resend/SMTP)
- [ ] Add-to-Calendar / Email-this on event answers (shareability)
- [ ] Streaming Claude responses
- [ ] Public profile pages at `/u/{username}` with shareable saved resources
- [ ] Migrate `on_event` to FastAPI lifespan context manager
- [ ] Auth-loading skeleton placeholder for ResourceCenter (replace synchronous token check)

## Next Tasks (priority order)
1. Per-IP rate-limit on `/api/chat` (now that guests can hammer it freely)
2. sessionStorage for guest recents
3. Markdown sanitization
4. Forgot-password flow
5. Public profile + share links
