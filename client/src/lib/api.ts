import axios from "axios";

const api = axios.create({ baseURL: "/api", withCredentials: true });

type AuthAccessor = {
  getToken: () => string | null;
  setAuth: (user: unknown, accessToken: string) => void;
  clearAuth: () => void;
};

let auth: AuthAccessor | null = null;

export function injectAuth(a: AuthAccessor) {
  auth = a;
}

api.interceptors.request.use((config) => {
  const token = auth?.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshing) {
        refreshing = axios.post("/api/auth/refresh", {}, { withCredentials: true })
          .then(({ data }) => {
            auth?.setAuth(data.data.user, data.data.accessToken);
          })
          .catch(() => {
            auth?.clearAuth();
          });
      }
      await refreshing;
      refreshing = null;
      original.headers.Authorization = `Bearer ${auth?.getToken()}`;
      return api(original);
    }
    return Promise.reject(error);
  },
);

export default api;
