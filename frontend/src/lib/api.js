import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

export const fetchCampuses = async () => (await client.get("/campuses")).data.campuses;

export const askCompass = async ({ message, campus, sessionId }) => {
  const res = await client.post("/chat", {
    message,
    campus,
    session_id: sessionId,
  });
  return res.data;
};

export const fetchHistory = async (sessionId) =>
  (await client.get(`/sessions/${sessionId}/history`)).data.items;

export const fetchSaved = async (sessionId) =>
  (await client.get(`/saved-resources`, { params: { session_id: sessionId } })).data.items;

export const saveResource = async (payload) =>
  (await client.post("/saved-resources", payload)).data;

export const deleteResource = async (id) =>
  (await client.delete(`/saved-resources/${id}`)).data;

// Get-or-create persistent session id (per browser).
export const getSessionId = () => {
  let sid = localStorage.getItem("sc_session_id");
  if (!sid) {
    sid = (crypto.randomUUID && crypto.randomUUID()) || `sc_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem("sc_session_id", sid);
  }
  return sid;
};
