import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socketClient";

export type User = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "manager" | "department_head" | "employee";
  status: string;
  departmentId: string | null;
  phone: string | null;
  designation: string | null;
  avatarUrl: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type State = {
  user: User | null;
  accessToken: string | null;
};

type Actions = {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchSession: () => Promise<void>;
  setUser: (user: User) => void;
};

export const useAuthStore = create<State & Actions>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      login: async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        set({ user: data.data.user, accessToken: data.data.accessToken });
        connectSocket(data.data.accessToken);
      },
      logout: async () => {
        disconnectSocket();
        set({ user: null, accessToken: null });
        try { await api.post("/auth/logout"); } catch { /* ignore */ }
      },
      fetchSession: async () => {
        try {
          const { data } = await api.get("/auth/session");
          set({ user: data.data });
        } catch {
          set({ user: null, accessToken: null });
        }
      },
      setUser: (user) => set({ user }),
    }),
    { name: "assetflow-auth" },
  ),
);
