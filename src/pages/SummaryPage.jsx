import { useState, useEffect, useMemo } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { todayISO } from "../config.js";
import { Button, Input, SectionLabel } from "../components/ui.jsx";

const SECTION_DEFS = [
  { key: "completed", types: ["task_completed"], title: "Completed / Checked Off", color: "#2ecc71", bullet: "[x]" },
  { key: "statuses", types: ["status_changed"], title: "Status Changes", color: "#f1c40f", bullet: "[~]" },
  { key: "notes", types: ["note_added", "note_resolved"], title: "Field Notes", color: "#8a9ab8", bullet: "[-]" },
  { key: "created", types: ["task_created"], title: "New Tasks Added", color: "#8ab4f8", bullet: "[+]" },
];

function describe(a, sectionKey) {
  if (sectionKey === "completed") return a.task_title || a.detail;
  if (sectionKey === "statuses") return `${a.task_title} — ${a.detail.replace(/_/g, " ")}`;
  if (sectionKey === "notes") {
    const prefix = a.type === "note_resolved" ? "resolved — " : "";
    return `${a.task_title}: ${prefix}"${a.detail}"`;
  }
  return a.task_title || a.detail;
}

function groupByProject(activity) {
  const projects = new Map();
  for (const a of activity) {
    const name = a.project_name || "General";
    if (!projects.has(name)) projects.set(name, []);
    projects.get(name).push(a);
  }
  return projects;
}

function niceDate(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function buildEmailText({ date, activity, userName, scope }) {
  const lines = [];
  lines.push(`DAILY SUMMARY — ${niceDate(date)}`);
  lines.push(scope === "me" ? `${userName} — ES2 Building Automation Systems` : "Team — ES2 Building Automation Systems");
  lines.push("");

  const projects = groupByProject(activity);
  const totals = { completed: 0, statuses: 0, notes: 0, created: 0 };

  for (const [projectName, items] of projects) {
    const sections = SECTION_DEFS
      .map(def => ({ def, rows: items.filter(a => def.types.includes(a.type)) }))
      .filter(s => s.rows.length > 0);
    if (sections.length === 0) continue;

    lines.push(projectName.toUpperCase());
    for (const { def, rows } of sections) {
      lines.push(`  ${def.title}:`);
      for (const a of rows) {
        const who = scope === "me" ? "" : ` (${a.user_name})`;
        lines.push(`    ${def.bullet} ${describe(a, def.key)}${who}`);
        totals[def.key]++;
      }
    }
    lines.push("");
  }

  lines.push(`Totals: ${totals.completed} completed · ${totals.statuses} status changes · ${totals.notes} notes · ${totals.created} new tasks`);
  return lines.join("\n");
}

export default function SummaryPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [scope, setScope] = useState("me");
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let stale = false;
    api.getSummary(date, scope)
      .then(d => { if (!stale) setData(d); })
      .catch(() => { if (!stale) setData({ date, activity: [] }); });
    return () => { stale = true; };
  }, [date, scope]);

  const relevant = useMemo(
    () => (data?.activity || []).filter(a => SECTION_DEFS.some(d => d.types.includes(a.type))),
    [data]
  );
  const projects = useMemo(() => groupByProject(relevant), [relevant]);

  const copy = async () => {
    const text = buildEmailText({ date, activity: relevant, userName: user?.name, scope });
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 sm:px-7 py-6 max-w-[840px]">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="font-sans text-[20px] font-semibold text-bright tracking-[-0.02em]">Daily Summary</div>
          <div className="text-[11px] text-mut mt-1">
            What got done — ready to paste into an end-of-day email.
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="!w-40 !py-1.5" />
          <div className="flex bg-well border border-line rounded-[3px] p-0.5">
            {[["me", "Just Me"], ["all", "Everyone"]].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setScope(v)}
                className={`font-mono text-[10px] tracking-[0.08em] uppercase px-2.5 py-1 rounded-[2px] cursor-pointer border-0 ${
                  scope === v ? "bg-accent-bg text-accent" : "bg-transparent text-dim hover:text-mut"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button onClick={copy} disabled={relevant.length === 0}>
            {copied ? "✓ Copied" : "Copy for Email"}
          </Button>
        </div>
      </div>

      {!data ? (
        <div className="p-12 text-center text-[11px] text-dim tracking-[0.1em]">LOADING…</div>
      ) : relevant.length === 0 ? (
        <div className="bg-panel border border-line rounded-md p-10 text-center text-[13px] text-ghost">
          Nothing logged on {niceDate(date)}{scope === "me" ? " by you" : ""}.
        </div>
      ) : (
        <div className="bg-panel border border-line rounded-md p-5 sm:p-6">
          <div className="pb-4 mb-4 border-b border-line2">
            <div className="font-sans text-[15px] font-semibold text-bright">{niceDate(date)}</div>
            <div className="text-[11px] text-mut mt-0.5">
              {scope === "me" ? user?.name : "Whole team"} · ES2 Building Automation Systems
            </div>
          </div>

          {[...projects.entries()].map(([projectName, items]) => {
            const sections = SECTION_DEFS
              .map(def => ({ def, rows: items.filter(a => def.types.includes(a.type)) }))
              .filter(s => s.rows.length > 0);
            if (sections.length === 0) return null;
            return (
              <div key={projectName} className="mb-5">
                <div className="text-[11px] text-accent font-semibold tracking-[0.08em] uppercase mb-2">{projectName}</div>
                {sections.map(({ def, rows }) => (
                  <div key={def.key} className="mb-2.5 ml-1">
                    <SectionLabel className="mb-1" >{def.title} ({rows.length})</SectionLabel>
                    {rows.map(a => (
                      <div key={a.id} className="flex gap-2 text-[12px] leading-relaxed ml-1">
                        <span className="shrink-0" style={{ color: def.color }}>{def.bullet}</span>
                        <span className="text-soft">
                          {describe(a, def.key)}
                          {scope === "all" && <span className="text-dim"> — {a.user_name}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}

          <div className="pt-3 border-t border-line2 text-[11px] text-mut">
            Totals:{" "}
            {SECTION_DEFS.map(({ key, title }, i) => {
              const n = relevant.filter(a => SECTION_DEFS.find(d => d.key === key).types.includes(a.type)).length;
              return <span key={key}>{i > 0 && " · "}{n} {title.toLowerCase()}</span>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
