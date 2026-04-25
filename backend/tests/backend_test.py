"""Student Compass — Iteration 2 backend tests.

Covers:
- /api/campuses (17 CUNY campuses, full theme object per campus)
- /api/auth/register (success, dup email 409, dup username 409, weak pw 422, bad email 422)
- /api/auth/login (success, wrong pw 401, brute-force 3x => 403 lock, lock blocks subsequent)
- /api/auth/me (200 with bearer; 401 without; 401 with bad token)
- /api/chat (auth required; returns answer+sources; cross-campus redirect)
- /api/history (scoped per user)
- /api/saved-resources CRUD (scoped per user; DELETE only own)
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
CHAT_TIMEOUT = 120  # /api/chat does live Firecrawl scrapes


def _new_user_payload(home="hunter"):
    tag = uuid.uuid4().hex[:8]
    return {
        "email": f"TEST_{tag}@cuny.edu",
        "username": f"TEST_{tag}",
        "password": "compass123",
        "home_campus": home,
    }


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def auth_user(s):
    """Register a fresh user; return (token, user, payload)."""
    payload = _new_user_payload(home="hunter")
    r = s.post(f"{API}/auth/register", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    return data["token"], data["user"], payload


# ----- /api/campuses with theme -----
class TestCampuses:
    def test_list_campuses_returns_17_with_theme(self, s):
        r = s.get(f"{API}/campuses", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "campuses" in data
        assert len(data["campuses"]) == 17, f"expected 17 got {len(data['campuses'])}"
        c0 = data["campuses"][0]
        for key in ("slug", "name", "short", "domain", "tier", "theme"):
            assert key in c0, f"missing {key}"
        for tk in ("primary", "accent", "tint", "ink"):
            assert tk in c0["theme"], f"missing theme.{tk}"

    def test_campus_specific_theme_colors(self, s):
        r = s.get(f"{API}/campuses", timeout=30)
        by = {c["slug"]: c for c in r.json()["campuses"]}
        assert by["laguardia"]["theme"]["primary"].upper() == "#C8102E"
        assert by["hunter"]["theme"]["primary"].upper() == "#7B2D8E"
        assert by["john-jay"]["theme"]["primary"].upper() == "#003366"


# ----- /api/auth/register -----
class TestRegister:
    def test_register_success_returns_token_and_user(self, s):
        payload = _new_user_payload()
        r = s.post(f"{API}/auth/register", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 20
        u = data["user"]
        for k in ("id", "email", "username", "home_campus", "created_at"):
            assert k in u
        assert u["email"] == payload["email"].lower()
        assert u["username"] == payload["username"]
        assert u["home_campus"] == payload["home_campus"]
        assert "password_hash" not in u and "_id" not in u

    def test_register_duplicate_email_returns_409(self, s):
        p = _new_user_payload()
        assert s.post(f"{API}/auth/register", json=p, timeout=30).status_code == 200
        # Same email, different username
        p2 = dict(p, username=f"TEST_{uuid.uuid4().hex[:8]}")
        r = s.post(f"{API}/auth/register", json=p2, timeout=30)
        assert r.status_code == 409, r.text

    def test_register_duplicate_username_returns_409(self, s):
        p = _new_user_payload()
        assert s.post(f"{API}/auth/register", json=p, timeout=30).status_code == 200
        p2 = dict(p, email=f"TEST_{uuid.uuid4().hex[:8]}@cuny.edu")
        r = s.post(f"{API}/auth/register", json=p2, timeout=30)
        assert r.status_code == 409, r.text

    def test_register_weak_password_rejected(self, s):
        p = _new_user_payload()
        p["password"] = "abc"  # < 6
        r = s.post(f"{API}/auth/register", json=p, timeout=30)
        assert r.status_code in (400, 422), r.text

    def test_register_bad_email_rejected(self, s):
        p = _new_user_payload()
        p["email"] = "not-an-email"
        r = s.post(f"{API}/auth/register", json=p, timeout=30)
        assert r.status_code in (400, 422), r.text


# ----- /api/auth/login + brute-force lockout -----
class TestLogin:
    def test_login_success(self, s):
        p = _new_user_payload()
        s.post(f"{API}/auth/register", json=p, timeout=30)
        r = s.post(f"{API}/auth/login", json={"email": p["email"], "password": p["password"]}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "token" in d and d["user"]["email"] == p["email"].lower()

    def test_login_wrong_password_returns_401(self, s):
        p = _new_user_payload()
        s.post(f"{API}/auth/register", json=p, timeout=30)
        r = s.post(f"{API}/auth/login", json={"email": p["email"], "password": "wrongpass"}, timeout=30)
        assert r.status_code == 401, r.text

    def test_brute_force_locks_after_threshold(self, s):
        p = _new_user_payload()
        s.post(f"{API}/auth/register", json=p, timeout=30)
        codes = []
        for _ in range(3):
            r = s.post(f"{API}/auth/login", json={"email": p["email"], "password": "wrong"}, timeout=30)
            codes.append(r.status_code)
        # First two wrong => 401, third should trigger 403 lock
        assert codes[0] == 401 and codes[1] == 401, codes
        assert codes[2] == 403, codes
        # Subsequent attempt within 60s also 403
        r4 = s.post(f"{API}/auth/login", json={"email": p["email"], "password": p["password"]}, timeout=30)
        assert r4.status_code == 403, r4.text
        assert "Too many attempts" in r4.json().get("detail", "") or "locked" in r4.json().get("detail", "").lower()


# ----- /api/auth/me -----
class TestMe:
    def test_me_with_valid_bearer(self, s, auth_user):
        token, user, _ = auth_user
        r = s.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=30)
        assert r.status_code == 200, r.text
        me = r.json()
        assert me["id"] == user["id"]
        assert me["username"] == user["username"]
        assert "password_hash" not in me

    def test_me_without_token_401(self, s):
        r = s.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401, r.text

    def test_me_with_bad_token_401(self, s):
        r = s.get(f"{API}/auth/me", headers={"Authorization": "Bearer not.a.real.jwt"}, timeout=30)
        assert r.status_code == 401, r.text


# ----- /api/chat (auth required) -----
class TestChat:
    def test_chat_requires_auth(self, s):
        r = s.post(f"{API}/chat", json={"message": "hi", "campus": "john-jay"}, timeout=30)
        assert r.status_code == 401, r.text

    def test_chat_success_returns_answer_and_sources(self, s, auth_user):
        token, _, _ = auth_user
        r = s.post(
            f"{API}/chat",
            headers={"Authorization": f"Bearer {token}"},
            json={"message": "Where is the financial aid office?", "campus": "john-jay"},
            timeout=CHAT_TIMEOUT,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert isinstance(d["answer"], str) and len(d["answer"]) > 20
        assert d["campus"] == "john-jay"
        assert isinstance(d["sources"], list)
        assert d.get("cross_campus_redirect") in (None, "")

    def test_chat_cross_campus_redirect_to_hunter(self, s, auth_user):
        token, _, _ = auth_user
        r = s.post(
            f"{API}/chat",
            headers={"Authorization": f"Bearer {token}"},
            json={"message": "How do I apply for events at Hunter College?", "campus": "john-jay"},
            timeout=CHAT_TIMEOUT,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["cross_campus_redirect"] == "hunter", d
        assert d["campus"] == "hunter"


# ----- /api/history -----
class TestHistory:
    def test_history_requires_auth(self, s):
        r = s.get(f"{API}/history", timeout=30)
        assert r.status_code == 401

    def test_history_scoped_to_user(self, s, auth_user):
        token, _, _ = auth_user
        r = s.get(f"{API}/history", headers={"Authorization": f"Bearer {token}"}, timeout=30)
        assert r.status_code == 200, r.text
        items = r.json()["items"]
        assert isinstance(items, list)
        # We ran chats above (depending on order) — just ensure items have correct shape.
        for it in items:
            assert "_id" not in it
            for k in ("id", "campus", "query", "answer", "created_at"):
                assert k in it


# ----- /api/saved-resources -----
class TestSavedResources:
    def test_saved_requires_auth(self, s):
        r = s.get(f"{API}/saved-resources", timeout=30)
        assert r.status_code == 401

    def test_saved_crud_scoped_per_user(self, s, auth_user):
        token, user, _ = auth_user
        h = {"Authorization": f"Bearer {token}"}
        # Create
        payload = {
            "title": "TEST_FA",
            "content": "Visit room L.61 NB",
            "campus": "hunter",
            "sources": [{"url": "https://hunter.cuny.edu/financial-aid", "title": "FA"}],
        }
        r = s.post(f"{API}/saved-resources", json=payload, headers=h, timeout=30)
        assert r.status_code == 200, r.text
        rid = r.json()["id"]
        assert r.json()["title"] == "TEST_FA"
        assert r.json()["user_id"] == user["id"]

        # List shows it
        r2 = s.get(f"{API}/saved-resources", headers=h, timeout=30)
        assert r2.status_code == 200
        items = r2.json()["items"]
        assert any(x["id"] == rid for x in items)
        for it in items:
            assert "_id" not in it

        # Other user cannot delete it
        other = _new_user_payload()
        ro = s.post(f"{API}/auth/register", json=other, timeout=30).json()
        h2 = {"Authorization": f"Bearer {ro['token']}"}
        rdel_other = s.delete(f"{API}/saved-resources/{rid}", headers=h2, timeout=30)
        assert rdel_other.status_code == 200
        assert rdel_other.json().get("deleted") == 0  # nothing deleted (not owner)

        # Owner can delete
        rd = s.delete(f"{API}/saved-resources/{rid}", headers=h, timeout=30)
        assert rd.status_code == 200 and rd.json().get("deleted") == 1

        # Verify gone
        items2 = s.get(f"{API}/saved-resources", headers=h, timeout=30).json()["items"]
        assert all(x["id"] != rid for x in items2)
