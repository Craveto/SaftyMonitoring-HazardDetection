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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const method = (config.method || "").toLowerCase();
    const status = error.response?.status;
    const shouldRetry =
      method === "get" &&
      (!status || status >= 500) &&
      (config.__retryCount || 0) < 3;

    if (!shouldRetry) {
      return Promise.reject(error);
    }

    config.__retryCount = (config.__retryCount || 0) + 1;
    const delay = 500 * Math.pow(2, config.__retryCount - 1);
    await sleep(delay);
    return api(config);
  }
);

export default api;
