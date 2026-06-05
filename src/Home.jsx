import { Link } from "react-router-dom";
import { PROJECTS } from "./projects/index.js";
import { STATUS_CONFIG } from "./config.js";
import StatusBar from "./StatusBar.jsx";

function projectStats(items) {
  const total = items.length;
  const resolved = items.filter(i => i.status === "RESOLVED").length;
  const inProgress = items.filter(i => i.status === "IN_PROGRESS").length;
  const open = items.filter(i => i.status === "OPEN").length;
  const pct = total ? Math.round((resolved / total) * 100) : 0;
  return { total, resolved, inProgress, open, pct };
}

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0d11", fontFamily: "'IBM Plex Mono', monospace", color: "#c8cdd8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .project-card { transition: background 0.15s, border-color 0.15s; text-decoration: none; display: block; }
        .project-card:hover { background: #0f1420 !important; border-color: #2d4470 !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0d1017", borderBottom: "1px solid #1e2330", padding: "20px 28px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "#4a5570", letterSpacing: "0.12em", marginBottom: 4, textTransform: "uppercase" }}>
              ES2 · Building Automation Systems
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#e0e4ef", fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: "-0.02em" }}>
              Project Action Tracker
            </div>
            <div style={{ fontSize: 11, color: "#4a5570", marginTop: 3 }}>
              {PROJECTS.length} active project{PROJECTS.length !== 1 ? "s" : ""}
            </div>
          </div>
          <StatusBar />
        </div>
      </div>

      {/* Project cards */}
      <div style={{ padding: "24px 28px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {PROJECTS.map(({ meta, items }) => {
          const s = projectStats(items);
          const barW = s.pct;
          return (
            <Link
              key={meta.id}
              to={`/${meta.id}`}
              className="project-card"
              style={{
                background: "#0d1017",
                border: "1px solid #1e2330",
                borderRadius: 6,
                padding: "18px 20px",
                color: "inherit",
              }}
            >
              <div style={{ fontSize: 10, color: "#4a5570", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                {meta.client}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#e0e4ef", fontFamily: "'IBM Plex Sans', sans-serif", marginBottom: 2 }}>
                {meta.name}
              </div>
              <div style={{ fontSize: 11, color: "#4a5570", marginBottom: 14 }}>{meta.subtitle}</div>

              {/* Progress bar */}
              <div style={{ background: "#111520", borderRadius: 2, height: 4, marginBottom: 12, overflow: "hidden" }}>
                <div style={{ width: `${barW}%`, height: "100%", background: "#2ecc71", borderRadius: 2, transition: "width 0.3s" }} />
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { label: "OPEN", val: s.open, color: "#e74c3c" },
                  { label: "IN PROG", val: s.inProgress, color: "#f1c40f" },
                  { label: "RESOLVED", val: s.resolved, color: "#2ecc71" },
                  { label: "TOTAL", val: s.total, color: "#4a5570" },
                ].map(x => (
                  <div key={x.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 600, color: x.color, lineHeight: 1 }}>{x.val}</div>
                    <div style={{ fontSize: 8, color: "#3a4255", letterSpacing: "0.1em", marginTop: 2 }}>{x.label}</div>
                  </div>
                ))}
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "#5a6580", lineHeight: 1 }}>{barW}%</div>
                  <div style={{ fontSize: 8, color: "#3a4255", letterSpacing: "0.1em", marginTop: 2 }}>COMPLETE</div>
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 10, color: "#3a4255" }}>
                {meta.source} &nbsp;·&nbsp; {meta.generated}
              </div>
            </Link>
          );
        })}
      </div>

      <div style={{ padding: "20px 28px", borderTop: "1px solid #111520", fontSize: 10, color: "#2a3045" }}>
        ES2 Building Automation Systems · Field Services Tracker
      </div>
    </div>
  );
}
