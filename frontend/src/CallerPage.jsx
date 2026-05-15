import { useState, useEffect, useRef } from "react";
import axios from "axios";

const SERVER_URL = "https://ping-me-opwf.onrender.com";

const SARCASTIC_MESSAGES = [
  "He's probably very busy doing absolutely nothing.",
  "Officially unreachable. Unofficially, just ignoring you.",
  "He has read your ping and chosen peace.",
  "Currently in a meeting with his phone screen.",
  "Response time: somewhere between now and never.",
  "He's aware. He just doesn't feel like moving yet.",
  "Your ping has been noted and filed under 'later'.",
  "He's on his way. Time of arrival: unknown.",
];

export default function CallerPage() {
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [sarcasticMsg, setSarcasticMsg] = useState("");
  const [countdown, setCountdown] = useState(60);
  const timeoutRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    setTimedOut(false);

    // countdown ticker
    let secs = 60;
    countdownRef.current = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) clearInterval(countdownRef.current);
    }, 1000);

    // after 60s show sarcastic message
    timeoutRef.current = setTimeout(() => {
      clearInterval(countdownRef.current);
      const msg = SARCASTIC_MESSAGES[Math.floor(Math.random() * SARCASTIC_MESSAGES.length)];
      setSarcasticMsg(msg);
      setTimedOut(true);
      setSent(false);
    }, 60000);
  };

  const resetAll = () => {
    clearTimeout(timeoutRef.current);
    clearInterval(countdownRef.current);
    setTimedOut(false);
    setSent(false);
    setCountdown(60);
    setName("");
  };

  const sendPing = async () => {
    if (!name.trim()) return;
    setLoading(true);
    clearTimeout(timeoutRef.current);
    clearInterval(countdownRef.current);
    setTimedOut(false);
    try {
      await axios.post(`${SERVER_URL}/ping`, {
        callerId: "1",
        callerName: name.trim(),
        message: `${name.trim()} is calling you!`,
      });
      setSent(true);
      startCountdown();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") sendPing();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FFF4EF",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes sarcasticIn {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }

        .fade-1 { animation: fadeUp 0.5s ease 0s both; }
        .fade-2 { animation: fadeUp 0.5s ease 0.12s both; }
        .fade-3 { animation: fadeUp 0.5s ease 0.24s both; }

        .call-input {
          width: 100%;
          padding: 16px 18px;
          border-radius: 14px;
          border: 1.5px solid #F0CFC4;
          background: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 1rem;
          font-weight: 400;
          color: #1E2D3D;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(224,123,90,0.06);
        }
        .call-input:focus {
          border-color: #E07B5A;
          box-shadow: 0 0 0 4px rgba(224,123,90,0.12);
        }
        .call-input::placeholder {
          color: #C0B0A8;
          font-weight: 400;
        }

        .call-btn {
          width: 100%;
          padding: 18px;
          border-radius: 14px;
          border: none;
          background: #E07B5A;
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 4px 16px rgba(224,123,90,0.3);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .call-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(224,123,90,0.38);
        }
        .call-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(224,123,90,0.2);
        }
        .call-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .call-btn.success {
          background: #2D9B6F;
          box-shadow: 0 4px 16px rgba(45,155,111,0.3);
        }

        .toast {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          background: #D4F0E5;
          color: #1A5C43;
          padding: 12px 24px;
          border-radius: 50px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 0.875rem;
          border: 1.5px solid #A8DFC8;
          box-shadow: 0 4px 20px rgba(45,155,111,0.18);
          white-space: nowrap;
          animation: toastIn 0.3s ease;
          z-index: 99;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .sarcastic-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 20px;
          padding: 28px 24px;
          border: 1.5px solid #F0CFC4;
          box-shadow: 0 8px 32px rgba(224,123,90,0.12);
          text-align: center;
          animation: sarcasticIn 0.5s ease both;
        }

        .retry-btn {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          border: 1.5px solid #F0CFC4;
          background: #FFF4EF;
          color: #E07B5A;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          margin-top: 16px;
        }
        .retry-btn:hover {
          background: #E07B5A;
          color: #fff;
          border-color: #E07B5A;
        }

        .countdown-ring {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #B0A09A;
          margin-top: 8px;
        }
      `}</style>

      {/* Logo */}
      <div className="fade-1">
        <div style={{
          width: "68px", height: "68px",
          background: timedOut ? "#FFF0F0" : "#FFE0D5",
          borderRadius: "20px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
          transition: "background 0.3s",
          animation: timedOut ? "shake 0.5s ease" : "none",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={timedOut ? "#C0392B" : "#E07B5A"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 11 18-5v12L3 14v-3z"/>
            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
          </svg>
        </div>
      </div>

      {/* Title */}
      {!timedOut && (
        <div className="fade-2" style={{ textAlign: "center", marginBottom: "36px" }}>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(1.8rem, 6vw, 2.4rem)",
            fontWeight: "800",
            color: "#1E2D3D",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}>Call Office Boy</h1>
          <p style={{
            color: "#E07B5A",
            marginTop: "8px",
            fontSize: "0.95rem",
            fontWeight: "500",
          }}>
            Type your name and press Call
          </p>
        </div>
      )}

      {/* Sarcastic timeout card */}
      {timedOut ? (
        <div className="sarcastic-card">
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🙃</div>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#E07B5A",
            marginBottom: "10px",
          }}>No response · 1 min passed</p>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: "800",
            fontSize: "1.1rem",
            color: "#1E2D3D",
            lineHeight: 1.4,
            marginBottom: "8px",
          }}>{sarcasticMsg}</h2>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "0.8rem",
            color: "#B0A09A",
          }}>You may try again. Results may vary.</p>
          <button className="retry-btn" onClick={resetAll}>
            Try Again Anyway
          </button>
        </div>
      ) : (
        /* Form */
        <div className="fade-3" style={{
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          <input
            className="call-input"
            type="text"
            placeholder="Your name (e.g. Mr. Sharma)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKey}
            maxLength={40}
            autoFocus
          />

          <button
            className={`call-btn${sent ? " success" : ""}`}
            onClick={sendPing}
            disabled={!name.trim() || loading}
          >
            {sent ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
                Ping sent! Waiting...
              </>
            ) : loading ? (
              "Calling..."
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Call Now
              </>
            )}
          </button>

          {/* Countdown after ping sent */}
          {sent && (
            <div style={{ textAlign: "center" }}>
              <span className="countdown-ring">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Auto-cancel in {countdown}s if no response
              </span>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {sent && !timedOut && (
        <div className="toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A5C43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
          Office Boy has been notified!
        </div>
      )}

      <p style={{
        marginTop: "40px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.7rem",
        color: "#C0B0A8",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}>
        Ping Me · Office Pager System
      </p>
    </div>
  );
}