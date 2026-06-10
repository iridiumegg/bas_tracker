import { useState, useEffect, useRef } from "react";
import { api } from "../api.js";

// Live status banner. Click to change it — message + presets live in the DB
// now, so no more git pushes to update the site status.
export default function StatusBar() {
  const [status, setStatus] = useState(null);
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    api.getSettings()
      .then(s => { setStatus(s.status_bar); setOptions(s.status_options || []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const save = async (message) => {
    if (!message.trim() || saving) return;
    setSaving(true);
    try {
      const value = await api.setStatusBar(message.trim());
      setStatus(value);
      setOpen(false);
      setCustom("");
    } catch (e) {
      console.error("Status update failed", e);
    } finally {
      setSaving(false);
    }
  };

  if (!status) return null;

  const isAlert = /offline|busy/i.test(status.message);
  const color = isAlert ? "#e74c3c" : "#2ecc71";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Click to change status"
        className="flex items-center gap-2 rounded border px-3 py-[5px] max-w-[380px] cursor-pointer bg-transparent text-left"
        style={{
          background: isAlert ? "#1a0a0a" : "#0f1c14",
          borderColor: isAlert ? "#7b241c" : "#1e4a28",
        }}
      >
        <span
          className="w-[7px] h-[7px] rounded-full shrink-0"
          style={{ background: color, boxShadow: `0 0 6px ${color}`, animation: `${isAlert ? "flash-dot 1s" : "pulse-dot 2s"} infinite` }}
        />
        <span>
          <span className="block text-[10px] tracking-[0.08em] leading-[1.3]" style={{ color }}>{status.message}</span>
          <span className="block text-[9px] mt-px" style={{ color: isAlert ? "#5a2020" : "#2a5a38" }}>{status.date}</span>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-panel border border-line rounded-md p-2 shadow-xl">
          <div className="text-[9px] text-dim tracking-[0.12em] uppercase px-1.5 pb-1.5">Set status</div>
          {options.map(o => (
            <button
              key={o}
              onClick={() => save(o)}
              className="block w-full text-left text-[11px] font-mono px-2 py-1.5 rounded-[3px] cursor-pointer border-0 bg-transparent text-soft hover:bg-raise hover:text-bright"
            >
              {o}
            </button>
          ))}
          <form
            className="flex gap-1.5 mt-1.5 pt-1.5 border-t border-line2"
            onSubmit={e => { e.preventDefault(); save(custom); }}
          >
            <input
              value={custom}
              onChange={e => setCustom(e.target.value)}
              placeholder="Custom…"
              className="flex-1 min-w-0 bg-well border border-line rounded-[3px] px-2 py-1 text-[11px] text-body font-mono outline-none focus:border-accent-line placeholder:text-ghost"
            />
            <button type="submit" disabled={saving} className="text-[10px] font-mono px-2 rounded-[3px] bg-accent-bg text-accent border border-accent-line cursor-pointer disabled:opacity-50">
              Set
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
