import { useState } from "react";
import { useSocket } from "./useSocket";

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

export default function PhonePage() {
  const [pings, setPings] = useState([]);
  const [active, setActive] = useState(null);
  const [unlocked, setUnlocked] = useState(false);

  const unlock = () => {
    getAudioContext().resume().then(() => setUnlocked(true));
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
      minHeight:"100vh",
      background:"#F5F0E8",
      fontFamily:"'DM Sans', sans-serif",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      padding:"32px 16px",
      gap:"16px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes ring {
          from { transform: rotate(-25deg); }
          to   { transform: rotate(25deg); }
        }
        @keyframes popIn {
          from { transform: scale(0.8); opacity:0; }
          to   { transform: scale(1); opacity:1; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes borderPulse {
          0%,100% { border-color: #E8483A; }
          50%      { border-color: #ffaa00; }
        }
      `}</style>

      {/* Alert popup */}
      {active && (
        <div onClick={dismiss} style={{
          position:"fixed", inset:0,
          background:"rgba(20,10,5,0.93)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:100, padding:"20px",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background:"#1a1a1a",
            border:"3px solid #E8483A",
            borderRadius:"28px",
            padding:"40px 28px",
            textAlign:"center",
            width:"100%",
            maxWidth:"360px",
            animation:"popIn 0.3s ease, borderPulse 1s ease infinite",
          }}>
            <div style={{
              fontSize:"5rem",
              display:"inline-block",
              animation:"ring 0.35s ease infinite alternate",
              lineHeight:1,
            }}>🔔</div>

            <p style={{
              fontFamily:"'Syne', sans-serif",
              fontSize:"0.85rem",
              fontWeight:"700",
              color:"#E8483A",
              letterSpacing:"3px",
              textTransform:"uppercase",
              margin:"16px 0 4px",
            }}>Incoming Call</p>

            <h2 style={{
              fontFamily:"'Syne', sans-serif",
              fontSize:"2.2rem",
              fontWeight:"800",
              color:"#F5F0E8",
              margin:"0 0 8px",
              letterSpacing:"-1px",
            }}>{active.caller.name}</h2>

            <div style={{fontSize:"3rem", margin:"8px 0"}}>{active.caller.emoji}</div>

            <p style={{color:"#666", fontSize:"0.85rem", margin:"8px 0 24px"}}>
              {new Date(active.time).toLocaleTimeString()} · tap anywhere to dismiss
            </p>

            <button onClick={dismiss} style={{
              width:"100%",
              padding:"18px",
              background:"#E8823A",
              color:"#1a1a1a",
              border:"2.5px solid #1a1a1a",
              borderRadius:"16px",
              fontFamily:"'Syne', sans-serif",
              fontSize:"1.1rem",
              fontWeight:"800",
              cursor:"pointer",
              letterSpacing:"0.5px",
              boxShadow:"4px 4px 0 #F5F0E8",
            }}>✅ ON MY WAY!</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center",
        width:"64px", height:"64px",
        background:"#E8823A",
        borderRadius:"18px",
        fontSize:"1.8rem",
        border:"2.5px solid #1a1a1a",
        boxShadow:"4px 4px 0 #1a1a1a",
        marginTop:"8px",
      }}>🔔</div>

      <h1 style={{
        fontFamily:"'Syne', sans-serif",
        fontSize:"2rem",
        fontWeight:"800",
        color:"#1a1a1a",
        letterSpacing:"-1px",
      }}>Ping Me</h1>

      {/* Sound status */}
      {!unlocked ? (
        <div style={{
          background:"#1a1a1a", color:"#F5F0E8",
          borderRadius:"50px", padding:"12px 24px",
          fontSize:"0.9rem", fontWeight:"500",
          border:"2px solid #1a1a1a",
          cursor:"pointer",
        }}>👆 Tap to enable sound</div>
      ) : (
        <div style={{
          background:"#2D6A4F", color:"#fff",
          borderRadius:"50px", padding:"12px 24px",
          fontSize:"0.9rem", fontWeight:"500",
          border:"2px solid #1B4332",
        }}>✅ Sound enabled · waiting for calls</div>
      )}

      {/* Ping history */}
      <div style={{width:"100%", maxWidth:"420px", marginTop:"8px", display:"flex", flexDirection:"column", gap:"12px"}}>
        {pings.length === 0 ? (
          <div style={{
            textAlign:"center", padding:"48px 24px",
            color:"#bbb", fontSize:"0.95rem",
            border:"2px dashed #ddd", borderRadius:"20px",
            marginTop:"16px",
          }}>
            <div style={{fontSize:"2.5rem", marginBottom:"12px"}}>📭</div>
            No pings yet. Keep this page open.
          </div>
        ) : (
          pings.map((ping, i) => (
            <div key={i} style={{
              display:"flex", gap:"14px", alignItems:"center",
              background:"#fff",
              borderRadius:"16px", padding:"16px 18px",
              border:"2px solid #1a1a1a",
              boxShadow:"3px 3px 0 #1a1a1a",
              animation:"fadeUp 0.3s ease",
            }}>
              <span style={{fontSize:"2rem"}}>{ping.caller.emoji}</span>
              <div style={{flex:1}}>
                <div style={{
                  fontFamily:"'Syne', sans-serif",
                  fontWeight:"700", fontSize:"1rem",
                  color:"#1a1a1a",
                }}>{ping.caller.name}</div>
                <div style={{color:"#999", fontSize:"0.8rem", marginTop:"2px"}}>
                  {new Date(ping.time).toLocaleTimeString()}
                </div>
              </div>
              <div style={{
                background:"#E8823A", color:"#1a1a1a",
                borderRadius:"50px", padding:"4px 12px",
                fontSize:"0.75rem", fontWeight:"700",
                fontFamily:"'Syne', sans-serif",
                border:"1.5px solid #1a1a1a",
              }}>PING</div>
            </div>
          ))
        )}
      </div>

      <p style={{color:"#bbb", fontSize:"0.75rem", marginTop:"auto", paddingTop:"24px"}}>
        Ping Me · Office Pager
      </p>
    </div>
  );
}