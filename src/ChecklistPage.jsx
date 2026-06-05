import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBar from "./StatusBar.jsx";

function storageKey(projectId, itemId) {
  return `bas_checklist_${projectId}_${itemId}`;
}

export function getChecklistCounts(projectId, initialItems) {
  let done = 0;
  for (const item of initialItems) {
    const saved = localStorage.getItem(storageKey(projectId, item.id));
    const isDone = saved !== null ? saved === "true" : item.done;
    if (isDone) done++;
  }
  return { done, total: initialItems.length, remaining: initialItems.length - done };
}

export default function ChecklistPage({ meta, items: initialItems }) {
  const [items, setItems] = useState(() =>
    initialItems.map(item => {
      const saved = localStorage.getItem(storageKey(meta.id, item.id));
      return { ...item, done: saved !== null ? saved === "true" : item.done };
    })
  );

  const toggle = (id) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const next = !item.done;
      localStorage.setItem(storageKey(meta.id, id), String(next));
      return { ...item, done: next };
    }));
  };

  const done = items.filter(i => i.done).length;
  const total = items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const remaining = total - done;

  return (
    <div style={{ minHeight: "100vh", background: "#0b0d11", fontFamily: "'IBM Plex Mono', monospace", color: "#c8cdd8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .checklist-row { transition: background 0.12s; cursor: pointer; user-select: none; }
        .checklist-row:hover { background: #141820 !important; }
        .back-link { color: #4a5570; font-size: 11px; text-decoration: none; letter-spacing: 0.08em; }
        .back-link:hover { color: #8ab4f8; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0d1017", borderBottom: "1px solid #1e2330", padding: "16px 28px" }}>
        <div style={{ marginBottom: 10 }}>
          <Link to="/" className="back-link">← All Projects</Link>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "#4a5570", letterSpacing: "0.12em", marginBottom: 4, textTransform: "uppercase" }}>
              {meta.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: "#e0e4ef", fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: "-0.02em" }}>
              Task Checklist
            </div>
            <div style={{ fontSize: 11, color: "#4a5570", marginTop: 3 }}>
              {done} of {total} complete &nbsp;·&nbsp; {remaining} remaining
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <StatusBar />
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "COMPLETE", val: done,      color: "#2ecc71" },
                { label: "REMAINING", val: remaining, color: "#f1c40f" },
                { label: "TOTAL",    val: total,     color: "#4a5570" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: "#4a5570", letterSpacing: "0.1em", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 14, background: "#111520", borderRadius: 2, height: 4, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "#2ecc71", borderRadius: 2, transition: "width 0.3s" }} />
        </div>
        <div style={{ marginTop: 4, fontSize: 9, color: "#3a4255", letterSpacing: "0.1em" }}>{pct}% COMPLETE</div>
      </div>

      {/* Checklist */}
      <div style={{ maxWidth: 780, padding: "20px 28px" }}>
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="checklist-row"
            onClick={() => toggle(item.id)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "10px 12px",
              borderRadius: 4,
              marginBottom: 2,
              background: item.done
                ? (idx % 2 === 0 ? "#0b0f0d" : "#0d100f")
                : (idx % 2 === 0 ? "#0b0d11" : "#0d0f14"),
            }}
          >
            {/* Checkbox */}
            <div style={{
              width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 1,
              border: `1.5px solid ${item.done ? "#1e8449" : "#2a3045"}`,
              background: item.done ? "#0a1a0a" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.12s",
            }}>
              {item.done && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#2ecc71" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>

            {/* Index + text */}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 10, color: "#2a3045", marginRight: 10 }}>
                {String(item.id).padStart(2, "0")}
              </span>
              <span style={{
                fontSize: 13,
                color: item.done ? "#3a5040" : "#a0a8bc",
                textDecoration: item.done ? "line-through" : "none",
                textDecorationColor: "#2a4030",
                transition: "color 0.12s",
                lineHeight: 1.5,
              }}>
                {item.text}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "20px 28px", borderTop: "1px solid #111520", fontSize: 10, color: "#2a3045" }}>
        {meta.label} · {meta.generated}
      </div>
    </div>
  );
}
