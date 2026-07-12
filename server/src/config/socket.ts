import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./env";

let io: Server;

interface SocketData {
  userId: string;
}

const allowedOrigins = env.CORS_ORIGINS.split(",").map((s: string) => s.trim());

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("UNAUTHORIZED"));
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; role: string };
      (socket as Socket & { data: SocketData }).data = { userId: payload.userId };
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket as Socket & { data: SocketData }).data.userId;
    socket.join(`employee:${userId}`);
    socket.on("disconnect", () => {});
  });

  return io;
}

export function getIO() {
  return io;
}
