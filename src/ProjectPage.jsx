import { useState } from "react";
import { Link } from "react-router-dom";
import { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORIES, PRIORITIES, STATUSES } from "./config.js";
import StatusBar from "./StatusBar.jsx";

export default function ProjectPage({ meta, items: initialItems }) {
  const categories = meta.categories || CATEGORIES;
  const [items, setItems] = useState(initialItems);
  const [filterCat, setFilterCat] = useState("All");
  const [filterPri, setFilterPri] = useState("All");
  const [filterStat, setFilterStat] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [editingNote, setEditingNote] = useState(null);

  const setStatus = (id, status) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));

  const filtered = items.filter(i => {
    if (filterCat !== "All" && i.category !== filterCat) return false;
    if (filterPri !== "All" && i.priority !== filterPri) return false;
    if (filterStat !== "All" && i.status !== filterStat) return false;
    return true;
  });

  const counts = {
    open: items.filter(i => i.status === "OPEN").length,
    inProgress: items.filter(i => i.status === "IN_PROGRESS").length,
    resolved: items.filter(i => i.status === "RESOLVED").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0d11", fontFamily: "'IBM Plex Mono', monospace", color: "#c8cdd8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .item-row { transition: background 0.15s; cursor: pointer; }
        .item-row:hover { background: #141820 !important; }
        .filter-btn { transition: all 0.15s; cursor: pointer; border: none; font-family: 'IBM Plex Mono', monospace; font-size: 11px; padding: 4px 10px; border-radius: 3px; }
        .filter-btn:hover { opacity: 0.85; }
        .status-btn { transition: all 0.12s; cursor: pointer; border: none; font-family: 'IBM Plex Mono', monospace; font-size: 10px; padding: 3px 8px; border-radius: 2px; }
        .status-btn:hover { opacity: 0.8; }
        textarea { resize: vertical; font-family: 'IBM Plex Mono', monospace; font-size: 12px; background: #0d1017; border: 1px solid #2a2f3d; color: #c8cdd8; border-radius: 3px; padding: 8px; width: 100%; outline: none; }
        textarea:focus { border-color: #3a5080; }
        .back-link { color: #4a5570; font-size: 11px; text-decoration: none; letter-spacing: 0.08em; }
        .back-link:hover { color: #8ab4f8; }
        .filter-scroll { display: flex; flex-wrap: wrap; gap: 18px; align-items: center; }
        .col-headers { display: grid; grid-template-columns: 52px 70px 130px 140px 1fr; gap: 12px; }
        .item-grid  { display: grid; grid-template-columns: 52px 70px 130px 140px 1fr; gap: 12px; align-items: start; }
        .expand-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 14px; }
        .status-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        @media (max-width: 640px) {
          .col-headers { display: none; }
          .item-grid  { grid-template-columns: 64px 1fr; }
          .item-grid .hide-mobile { display: none; }
          .expand-grid { grid-template-columns: 1fr; }
          .filter-scroll { gap: 10px; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; }
          .status-row { flex-direction: column; align-items: flex-start; gap: 8px; }
          .status-row .status-buttons { flex-wrap: wrap; }
          .header-right { display: none; }
          .counts-mobile { display: flex !important; }
        }
        @media (min-width: 641px) {
          .counts-mobile { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0d1017", borderBottom: "1px solid #1e2330", padding: "16px 16px 14px" }}>
        <div style={{ marginBottom: 10 }}>
          <Link to="/" className="back-link">← All Projects</Link>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: "#4a5570", letterSpacing: "0.1em", marginBottom: 4, textTransform: "uppercase" }}>
              {meta.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#e0e4ef", fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: "-0.02em" }}>
              TAB Report — BAS Action Items
            </div>
            <div style={{ fontSize: 11, color: "#4a5570", marginTop: 3 }}>
              {meta.source} &nbsp;·&nbsp; {meta.generated}
            </div>
            {/* Mobile counts */}
            <div className="counts-mobile" style={{ gap: 14, marginTop: 10 }}>
              {[
                { label: "OPEN", val: counts.open, color: "#e74c3c" },
                { label: "IN PROG", val: counts.inProgress, color: "#f1c40f" },
                { label: "RESOLVED", val: counts.resolved, color: "#2ecc71" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 8, color: "#4a5570", letterSpacing: "0.1em", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="header-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <StatusBar />
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "OPEN", val: counts.open, color: "#e74c3c" },
                { label: "IN PROGRESS", val: counts.inProgress, color: "#f1c40f" },
                { label: "RESOLVED", val: counts.resolved, color: "#2ecc71" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: "#4a5570", letterSpacing: "0.1em", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #161b26" }}>
        <div className="filter-scroll">
          {[
            { label: "Cat", opts: categories, val: filterCat, set: setFilterCat },
            { label: "Pri", opts: PRIORITIES, val: filterPri, set: setFilterPri },
            { label: "Status", opts: STATUSES, val: filterStat, set: setFilterStat },
          ].map(f => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: "#4a5570", letterSpacing: "0.08em", textTransform: "uppercase" }}>{f.label}:</span>
              <div style={{ display: "flex", gap: 3, flexWrap: "nowrap" }}>
                {f.opts.map(o => (
                  <button key={o} className="filter-btn"
                    onClick={() => f.set(o)}
                    style={{
                      background: f.val === o ? "#1e2a40" : "transparent",
                      color: f.val === o ? "#8ab4f8" : "#4a5570",
                      border: `1px solid ${f.val === o ? "#2d4470" : "#1e2330"}`,
                      whiteSpace: "nowrap",
                    }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#4a5570", flexShrink: 0 }}>
            {filtered.length}/{items.length}
          </span>
        </div>
      </div>

      {/* Column Headers — hidden on mobile via CSS */}
      <div className="col-headers" style={{ padding: "8px 16px", borderBottom: "1px solid #161b26", fontSize: 9, color: "#3a4255", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        <div>#</div><div>Priority</div><div>Unit</div><div>Category</div><div>Issue / Action</div>
      </div>

      {/* Items */}
      <div>
        {filtered.map((item, idx) => {
          const pc = PRIORITY_CONFIG[item.priority];
          const sc = STATUS_CONFIG[item.status];
          const isExpanded = expandedId === item.id;

          return (
            <div key={item.id}>
              <div
                className="item-row item-grid"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                style={{
                  padding: "11px 16px",
                  borderBottom: "1px solid #111520",
                  background: isExpanded ? "#0f1420" : idx % 2 === 0 ? "#0b0d11" : "#0d0f14",
                }}
              >
                {/* # — hidden on mobile, priority shown instead */}
                <div className="hide-mobile" style={{ fontSize: 11, color: "#2a3045", paddingTop: 2 }}>
                  {String(item.id).padStart(2, "0")}
                </div>
                {/* On mobile this cell shows priority badge */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: "0.1em",
                    color: pc.text, background: pc.bg, border: `1px solid ${pc.border}`,
                    padding: "2px 5px", borderRadius: 2, display: "inline-block",
                  }}>{pc.label}</span>
                  {/* Status badge — shown on mobile only */}
                  <span style={{
                    fontSize: 8, fontWeight: 600, letterSpacing: "0.08em",
                    color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`,
                    padding: "2px 5px", borderRadius: 2, display: "inline-block",
                  }}>{sc.label}</span>
                </div>

                <div className="hide-mobile" style={{ fontSize: 12, color: "#8ab4f8", fontWeight: 500, paddingTop: 1 }}>{item.unit}</div>
                <div className="hide-mobile" style={{ fontSize: 11, color: "#5a6580", paddingTop: 2 }}>{item.category}</div>

                {/* Issue — on mobile this is the main content column */}
                <div>
                  {/* Mobile: show unit above issue */}
                  <div style={{ fontSize: 11, color: "#8ab4f8", fontWeight: 500, marginBottom: 3, display: "none" }} className="show-mobile-unit">
                    {item.unit}
                  </div>
                  <div style={{ fontSize: 12, color: "#a0a8bc", lineHeight: 1.5 }}>{item.issue}</div>
                  <div style={{ fontSize: 11, color: "#4a5570", marginTop: 3 }}>
                    ↳ {item.action.substring(0, 80)}{item.action.length > 80 ? "…" : ""}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div style={{
                  background: "#0d1017",
                  borderBottom: "1px solid #1e2535",
                  padding: "14px 16px",
                  borderLeft: `3px solid ${pc.border}`,
                }}>
                  <div className="expand-grid">
                    <div>
                      <div style={{ fontSize: 9, color: "#3a4255", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Full Issue</div>
                      <div style={{ fontSize: 12, color: "#c0c8d8", lineHeight: 1.6 }}>{item.issue}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: "#3a4255", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Required Action</div>
                      <div style={{ fontSize: 12, color: "#c0c8d8", lineHeight: 1.6 }}>{item.action}</div>
                    </div>
                  </div>

                  <div className="status-row">
                    <div style={{ fontSize: 10, color: "#3a4255" }}>
                      Source: <span style={{ color: "#5a6580" }}>{item.source}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }} className="status-buttons">
                      <span style={{ fontSize: 10, color: "#3a4255", letterSpacing: "0.08em" }}>STATUS:</span>
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <button key={key} className="status-btn"
                          onClick={e => { e.stopPropagation(); setStatus(item.id, key); }}
                          style={{
                            background: item.status === key ? cfg.bg : "transparent",
                            color: item.status === key ? cfg.text : "#3a4255",
                            border: `1px solid ${item.status === key ? cfg.border : "#1e2330"}`,
                          }}>
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 9, color: "#3a4255", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Field Notes</div>
                    {editingNote === item.id ? (
                      <div onClick={e => e.stopPropagation()}>
                        <textarea
                          rows={3}
                          value={notes[item.id] || ""}
                          onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="Add notes, findings, assigned tech..."
                        />
                        <button className="filter-btn" onClick={e => { e.stopPropagation(); setEditingNote(null); }}
                          style={{ marginTop: 6, background: "#1e2a40", color: "#8ab4f8", border: "1px solid #2d4470" }}>
                          Save
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={e => { e.stopPropagation(); setEditingNote(item.id); }}
                        style={{
                          fontSize: 12, color: notes[item.id] ? "#8a9ab8" : "#2a3045",
                          background: "#090c12", border: "1px solid #161b26",
                          borderRadius: 3, padding: "8px 10px", cursor: "text", minHeight: 36, lineHeight: 1.6,
                        }}>
                        {notes[item.id] || "Click to add notes…"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: "48px", textAlign: "center", color: "#2a3045", fontSize: 13 }}>
          No items match the current filters.
        </div>
      )}

      <div style={{ padding: "20px 16px", borderTop: "1px solid #111520", fontSize: 10, color: "#2a3045" }}>
        {meta.label} · TAB Review {meta.generated}
      </div>
    </div>
  );
}
