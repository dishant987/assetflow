import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useAuthStore } from "./stores/useAuthStore";
import { injectAuth } from "./lib/api";

injectAuth({
  getToken: () => useAuthStore.getState().accessToken,
  setAuth: (user, accessToken) => useAuthStore.setState({ user: user as never, accessToken }),
  clearAuth: () => useAuthStore.setState({ user: null, accessToken: null }),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
