import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/api";

export type User = {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "manager" | "employee";
  status: string;
  departmentId: number | null;
  phone: string | null;
  designation: string | null;
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
};

export const useAuthStore = create<State & Actions>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      login: async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        set({ user: data.data.user, accessToken: data.data.accessToken });
      },
      logout: async () => {
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
    }),
    { name: "assetflow-auth" },
  ),
);
