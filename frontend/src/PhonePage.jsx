import { useState } from "react";
import { useSocket } from "./useSocket";

const VAPID_PUBLIC_KEY = "BKe4EffBjs7QHEjkmHJD5wLPlLHpaRApYJejjyj8DmuJy7sYbLewl-OeJzncghZHrHlbtkRtcGvaJuLBZhCOulA";
const SERVER_URL = "https://ping-me-opwf.onrender.com";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  const reg = await navigator.serviceWorker.register("/sw.js");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  await fetch(`${SERVER_URL}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });
}

let audioCtx = null;
let activeSources = [];

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function stopSound() {
  activeSources.forEach((s) => { try { s.stop(); } catch (e) {} });
  activeSources = [];
}

function playAlertSound() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") ctx.resume();
  stopSound();
  const scheduleBeep = (startTime, freq, duration) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.8, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
    activeSources.push(osc);
  };
  const now = ctx.currentTime;
  for (let i = 0; i < 20; i++) {
    const t = now + i * 1.2;
    scheduleBeep(t, 880, 0.25);
    scheduleBeep(t + 0.35, 880, 0.25);
    scheduleBeep(t + 0.70, 880, 0.25);
    scheduleBeep(t + 1.05, 660, 0.3);
  }
}

// ── Icons ──────────────────────────────────────────────
function IcoBell({ size = 24, stroke = "#3B9EDD" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  );
}

function IcoCheck({ size = 16, stroke = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}

function IcoAlert({ size = 14, stroke = "#B85A3A" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
  );
}

function IcoPointer({ size = 14, stroke = "#1E2D3D" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 14a8 8 0 0 1-8 8"/>
      <path d="M18 11v-1a2 2 0 0 0-4 0v0"/>
      <path d="M14 10V9a2 2 0 0 0-4 0v1"/>
      <path d="M10 9.5V4a2 2 0 0 0-4 0v10"/>
      <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
    </svg>
  );
}

function IcoMegaphone({ size = 18, stroke = "#E07B5A" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3z"/>
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
    </svg>
  );
}

function IcoInbox({ size = 40, stroke = "#C0B0A8" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/>
    </svg>
  );
}

export default function PhonePage() {
  const [pings, setPings] = useState([]);
  const [active, setActive] = useState(null);
  const [unlocked, setUnlocked] = useState(false);

  const unlock = () => {
    getAudioContext().resume().then(() => {
      setUnlocked(true);
      subscribeToPush();
    });
  };

  useSocket((ping) => {
    playAlertSound();
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
    setActive(ping);
    setPings((prev) => [ping, ...prev]);
  });

  const dismiss = () => {
    stopSound();
    if (navigator.vibrate) navigator.vibrate(0);
    setActive(null);
  };

  return (
    <div onClick={unlock} style={{
      minHeight: "100vh",
      background: "#F0F7FF",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "32px 16px 48px",
      gap: "14px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }

        @keyframes ringBell {
          0%   { transform: rotate(-15deg); }
          100% { transform: rotate(15deg); }
        }
        @keyframes popIn {
          from { transform: scale(0.88); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,158,221,0.25); }
          50%       { box-shadow: 0 0 0 10px rgba(59,158,221,0); }
        }

        .alert-overlay {
          position: fixed; inset: 0;
          background: rgba(20, 35, 55, 0.88);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 20px;
          backdrop-filter: blur(4px);
        }
        .alert-card {
          background: #fff;
          border-radius: 28px;
          padding: 36px 28px;
          text-align: center;
          width: 100%; max-width: 360px;
          animation: popIn 0.3s ease;
          border: 1.5px solid #E0EEF8;
          box-shadow: 0 24px 64px rgba(30,45,61,0.25);
        }
        .ring-icon {
          display: inline-flex;
          animation: ringBell 0.35s ease infinite alternate;
        }
        .dismiss-btn {
          width: 100%;
          padding: 16px;
          background: #E07B5A;
          color: #fff;
          border: none;
          border-radius: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(224,123,90,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        }
        .dismiss-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(224,123,90,0.38);
        }
        .dismiss-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(224,123,90,0.2);
        }

        .status-pill {
          display: inline-flex; align-items: center; gap: 7px;
          border-radius: 50px; padding: 9px 18px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500; font-size: 13px;
          cursor: pointer;
        }
        .pill-waiting { background: #E8EDF2; color: #1E2D3D; }
        .pill-enabled { background: #D4F0E5; color: #1A5C43; }
        .pill-ringing { background: #FFDDD5; color: #B85A3A; animation: glowPulse 1.2s ease infinite; }

        .ping-card {
          display: flex; gap: 12px; align-items: center;
          background: #fff;
          border-radius: 16px; padding: 14px 16px;
          border: 1.5px solid #E0EEF8;
          box-shadow: 0 2px 12px rgba(59,158,221,0.06);
          animation: fadeUp 0.3s ease;
          width: 100%;
        }
        .ping-ico {
          width: 38px; height: 38px;
          border-radius: 12px;
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ping-badge {
          background: #FFE0D5; color: #B85A3A;
          border-radius: 50px; padding: 4px 10px;
          font-size: 9px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          letter-spacing: 0.08em; text-transform: uppercase;
          white-space: nowrap;
        }
        .empty-state {
          text-align: center; padding: 44px 24px;
          border: 1.5px dashed #C8DFF0;
          border-radius: 20px; width: 100%;
        }
      `}</style>

      {/* Incoming call alert */}
      {active && (
        <div className="alert-overlay" onClick={dismiss}>
          <div className="alert-card" onClick={(e) => e.stopPropagation()}>

            <div className="ring-icon" style={{ marginBottom: "16px" }}>
              <div style={{
                width: "64px", height: "64px",
                background: "#D6EEFA",
                borderRadius: "20px",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                <IcoBell size={30} stroke="#3B9EDD" />
              </div>
            </div>

            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.7rem",
              fontWeight: "500",
              color: "#E07B5A",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: "0 0 6px",
            }}>Incoming Call</p>

            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "2rem",
              fontWeight: "800",
              color: "#1E2D3D",
              margin: "0 0 6px",
              letterSpacing: "-0.02em",
            }}>{active.message?.replace(" is calling you!", "") || active.caller?.name}</h2>

            <p style={{
              color: "#B0A09A",
              fontSize: "0.8rem",
              margin: "0 0 24px",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {new Date(active.time).toLocaleTimeString()} · tap anywhere to dismiss
            </p>

            <button className="dismiss-btn" onClick={dismiss}>
              <IcoCheck size={18} stroke="#fff" />
              On My Way!
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        width: "60px", height: "60px",
        background: "#D6EEFA",
        borderRadius: "18px",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginTop: "8px",
      }}>
        <IcoBell size={28} stroke="#3B9EDD" />
      </div>

      <h1 style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: "1.9rem",
        fontWeight: "800",
        color: "#1E2D3D",
        letterSpacing: "-0.02em",
        lineHeight: 1,
        margin: 0,
      }}>Ping Me</h1>

      {/* Status pill */}
      {!unlocked ? (
        <span className="status-pill pill-waiting">
          <IcoPointer size={14} stroke="#1E2D3D" />
          Tap to enable sound
        </span>
      ) : active ? (
        <span className="status-pill pill-ringing">
          <IcoAlert size={14} stroke="#B85A3A" />
          Phone ringing now
        </span>
      ) : (
        <span className="status-pill pill-enabled">
          <IcoCheck size={12} stroke="#1A5C43" />
          Sound enabled · waiting
        </span>
      )}

      {/* Ping history */}
      <div style={{
        width: "100%",
        maxWidth: "420px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginTop: "4px",
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#B0A09A",
        }}>Ping history</div>

        {pings.length === 0 ? (
          <div className="empty-state">
            <IcoInbox size={40} stroke="#C8DFF0" />
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: "600",
              fontSize: "0.9rem",
              color: "#9BB5CC",
              marginTop: "12px",
            }}>No pings yet</p>
            <p style={{
              fontSize: "0.8rem",
              color: "#B8CCDc",
              marginTop: "4px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>Keep this page open.</p>
          </div>
        ) : (
          pings.map((ping, i) => (
            <div key={i} className="ping-card">
              <div className="ping-ico" style={{ background: i % 2 === 0 ? "#FFE0D5" : "#D6EEFA" }}>
                <IcoMegaphone size={18} stroke={i % 2 === 0 ? "#E07B5A" : "#3B9EDD"} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                  color: "#1E2D3D",
                }}>{ping.message?.replace(" is calling you!", "") || ping.caller?.name}</div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#B0A09A",
                  fontSize: "0.72rem",
                  marginTop: "3px",
                }}>
                  {new Date(ping.time).toLocaleTimeString()}
                </div>
              </div>
              <span className="ping-badge">PING</span>
            </div>
          ))
        )}
      </div>

      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.7rem",
        color: "#C0D4E8",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginTop: "auto",
        paddingTop: "24px",
      }}>
        Ping Me · Office Pager
      </p>
    </div>
  );
}