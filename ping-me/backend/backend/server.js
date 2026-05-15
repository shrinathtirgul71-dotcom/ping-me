require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const webpush = require("web-push");
const mongoose = require("mongoose");

// ─── Ntfy notification ─────────────────────────────────────────────────────
async function sendNtfy(name) {
  try {
    await fetch("https://ntfy.sh/pingme-officeboy-123", {
      method: "POST",
      headers: {
        "Title": "Ping Me - Incoming Call",
        "Priority": "urgent",
        "Tags": "bell",
        "Content-Type": "text/plain",
      },
      body: `${name} is calling you! Come to Reception.`,
    });
    console.log("📲 Ntfy sent!");
  } catch (e) {
    console.error("Ntfy error:", e.message);
  }
}

// ─── Telegram notification ─────────────────────────────────────────────────
async function sendTelegram(name) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const text = `🔔 <b>${name}</b> is calling you!\n\n📍 Reception Area\n🕐 ${new Date().toLocaleTimeString("en-IN")}`;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    console.log("📨 Telegram sent!");
  } catch (e) {
    console.error("Telegram error:", e.message);
  }
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// ─── MongoDB ───────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected!"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const subSchema = new mongoose.Schema({ subscription: Object });
const Sub = mongoose.model("Sub", subSchema);

// ─── VAPID ─────────────────────────────────────────────────────────────────
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const callers = [{ id: "1", name: "Reception", emoji: "📞" }];

// ─── Routes ────────────────────────────────────────────────────────────────
app.get("/", (req, res) =>
  res.json({ status: "Ping Me server is running 🚀" })
);

app.get("/callers", (req, res) => res.json(callers));

app.get("/vapid-public-key", (req, res) =>
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
);

app.post("/subscribe", async (req, res) => {
  const subscription = req.body;
  const exists = await Sub.findOne({
    "subscription.endpoint": subscription.endpoint,
  });
  if (!exists) {
    await Sub.create({ subscription });
    console.log("📱 New subscription saved!");
  }
  res.json({ success: true });
});

app.post("/ping", async (req, res) => {
  const { callerId, callerName } = req.body;
  const caller = callers.find((c) => c.id === callerId);
  if (!caller) return res.status(404).json({ error: "Caller not found" });

  const ping = {
    caller: { ...caller, name: callerName || caller.name },
    message: `${callerName || caller.name} is calling you!`,
    time: new Date().toISOString(),
  };

  // 1. Socket.io — for open browser
  io.emit("incoming-ping", ping);

  // 2. Web Push — for PWA background
  const payload = JSON.stringify({
    title: `📞 ${ping.caller.name} is calling!`,
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

  // 3. Ntfy — works always, screen off, app closed
  await sendNtfy(ping.caller.name);

  // 4. Telegram — backup
  await sendTelegram(ping.caller.name);

  console.log(`📣 Ping from ${ping.caller.name}`);
  res.json({ success: true, ping });
});

// ─── Socket.io ─────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`✅ Connected: ${socket.id}`);
  socket.on("disconnect", () =>
    console.log(`❌ Disconnected: ${socket.id}`)
  );
});

// ─── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);