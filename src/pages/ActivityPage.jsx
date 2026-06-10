import { useState, useEffect } from "react";
import { api } from "../api.js";
import { ACTIVITY_CONFIG, fmtTime } from "../config.js";

export default function ActivityPage() {
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    api.getActivity({ limit: 200 }).then(setActivity).catch(() => setActivity([]));
  }, []);

  if (!activity) {
    return <div className="p-12 text-center text-[11px] text-dim tracking-[0.1em]">LOADING…</div>;
  }

  return (
    <div className="px-4 sm:px-7 py-6 max-w-[840px]">
      <div className="font-sans text-[20px] font-semibold text-bright tracking-[-0.02em] mb-1">Activity</div>
      <div className="text-[11px] text-mut mb-5">Everything that's happened across the workspace, newest first.</div>

      {activity.length === 0 ? (
        <div className="bg-panel border border-line rounded-md p-10 text-center text-[13px] text-ghost">No activity yet.</div>
      ) : (
        <div className="bg-panel border border-line rounded-md overflow-hidden">
          {activity.map((a, idx) => {
            const cfg = ACTIVITY_CONFIG[a.type] || { label: a.type.toUpperCase(), color: "#5a6580" };
            return (
              <div key={a.id} className={`flex gap-3 items-start px-4 py-2.5 ${idx % 2 === 0 ? "bg-panel" : "bg-[#0d0f14]"} border-b border-hairline last:border-b-0`}>
                <span
                  className="shrink-0 mt-0.5 text-[8px] font-semibold tracking-[0.08em] rounded-[2px] border px-1.5 py-0.5 w-[88px] text-center"
                  style={{ color: cfg.color, borderColor: `${cfg.color}40`, background: `${cfg.color}10` }}
                >
                  {cfg.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-soft leading-normal">
                    <span className="text-body font-medium">{a.user_name}</span>
                    {a.project_name && <span className="text-mut"> · {a.project_name}</span>}
                    {a.task_title && a.type !== "task_completed" && a.type !== "task_created" && (
                      <span className="text-mid"> · {a.task_title}</span>
                    )}
                  </div>
                  {a.detail && <div className="text-[11px] text-mut mt-0.5 break-words">{a.detail}</div>}
                </div>
                <div className="shrink-0 text-[10px] text-ghost pt-0.5">{fmtTime(a.created_at)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
