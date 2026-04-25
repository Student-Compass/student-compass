import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

const TOKEN_KEY = "sc_token";

export const setToken = (t) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};
export const getToken = () => localStorage.getItem(TOKEN_KEY);

// Attach Bearer token automatically
client.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// On 401 from auth/me at boot, just clear token; UI will redirect.
client.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && e.config?.url?.endsWith("/auth/me")) {
      setToken(null);
    }
    return Promise.reject(e);
  }
);

// ---- API calls ----
export const fetchCampuses = async () => (await client.get("/campuses")).data.campuses;

export const apiRegister = async (payload) => (await client.post("/auth/register", payload)).data;
export const apiLogin = async (payload) => (await client.post("/auth/login", payload)).data;
export const apiMe = async () => (await client.get("/auth/me")).data;

export const askCompass = async ({ message, campus }) => {
  const res = await client.post("/chat", { message, campus });
  return res.data;
};
export const fetchHistory = async () => (await client.get("/history")).data.items;
export const fetchSaved = async () => (await client.get("/saved-resources")).data.items;
export const saveResource = async (payload) => (await client.post("/saved-resources", payload)).data;
export const deleteResource = async (id) => (await client.delete(`/saved-resources/${id}`)).data;

export const formatApiError = (err) => {
  const detail = err?.response?.data?.detail;
  if (!detail) return err?.message || "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg || JSON.stringify(d)).join(" ");
  if (detail.msg) return detail.msg;
  return String(detail);
};
