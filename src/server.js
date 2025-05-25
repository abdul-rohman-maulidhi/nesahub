require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { clerkMiddleware } = require("@clerk/express");

const authenticateSocket = require("./lib/clerk");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

app.use(clerkMiddleware());
app.use(express.json());

const io = new Server(server, {
  cors: { origin: "*" },
});

const connectedUsers = new Map();

io.use(authenticateSocket);

io.on("connection", (socket) => {
  const { userId, sessionId } = socket.auth;
  connectedUsers.set(socket.id, { userId, sessionId, socketId: socket.id });

  console.log(`🚀 Connected: ${userId}`);

  socket.on("disconnect", () => {
    connectedUsers.delete(socket.id);
    console.log(`❌ Disconnected: ${userId}`);
  });
});

app.post("/webhook", (req, res) => {
  const { secret, userId, event, data } = req.body;

  if (!secret || !userId || !event || !data) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const EXPECTED_SECRET = process.env.WEBHOOK_SECRET;

  if (!EXPECTED_SECRET || secret !== EXPECTED_SECRET) {
    return res.status(403).json({ error: "Invalid or missing secret" });
  }

  const targets = [];

  for (const [socketId, user] of connectedUsers.entries()) {
    if (user.userId === userId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        targets.push(socket);
      }
    }
  }

  if (targets) {
    targets.forEach((socket) => {
      socket.emit(event, data);
    });
    return res.json({ success: true, message: "Message sent" });
  } else {
    return res.json({ message: `User ${to_userId} not connected` });
  }
});

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
