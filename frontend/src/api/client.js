import axios from "axios";

const envBase = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: envBase || "http://127.0.0.1:8000/api/v1",
  timeout: 60000,
});

if (!envBase) {
  console.warn(
    "VITE_API_BASE_URL not set. Falling back to http://127.0.0.1:8000/api/v1 (local only)."
  );
}

export default api;
