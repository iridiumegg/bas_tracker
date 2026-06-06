import { CURRENT_STATUS } from "./status.js";

const msg = CURRENT_STATUS.message.toLowerCase();
const isAlert = msg.includes("offline") || msg.includes("busy");

const color  = isAlert ? "#e74c3c" : "#2ecc71";
const bg     = isAlert ? "#1a0a0a" : "#0f1c14";
const border = isAlert ? "#7b241c" : "#1e4a28";
const subClr = isAlert ? "#5a2020" : "#2a5a38";
const anim   = isAlert ? "flash 1s infinite" : "pulse 2s infinite";

export default function StatusBar() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: bg, border: `1px solid ${border}`, borderRadius: 4, padding: "5px 12px", maxWidth: 380 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0, animation: anim }} />
      <div>
        <div style={{ fontSize: 10, color, letterSpacing: "0.08em", lineHeight: 1.3 }}>{CURRENT_STATUS.message}</div>
        <div style={{ fontSize: 9, color: subClr, marginTop: 1 }}>{CURRENT_STATUS.date}</div>
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes flash  { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>
    </div>
  );
}
