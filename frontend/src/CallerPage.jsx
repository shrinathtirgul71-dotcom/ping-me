import { useState, useEffect } from "react";
import axios from "axios";

const SERVER_URL = "http://localhost:4000";

export default function CallerPage() {
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  const sendPing = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await axios.post(`${SERVER_URL}/ping`, {
        callerId: "1",
        message: `${name.trim()} is calling you!`,
      });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
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
      background: "#F5F0E8",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp {
          from { opacity:0; transform: translateY(20px); }
          to   { opacity:1; transform: translateY(0); }
        }
        .fade { animation: fadeUp 0.5s ease forwards; opacity: 0; }
        .call-input {
          width: 100%;
          padding: 18px 20px;
          border-radius: 16px;
          border: 2.5px solid #1a1a1a;
          background: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: #1a1a1a;
          outline: none;
          transition: box-shadow 0.2s;
          box-shadow: 4px 4px 0 #1a1a1a;
        }
        .call-input:focus {
          box-shadow: 6px 6px 0 #E8823A;
          border-color: #E8823A;
        }
        .call-input::placeholder {
          color: #bbb;
          font-weight: 400;
        }
        .call-btn {
          width: 100%;
          padding: 20px;
          border-radius: 16px;
          border: 2.5px solid #1a1a1a;
          background: #1a1a1a;
          color: #F5F0E8;
          font-family: 'Syne', sans-serif;
          font-size: 1.2rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 4px 4px 0 #E8823A;
          letter-spacing: 0.5px;
        }
        .call-btn:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0 #E8823A;
        }
        .call-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0 #E8823A;
        }
        .call-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .call-btn.success {
          background: #2D6A4F;
          border-color: #2D6A4F;
          box-shadow: 4px 4px 0 #1B4332;
        }
      `}</style>

      {/* Icon */}
      <div className="fade" style={{animationDelay:"0s"}}>
        <div style={{
          display:"inline-flex",
          alignItems:"center",
          justifyContent:"center",
          width:"72px", height:"72px",
          background:"#E8823A",
          borderRadius:"20px",
          fontSize:"2rem",
          marginBottom:"16px",
          border:"2.5px solid #1a1a1a",
          boxShadow:"4px 4px 0 #1a1a1a",
        }}>📣</div>
      </div>

      {/* Title */}
      <div className="fade" style={{animationDelay:"0.1s", textAlign:"center", marginBottom:"40px"}}>
        <h1 style={{
          fontFamily:"'Syne', sans-serif",
          fontSize:"clamp(1.8rem, 6vw, 2.6rem)",
          fontWeight:"800",
          color:"#1a1a1a",
          lineHeight:1.1,
          letterSpacing:"-1px",
        }}>Call Office Boy</h1>
        <p style={{color:"#6b6b6b", marginTop:"8px", fontSize:"1rem"}}>
          Type your name and press Call
        </p>
      </div>

      {/* Form */}
      <div className="fade" style={{
        width:"100%",
        maxWidth:"420px",
        display:"flex",
        flexDirection:"column",
        gap:"14px",
        animationDelay:"0.2s",
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
          className={`call-btn ${sent ? "success" : ""}`}
          onClick={sendPing}
          disabled={!name.trim() || loading}
        >
          {sent ? "✅ Called! He's been notified" : loading ? "Calling..." : "📞 Call Now"}
        </button>
      </div>

      {/* Toast */}
      {sent && (
        <div style={{
          position:"fixed", bottom:"32px", left:"50%",
          transform:"translateX(-50%)",
          background:"#2D6A4F",
          color:"#fff",
          padding:"14px 28px",
          borderRadius:"50px",
          fontFamily:"'Syne', sans-serif",
          fontWeight:"700",
          fontSize:"1rem",
          border:"2px solid #1B4332",
          boxShadow:"0 8px 32px rgba(0,0,0,0.2)",
          whiteSpace:"nowrap",
          animation:"fadeUp 0.3s ease",
          zIndex: 99,
        }}>
          🔔 Office Boy has been notified!
        </div>
      )}

      <p style={{marginTop:"40px", color:"#aaa", fontSize:"0.8rem"}}>
        Ping Me · Office Pager System
      </p>
    </div>
  );
}