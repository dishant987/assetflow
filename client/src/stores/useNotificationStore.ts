import { create } from "zustand";

type Notification = {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type State = {
  unread: number;
  items: Notification[];
  setUnread: (n: number) => void;
  setItems: (items: Notification[]) => void;
};

export const useNotificationStore = create<State>((set) => ({
  unread: 0,
  items: [],
  setUnread: (n) => set({ unread: n }),
  setItems: (items) => set({ items }),
}));
