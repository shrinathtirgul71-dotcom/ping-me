require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// ─── Socket.io setup ───────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace * with your frontend URL
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// ─── In-memory store of callers (you can move this to MongoDB later) ───────
const callers = [
  { id: "1", name: "Reception", emoji: "📞" },
];
// ─── REST: get list of callers ─────────────────────────────────────────────
app.get("/callers", (req, res) => {
  res.json(callers);
});

// ─── REST: send a ping ─────────────────────────────────────────────────────
// Body: { callerId: "1", message: "Bring tea" }
app.post("/ping", (req, res) => {
  const { callerId, message } = req.body;

  // Find the caller
  const caller = callers.find((c) => c.id === callerId);
  if (!caller) {
    return res.status(404).json({ error: "Caller not found" });
  }

  // Build ping payload
  const ping = {
    caller,
    message: message || "",
    time: new Date().toISOString(),
  };

  // Broadcast to ALL connected phone clients
  io.emit("incoming-ping", ping);

  console.log(`📣 Ping sent from ${caller.name}: "${message}"`);
  res.json({ success: true, ping });
});

// ─── Socket.io connection log ──────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ─── Health check ──────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Ping Me server is running 🚀" });
});

// ─── Start server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});