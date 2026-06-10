import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { PRIORITY_CONFIG, STATUS_CONFIG, PRIORITIES, STATUSES, fmtTime, isOverdue } from "../config.js";
import { Button, Modal, Field, Input, Select, Textarea, Badge, ErrorText, Stat, SectionLabel } from "../components/ui.jsx";
import { ProjectForm } from "./Home.jsx";

function TaskForm({ task, project, users, onSaved, onCancel }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    details: task?.details || "",
    unit: task?.unit || "",
    category: task?.category || project.categories[0] || "",
    priority: task?.priority || "MEDIUM",
    due_date: task?.due_date?.slice(0, 10) || "",
    assignee_id: task?.assignee_id || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const body = { ...form, assignee_id: form.assignee_id ? Number(form.assignee_id) : null, due_date: form.due_date || null };
    try {
      const saved = task?.id ? await api.updateTask(task.id, body) : await api.createTask(project.id, body);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-panel2 border border-line rounded-md p-4" onClick={e => e.stopPropagation()}>
      <Field label="Issue / Task" className="mb-3">
        <Input value={form.title} onChange={e => set("title", e.target.value)} required placeholder="What needs to happen?" autoFocus />
      </Field>
      <Field label="Required Action / Details" className="mb-3">
        <Textarea rows={2} value={form.details} onChange={e => set("details", e.target.value)} placeholder="Optional details" />
      </Field>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        <Field label="Unit / Equipment">
          <Input value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="e.g. AHU-02" />
        </Field>
        <Field label="Category">
          <Select value={form.category} onChange={e => set("category", e.target.value)}>
            <option value="">—</option>
            {project.categories.map(c => <option key={c} value={c}>{c}</option>)}
            {form.category && !project.categories.includes(form.category) && <option value={form.category}>{form.category}</option>}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onChange={e => set("priority", e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Due Date">
          <Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
        </Field>
        <Field label="Assignee">
          <Select value={form.assignee_id} onChange={e => set("assignee_id", e.target.value)}>
            <option value="">Unassigned</option>
            {users.filter(u => u.active).map(u => <option key={u.id} value={u.id}>{u.display_name}</option>)}
          </Select>
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : task?.id ? "Save Changes" : "Add Task"}</Button>
      </div>
    </form>
  );
}

function Notes({ task }) {
  const [notes, setNotes] = useState(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getNotes(task.id).then(setNotes).catch(() => setNotes([]));
  }, [task.id]);

  const submit = async () => {
    if (!draft.trim() || saving) return;
    setSaving(true);
    try {
      const row = await api.addNote(task.id, draft.trim());
      setNotes(prev => [...(prev || []), row]);
      setDraft("");
    } catch (e) {
      console.error("Note save failed", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3.5" onClick={e => e.stopPropagation()}>
      <SectionLabel className="mb-2">Field Notes</SectionLabel>
      {notes?.length > 0 && (
        <div className="mb-2.5 flex flex-col gap-1.5">
          {notes.map(n => (
            <div key={n.id} className="bg-well border border-line2 rounded-[3px] px-2.5 py-2">
              <div className="text-[12px] text-note leading-relaxed whitespace-pre-wrap">{n.content}</div>
              <div className="text-[10px] text-ghost mt-1">{n.created_by_name} · {fmtTime(n.created_at)}</div>
            </div>
          ))}
        </div>
      )}
      <Textarea rows={2} value={draft} placeholder="Add a note…" onChange={e => setDraft(e.target.value)} className="!text-[12px]" />
      <Button className="mt-1.5" disabled={saving} onClick={submit}>
        {saving ? "Saving…" : "Save Note"}
      </Button>
    </div>
  );
}

function TaskRow({ task, idx, project, users, expanded, onToggle, onChanged, onRemoved }) {
  const [editing, setEditing] = useState(false);
  const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
  const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.OPEN;
  const overdue = isOverdue(task);

  const setStatus = async (status) => {
    try {
      onChanged(await api.updateTask(task.id, { status }));
    } catch (e) {
      console.error("Status save failed", e);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await api.archiveTask(task.id);
      onRemoved(task.id);
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  return (
    <div>
      <div
        onClick={onToggle}
        className={`grid gap-3 items-start px-4 py-[11px] border-b border-hairline cursor-pointer transition-colors hover:bg-raise grid-cols-[64px_1fr] sm:grid-cols-[40px_84px_120px_130px_1fr_90px] ${
          expanded ? "bg-panel2" : idx % 2 === 0 ? "bg-ink" : "bg-[#0d0f14]"
        }`}
      >
        <div className="hidden sm:block text-[11px] text-ghost pt-0.5">{String(task.id).padStart(2, "0")}</div>
        <div className="flex flex-col gap-1">
          <Badge cfg={pc} />
          <Badge cfg={sc} small />
        </div>
        <div className="hidden sm:block text-[12px] text-accent font-medium pt-px">{task.unit}</div>
        <div className="hidden sm:block text-[11px] text-mid pt-0.5">{task.category}</div>
        <div>
          <div className="text-[12px] text-soft leading-normal">{task.title}</div>
          {task.details && (
            <div className="text-[11px] text-mut mt-0.5">
              ↳ {task.details.length > 80 ? task.details.slice(0, 80) + "…" : task.details}
            </div>
          )}
          <div className="sm:hidden flex gap-2 mt-1 text-[10px]">
            {task.unit && <span className="text-accent">{task.unit}</span>}
            {task.due_date && <span className={overdue ? "text-bad" : "text-mut"}>due {task.due_date.slice(5, 10).replace("-", "/")}</span>}
          </div>
        </div>
        <div className="hidden sm:block text-right pt-0.5">
          {task.due_date && (
            <div className={`text-[10px] ${overdue ? "text-bad font-semibold" : "text-mut"}`}>
              {overdue ? "OVERDUE " : "due "}{task.due_date.slice(5, 10).replace("-", "/")}
            </div>
          )}
          {task.assignee_name && <div className="text-[10px] text-mid mt-0.5">{task.assignee_name}</div>}
          {task.note_count > 0 && <div className="text-[9px] text-ghost mt-0.5">{task.note_count} note{task.note_count !== 1 ? "s" : ""}</div>}
        </div>
      </div>

      {expanded && (
        <div className="bg-panel border-b border-line px-4 py-3.5" style={{ borderLeft: `3px solid ${pc.border}` }}>
          {editing ? (
            <TaskForm
              task={task}
              project={project}
              users={users}
              onCancel={() => setEditing(false)}
              onSaved={t => { setEditing(false); onChanged(t); }}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-3.5">
                <div>
                  <SectionLabel className="mb-1.5">Full Issue</SectionLabel>
                  <div className="text-[12px] text-body leading-relaxed">{task.title}</div>
                </div>
                <div>
                  <SectionLabel className="mb-1.5">Required Action</SectionLabel>
                  <div className="text-[12px] text-body leading-relaxed whitespace-pre-wrap">{task.details || "—"}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-dim tracking-[0.08em]">STATUS:</span>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={e => { e.stopPropagation(); setStatus(key); }}
                      className="font-mono text-[10px] px-2 py-[3px] rounded-[2px] cursor-pointer border transition-all hover:opacity-80"
                      style={task.status === key
                        ? { background: cfg.bg, color: cfg.text, borderColor: cfg.border }
                        : { background: "transparent", color: "#3a4255", borderColor: "#1e2330" }}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
                {task.status_changed_by_name && (
                  <div className="text-[10px] text-dim">
                    by <span className="text-mid">{task.status_changed_by_name}</span> · {fmtTime(task.status_changed_at)}
                  </div>
                )}
                <div className="ml-auto flex gap-2" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
                  <Button variant="danger" onClick={remove}>Delete</Button>
                </div>
              </div>

              <div className="flex gap-5 flex-wrap mt-3 text-[10px] text-dim">
                {task.source && <span>Source: <span className="text-mid">{task.source}</span></span>}
                {task.assignee_name && <span>Assignee: <span className="text-mid">{task.assignee_name}</span></span>}
                {task.due_date && <span>Due: <span className={isOverdue(task) ? "text-bad" : "text-mid"}>{task.due_date.slice(0, 10)}</span></span>}
                {task.created_by_name && <span>Added by: <span className="text-mid">{task.created_by_name}</span></span>}
              </div>

              <Notes task={task} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProjectPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [notFound, setNotFound] = useState(false);

  const [filterCat, setFilterCat] = useState("All");
  const [filterPri, setFilterPri] = useState("All");
  const [filterStat, setFilterStat] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editingProject, setEditingProject] = useState(false);

  const load = useCallback(() => {
    api.getProject(slug)
      .then(({ project, tasks }) => { setProject(project); setTasks(tasks); })
      .catch(() => setNotFound(true));
    api.getUsers().then(setUsers).catch(() => {});
  }, [slug]);

  useEffect(load, [load]);

  if (notFound) {
    return (
      <div className="p-12 text-center text-[13px] text-ghost">
        Project not found. <Link to="/" className="text-accent">← All Projects</Link>
      </div>
    );
  }
  if (!project) {
    return <div className="p-12 text-center text-[11px] text-dim tracking-[0.1em]">LOADING…</div>;
  }

  const onChanged = t => setTasks(prev => prev.map(x => x.id === t.id ? t : x));
  const onRemoved = id => setTasks(prev => prev.filter(x => x.id !== id));

  const q = search.trim().toLowerCase();
  const filtered = tasks.filter(t => {
    if (filterCat !== "All" && t.category !== filterCat) return false;
    if (filterPri !== "All" && t.priority !== filterPri) return false;
    if (filterStat !== "All" && t.status !== filterStat) return false;
    if (q && ![t.title, t.details, t.unit, t.category, t.assignee_name].some(v => v?.toLowerCase().includes(q))) return false;
    return true;
  });

  const counts = {
    open: tasks.filter(t => t.status === "OPEN").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    resolved: tasks.filter(t => t.status === "RESOLVED").length,
    overdue: tasks.filter(isOverdue).length,
  };

  const archiveProject = async () => {
    if (!confirm(`Archive project "${project.name}"? It will disappear from the dashboard.`)) return;
    await api.archiveProject(project.id);
    navigate("/");
  };

  return (
    <div>
      {/* Project header */}
      <div className="bg-panel border-b border-line px-4 sm:px-7 py-4">
        <div className="mb-2.5">
          <Link to="/" className="text-mut text-[11px] no-underline tracking-[0.08em] hover:text-accent">← All Projects</Link>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-mut tracking-[0.1em] uppercase mb-1">
              {project.client}{project.phase ? ` · ${project.phase}` : ""}
            </div>
            <div className="font-sans text-[20px] font-semibold text-bright tracking-[-0.02em]">{project.name}</div>
            <div className="text-[11px] text-mut mt-1">
              {project.subtitle}{project.subtitle && project.source ? " · " : ""}{project.source}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2.5">
            <div className="flex gap-4">
              <Stat label="OPEN" value={counts.open} color="#e74c3c" />
              <Stat label="IN PROGRESS" value={counts.inProgress} color="#f1c40f" />
              <Stat label="RESOLVED" value={counts.resolved} color="#2ecc71" />
              {counts.overdue > 0 && <Stat label="OVERDUE" value={counts.overdue} color="#e74c3c" />}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditingProject(true)}>Edit Project</Button>
              <Button variant="danger" onClick={archiveProject}>Archive</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters + actions */}
      <div className="px-4 sm:px-7 py-2.5 border-b border-line2">
        <div className="flex flex-wrap gap-3.5 items-center">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="!w-48 !py-1 !text-[11px]"
          />
          {[
            { label: "Cat", opts: ["All", ...project.categories], val: filterCat, set: setFilterCat },
            { label: "Pri", opts: ["All", ...PRIORITIES], val: filterPri, set: setFilterPri },
            { label: "Status", opts: ["All", ...STATUSES], val: filterStat, set: setFilterStat },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
              <span className="text-[10px] text-mut tracking-[0.08em] uppercase">{f.label}:</span>
              <div className="flex gap-1">
                {f.opts.map(o => (
                  <button
                    key={o}
                    onClick={() => f.set(o)}
                    className={`font-mono text-[11px] px-2.5 py-1 rounded-[3px] cursor-pointer border whitespace-nowrap transition-all ${
                      f.val === o ? "bg-accent-bg text-accent border-accent-line" : "bg-transparent text-mut border-line hover:opacity-85"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-mut">{filtered.length}/{tasks.length}</span>
            <Button onClick={() => setAdding(a => !a)}>+ New Task</Button>
          </div>
        </div>
      </div>

      {adding && (
        <div className="px-4 sm:px-7 py-4 border-b border-line2">
          <TaskForm
            project={project}
            users={users}
            onCancel={() => setAdding(false)}
            onSaved={t => { setAdding(false); setTasks(prev => [...prev, t]); }}
          />
        </div>
      )}

      {/* Column headers */}
      <div className="hidden sm:grid gap-3 px-4 py-2 border-b border-line2 text-[9px] text-dim tracking-[0.12em] uppercase grid-cols-[40px_84px_120px_130px_1fr_90px]">
        <div>#</div><div>Priority</div><div>Unit</div><div>Category</div><div>Issue / Action</div><div className="text-right">Due / Who</div>
      </div>

      {/* Tasks */}
      <div>
        {filtered.map((task, idx) => (
          <TaskRow
            key={task.id}
            task={task}
            idx={idx}
            project={project}
            users={users}
            expanded={expandedId === task.id}
            onToggle={() => setExpandedId(expandedId === task.id ? null : task.id)}
            onChanged={onChanged}
            onRemoved={onRemoved}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center text-ghost text-[13px]">No tasks match the current filters.</div>
      )}

      {editingProject && (
        <Modal title="Edit Project" onClose={() => setEditingProject(false)}>
          <ProjectForm
            project={project}
            onClose={() => setEditingProject(false)}
            onSaved={p => { setEditingProject(false); setProject(p); if (p.slug !== slug) navigate(`/p/${p.slug}`, { replace: true }); }}
          />
        </Modal>
      )}
    </div>
  );
}
