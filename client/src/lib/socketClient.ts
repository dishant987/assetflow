import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(token: string) {
  if (socket?.connected) return socket;
  const rawUrl = import.meta.env.VITE_API_URL?.toString().trim() || "";
  const url = rawUrl.replace(/\/+$|\/api$/i, "");
  socket = io(url || undefined, { auth: { token }, transports: ["websocket", "polling"] });
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

export function getSocket() {
  return socket;
}
