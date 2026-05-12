require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const webpush = require("web-push");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected!"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Subscription schema
const subSchema = new mongoose.Schema({ subscription: Object });
const Sub = mongoose.model("Sub", subSchema);

// VAPID setup
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const callers = [{ id: "1", name: "Reception", emoji: "📞" }];

app.get("/callers", (req, res) => res.json(callers));

app.get("/vapid-public-key", (req, res) =>
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
);

// Save push subscription
app.post("/subscribe", async (req, res) => {
  const subscription = req.body;
  const exists = await Sub.findOne({
    "subscription.endpoint": subscription.endpoint,
  });
  if (!exists) {
    await Sub.create({ subscription });
    console.log("📱 New subscription saved to MongoDB!");
  }
  res.json({ success: true });
});

// Send ping
app.post("/ping", async (req, res) => {
  const { callerId, message, callerName } = req.body;
  const caller = callers.find((c) => c.id === callerId);
  if (!caller) return res.status(404).json({ error: "Caller not found" });

  const ping = {
    caller: { ...caller, name: callerName || caller.name },
    message: message || "",
    time: new Date().toISOString(),
  };

  // Socket.io for open tabs
  io.emit("incoming-ping", ping);

  // Push notification for closed app
  const payload = JSON.stringify({
    title: `📞 ${ping.caller.name} is calling you!`,
    body: "Tap to open Ping Me",
    icon: "/favicon.svg",
  });

  const subs = await Sub.find();
  subs.forEach(({ subscription }) => {
    webpush.sendNotification(subscription, payload).catch(async (err) => {
      if (err.statusCode === 410) {
        await Sub.deleteOne({ "subscription.endpoint": subscription.endpoint });
      }
    });
  });

  console.log(`📣 Ping from ${ping.caller.name}`);
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