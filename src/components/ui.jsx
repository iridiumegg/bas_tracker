export function SectionLabel({ children, className = "" }) {
  return (
    <div className={`text-[9px] text-dim tracking-[0.12em] uppercase ${className}`}>
      {children}
    </div>
  );
}

export function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[10px] text-mut tracking-[0.1em] uppercase mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full bg-well border border-line rounded-[3px] px-2.5 py-2 text-[13px] text-body font-mono outline-none focus:border-accent-line placeholder:text-ghost";

export function Input(props) {
  return <input {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${inputCls} ${props.className || ""}`}>
      {children}
    </select>
  );
}

export function Textarea(props) {
  return <textarea {...props} className={`${inputCls} resize-y ${props.className || ""}`} />;
}

export function Button({ variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-accent-bg text-accent border border-accent-line hover:opacity-85",
    ghost: "bg-transparent text-mut border border-line hover:text-soft hover:border-accent-line",
    danger: "bg-transparent text-bad/70 border border-line hover:text-bad hover:border-bad/40",
  };
  return (
    <button
      {...props}
      className={`font-mono text-[11px] px-3 py-1.5 rounded-[3px] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-default ${variants[variant]} ${className}`}
    />
  );
}

export function Badge({ cfg, small = false }) {
  return (
    <span
      className={`inline-block font-semibold rounded-[2px] border px-1.5 py-0.5 ${small ? "text-[8px] tracking-[0.08em]" : "text-[9px] tracking-[0.1em]"}`}
      style={{ color: cfg.text, background: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto p-4 sm:p-10"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} bg-panel border border-line rounded-md p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-sans text-[15px] font-semibold text-bright">{title}</div>
          <button onClick={onClose} className="text-mut hover:text-soft cursor-pointer text-[16px] leading-none bg-transparent border-0 font-mono">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return (
    <div className="text-[11px] text-bad bg-[#1a0a0a] border border-[#7b241c] rounded-[3px] px-2.5 py-1.5 mb-3">
      {children}
    </div>
  );
}

export function Stat({ label, value, color }) {
  return (
    <div className="text-center">
      <div className="text-[20px] font-semibold leading-none" style={{ color }}>{value}</div>
      <div className="text-[8px] text-dim tracking-[0.1em] mt-0.5">{label}</div>
    </div>
  );
}
