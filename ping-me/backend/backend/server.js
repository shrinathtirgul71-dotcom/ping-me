require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const webpush = require("web-push");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// VAPID setup
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const callers = [
  { id: "1", name: "Reception", emoji: "📞" },
];

// Store push subscriptions
let pushSubscriptions = [];

// Get callers
app.get("/callers", (req, res) => res.json(callers));

// Get VAPID public key
app.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Save push subscription from phone
app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  const exists = pushSubscriptions.find(
    (s) => s.endpoint === subscription.endpoint
  );
  if (!exists) {
    pushSubscriptions.push(subscription);
    console.log("📱 New push subscription saved!");
  }
  res.json({ success: true });
});

// Send ping
app.post("/ping", (req, res) => {
  const { callerId, message, callerName } = req.body;

  const caller = callers.find((c) => c.id === callerId);
  if (!caller) return res.status(404).json({ error: "Caller not found" });

  const ping = {
    caller: { ...caller, name: callerName || caller.name },
    message: message || "",
    time: new Date().toISOString(),
  };

  // Socket.io for open browser tabs
  io.emit("incoming-ping", ping);

  // Push notification for background/locked screen
  const payload = JSON.stringify({
    title: `📞 ${ping.caller.name} is calling!`,
    body: ping.message || "Someone is calling you!",
    icon: "/favicon.svg",
  });

  pushSubscriptions.forEach((sub) => {
    webpush.sendNotification(sub, payload).catch((err) => {
      console.error("Push failed:", err.statusCode);
      // Remove invalid subscriptions
      if (err.statusCode === 410) {
        pushSubscriptions = pushSubscriptions.filter(
          (s) => s.endpoint !== sub.endpoint
        );
      }
    });
  });

  console.log(`📣 Ping sent from ${ping.caller.name}`);
  res.json({ success: true, ping });
});

io.on("connection", (socket) => {
  console.log(`✅ Connected: ${socket.id}`);
  socket.on("disconnect", () => console.log(`❌ Disconnected: ${socket.id}`));
});

app.get("/", (req, res) =>
  res.json({ status: "Ping Me server is running 🚀" })
);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);