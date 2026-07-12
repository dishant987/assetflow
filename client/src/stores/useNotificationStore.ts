import { create } from "zustand";

export type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  link: string | null;
  createdAt: string;
};

type State = {
  unread: number;
  items: Notification[];
  loading: boolean;
  setUnread: (n: number) => void;
  setItems: (items: Notification[]) => void;
  setLoading: (v: boolean) => void;
  addNotification: (n: Notification) => void;
};

export const useNotificationStore = create<State>((set) => ({
  unread: 0,
  items: [],
  loading: false,
  setUnread: (n) => set({ unread: n }),
  setItems: (items) => set({ items }),
  setLoading: (v) => set({ loading: v }),
  addNotification: (n) =>
    set((s) => ({ items: [n, ...s.items], unread: s.unread + 1 })),
}));
