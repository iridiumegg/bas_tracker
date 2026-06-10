import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { Button, Modal, Field, Input, ErrorText, Stat } from "../components/ui.jsx";

export function ProjectForm({ project, onSaved, onClose }) {
  const [name, setName] = useState(project?.name || "");
  const [client, setClient] = useState(project?.client || "");
  const [subtitle, setSubtitle] = useState(project?.subtitle || "");
  const [phase, setPhase] = useState(project?.phase || "Active");
  const [source, setSource] = useState(project?.source || "");
  const [categories, setCategories] = useState((project?.categories || []).join(", "));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const body = {
      name, client, subtitle, phase, source,
      categories: categories.split(",").map(c => c.trim()).filter(Boolean),
    };
    try {
      const saved = project?.id ? await api.updateProject(project.id, body) : await api.createProject(body);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Field label="Project Name" className="mb-3">
        <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. CBMAA Phase 3" />
      </Field>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Client">
          <Input value={client} onChange={e => setClient(e.target.value)} placeholder="ES2" />
        </Field>
        <Field label="Phase">
          <Input value={phase} onChange={e => setPhase(e.target.value)} placeholder="Commissioning" />
        </Field>
      </div>
      <Field label="Subtitle" className="mb-3">
        <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Short description" />
      </Field>
      <Field label="Source Document" className="mb-3">
        <Input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. TAB Report Book 6-5-26" />
      </Field>
      <Field label="Categories (comma-separated)" className="mb-4">
        <Input value={categories} onChange={e => setCategories(e.target.value)} placeholder="Programming, Sensor Cal, Field Work" />
      </Field>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : project?.id ? "Save Changes" : "Create Project"}</Button>
      </div>
    </form>
  );
}

function ProjectCard({ p }) {
  const pct = p.total ? Math.round((p.resolved / p.total) * 100) : 0;
  return (
    <Link
      to={`/p/${p.slug}`}
      className="block bg-panel border border-line rounded-md px-5 py-[18px] no-underline text-inherit transition-colors hover:bg-panel2 hover:border-accent-line"
    >
      <div className="text-[10px] text-mut tracking-[0.1em] uppercase mb-1">{p.client || "—"}</div>
      <div className="font-sans text-[16px] font-semibold text-bright mb-0.5">{p.name}</div>
      <div className="text-[11px] text-mut mb-3.5 min-h-[14px]">{p.subtitle}</div>

      <div className="bg-hairline rounded-sm h-1 mb-3 overflow-hidden">
        <div className="h-full bg-ok rounded-sm transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex gap-4 items-end">
        <Stat label="OPEN" value={p.open} color="#e74c3c" />
        <Stat label="IN PROG" value={p.in_progress} color="#f1c40f" />
        <Stat label="RESOLVED" value={p.resolved} color="#2ecc71" />
        <Stat label="TOTAL" value={p.total} color="#4a5570" />
        {p.overdue > 0 && <Stat label="OVERDUE" value={p.overdue} color="#e74c3c" />}
        <div className="ml-auto text-right">
          <div className="text-[20px] font-semibold leading-none text-mid">{pct}%</div>
          <div className="text-[8px] text-dim tracking-[0.1em] mt-0.5">COMPLETE</div>
        </div>
      </div>

      {p.source && <div className="mt-3 text-[10px] text-dim">{p.source}</div>}
    </Link>
  );
}

export default function Home() {
  const [projects, setProjects] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(() => {
    setLoadError("");
    api.getProjects().then(setProjects).catch(e => { setProjects([]); setLoadError(e.message); });
  }, []);

  useEffect(load, [load]);

  if (!projects) {
    return <div className="p-12 text-center text-[11px] text-dim tracking-[0.1em]">LOADING…</div>;
  }

  const phases = {};
  for (const p of projects) {
    const phase = p.phase || "Other";
    (phases[phase] ||= []).push(p);
  }

  return (
    <div className="px-4 sm:px-7 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="text-[11px] text-mut">
          {projects.length} active project{projects.length !== 1 ? "s" : ""}
        </div>
        <Button onClick={() => setShowNew(true)}>+ New Project</Button>
      </div>

      {Object.entries(phases).map(([phase, list]) => (
        <div key={phase} className="mb-8">
          <div className="text-[9px] text-dim tracking-[0.14em] uppercase mb-3 pb-2 border-b border-line2">
            {phase} &nbsp;·&nbsp; {list.length} project{list.length !== 1 ? "s" : ""}
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
            {list.map(p => <ProjectCard key={p.id} p={p} />)}
          </div>
        </div>
      ))}

      {loadError ? (
        <div className="bg-[#1a0a0a] border border-[#7b241c] rounded-md p-6 text-center">
          <div className="text-[13px] text-bad mb-2">Couldn't load projects</div>
          <div className="text-[11px] text-mut mb-4">{loadError}</div>
          <Button variant="ghost" onClick={load}>Retry</Button>
        </div>
      ) : projects.length === 0 && (
        <div className="py-16 text-center text-[13px] text-ghost">
          No projects yet. Create your first one.
        </div>
      )}

      {showNew && (
        <Modal title="New Project" onClose={() => setShowNew(false)}>
          <ProjectForm onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}
