import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "./env";

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });
  return io;
}

export function getIO() {
  return io;
}
