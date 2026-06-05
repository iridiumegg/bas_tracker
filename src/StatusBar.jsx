import { CURRENT_STATUS } from "./status.js";

export default function StatusBar() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "#0f1c14",
      border: "1px solid #1e4a28",
      borderRadius: 4,
      padding: "5px 12px",
      maxWidth: 380,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: "#2ecc71",
        boxShadow: "0 0 6px #2ecc71",
        flexShrink: 0,
        animation: "pulse 2s infinite",
      }} />
      <div>
        <div style={{ fontSize: 10, color: "#2ecc71", letterSpacing: "0.08em", lineHeight: 1.3 }}>
          {CURRENT_STATUS.message}
        </div>
        <div style={{ fontSize: 9, color: "#2a5a38", marginTop: 1 }}>{CURRENT_STATUS.date}</div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
