import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createServer } from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { checkinRoutes } from "./routes/checkins";
import { callRoutes } from "./routes/calls";
import { adminRoutes } from "./routes/admin";
import { prisma } from "./lib/prisma";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const kioskRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false
});

function emitAlert(payload: Record<string, string>) {
  io.emit("alert:new", payload);
}

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET ?? "dev-secret", {
    expiresIn: "8h"
  });

  return res.json({ token, role: user.role, name: user.name });
});

app.use("/api/checkins", kioskRateLimit, checkinRoutes(emitAlert));
app.use("/api/calls", kioskRateLimit, callRoutes(emitAlert));
app.use("/api/admin", adminRoutes);

io.on("connection", (socket) => {
  socket.on("webrtc:offer", ({ roomId, sdp }) => socket.broadcast.emit("webrtc:offer", { roomId, sdp }));
  socket.on("webrtc:answer", ({ roomId, sdp }) => socket.broadcast.emit("webrtc:answer", { roomId, sdp }));
  socket.on("webrtc:ice", ({ roomId, candidate }) => socket.broadcast.emit("webrtc:ice", { roomId, candidate }));
});

const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on ${port}`);
});
