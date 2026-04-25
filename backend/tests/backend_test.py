"""Student Compass backend tests.

Covers:
- /api/campuses (17 CUNY campuses)
- /api/chat (RAG: Firecrawl + Tavily + Claude); empty msg validation; cross-campus redirect
- /api/sessions/{sid}/history
- /api/saved-resources CRUD
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://jjay-compass.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
SESSION_ID = f"TEST_{uuid.uuid4()}"
CHAT_TIMEOUT = 120  # /api/chat does live Firecrawl scrapes


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ----- /api/campuses -----
class TestCampuses:
    def test_list_campuses_returns_17(self, s):
        r = s.get(f"{API}/campuses", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "campuses" in data
        assert len(data["campuses"]) == 17, f"expected 17 got {len(data['campuses'])}"
        c0 = data["campuses"][0]
        # Required keys
        for key in ("slug", "name", "short", "domain", "tier", "color"):
            assert key in c0, f"missing key {key}"
        slugs = {c["slug"] for c in data["campuses"]}
        for needed in ("john-jay", "hunter", "baruch"):
            assert needed in slugs


# ----- /api/chat -----
class TestChat:
    def test_chat_empty_message_returns_400(self, s):
        r = s.post(f"{API}/chat", json={"message": "  ", "campus": "john-jay", "session_id": SESSION_ID}, timeout=30)
        assert r.status_code == 400, r.text

    def test_chat_john_jay_basic(self, s):
        payload = {
            "message": "Where is the financial aid office?",
            "campus": "john-jay",
            "session_id": SESSION_ID,
        }
        r = s.post(f"{API}/chat", json=payload, timeout=CHAT_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["session_id"] == SESSION_ID
        assert data["campus"] == "john-jay"
        assert isinstance(data["answer"], str) and len(data["answer"]) > 20
        assert isinstance(data["sources"], list)
        # Cross-campus should be None for a generic JJ query
        assert data.get("cross_campus_redirect") in (None, "")

    def test_chat_cross_campus_redirect_to_hunter(self, s):
        payload = {
            "message": "How do I apply for events at Hunter?",
            "campus": "john-jay",
            "session_id": SESSION_ID,
        }
        r = s.post(f"{API}/chat", json=payload, timeout=CHAT_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["cross_campus_redirect"] == "hunter", data
        assert data["campus"] == "hunter"


# ----- /api/sessions/{sid}/history -----
class TestHistory:
    def test_history_contains_inserted_chat(self, s):
        # Reuses SESSION_ID populated by TestChat. If chat tests skipped, insert one.
        r = s.get(f"{API}/sessions/{SESSION_ID}/history", timeout=30)
        assert r.status_code == 200, r.text
        items = r.json()["items"]
        assert isinstance(items, list)
        if not items:
            # Fallback: insert one
            s.post(
                f"{API}/chat",
                json={"message": "What are the public safety hours?", "campus": "john-jay", "session_id": SESSION_ID},
                timeout=CHAT_TIMEOUT,
            )
            time.sleep(1)
            items = s.get(f"{API}/sessions/{SESSION_ID}/history", timeout=30).json()["items"]
        assert len(items) >= 1
        first = items[0]
        for k in ("id", "session_id", "campus", "query", "answer", "created_at"):
            assert k in first
        # _id should NOT be returned
        assert "_id" not in first


# ----- /api/saved-resources -----
class TestSavedResources:
    created_id = None

    def test_create_saved_resource(self, s):
        payload = {
            "session_id": SESSION_ID,
            "title": "TEST_FinancialAid",
            "content": "Visit room L.61 NB for FA help.",
            "campus": "john-jay",
            "sources": [{"url": "https://www.jjay.cuny.edu/financial-aid", "title": "FA"}],
        }
        r = s.post(f"{API}/saved-resources", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and data["title"] == "TEST_FinancialAid"
        assert data["session_id"] == SESSION_ID
        TestSavedResources.created_id = data["id"]

    def test_list_saved_resources(self, s):
        r = s.get(f"{API}/saved-resources", params={"session_id": SESSION_ID}, timeout=30)
        assert r.status_code == 200, r.text
        items = r.json()["items"]
        assert any(x["id"] == TestSavedResources.created_id for x in items), items
        # No mongo _id leaked
        for it in items:
            assert "_id" not in it

    def test_delete_saved_resource(self, s):
        rid = TestSavedResources.created_id
        assert rid, "create test must run first"
        r = s.delete(f"{API}/saved-resources/{rid}", timeout=30)
        assert r.status_code == 200, r.text
        assert r.json().get("deleted") == 1
        # Verify removed
        items = s.get(f"{API}/saved-resources", params={"session_id": SESSION_ID}, timeout=30).json()["items"]
        assert all(x["id"] != rid for x in items)
