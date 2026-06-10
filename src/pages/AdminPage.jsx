import { useState, useEffect, useCallback } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { Button, Field, Input, Select, ErrorText, SectionLabel } from "../components/ui.jsx";

function UserRow({ u, isSelf, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setForm({ display_name: u.display_name, email: u.email || "", role: u.role, password: "" });
    setError("");
    setEditing(true);
  };

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = { display_name: form.display_name, email: form.email, role: form.role };
      if (form.password) body.password = form.password;
      onSaved(await api.updateUser(u.id, body));
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    try {
      onSaved(await api.updateUser(u.id, { active: !u.active }));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={`border-b border-hairline last:border-b-0 ${u.active ? "" : "opacity-50"}`}>
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <div className="text-[13px] text-body font-medium">
            {u.display_name}
            <span className="text-mut font-normal"> @{u.username}</span>
            {u.role === "admin" && <span className="ml-2 text-[8px] tracking-[0.1em] text-accent border border-accent-line bg-accent-bg rounded-[2px] px-1.5 py-0.5">ADMIN</span>}
            {!u.active && <span className="ml-2 text-[8px] tracking-[0.1em] text-bad border border-bad/40 rounded-[2px] px-1.5 py-0.5">DISABLED</span>}
          </div>
          <div className="text-[11px] text-mut mt-0.5">
            {u.email || "no email"} · alerts {u.notify_email ? "on" : "off"}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={editing ? () => setEditing(false) : startEdit}>{editing ? "Cancel" : "Edit"}</Button>
          {!isSelf && (
            <Button variant={u.active ? "danger" : "primary"} onClick={toggleActive}>
              {u.active ? "Disable" : "Re-enable"}
            </Button>
          )}
        </div>
      </div>

      {editing && (
        <form onSubmit={save} className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Field label="Display Name">
              <Input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} required />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Role">
              <Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} disabled={isSelf}>
                <option value="member">member</option>
                <option value="admin">admin</option>
              </Select>
            </Field>
            <Field label="Reset Password (optional)">
              <Input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="New password" />
            </Field>
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save User"}</Button>
        </form>
      )}
    </div>
  );
}

function AddUserForm({ onAdded }) {
  const [form, setForm] = useState({ username: "", display_name: "", email: "", password: "", role: "member" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      onAdded(await api.createUser(form));
      setForm({ username: "", display_name: "", email: "", password: "", role: "member" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-panel border border-line rounded-md p-4 mb-6">
      <SectionLabel className="mb-3">Add User</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <Field label="Username">
          <Input value={form.username} onChange={e => set("username", e.target.value)} required placeholder="e.g. jsmith" />
        </Field>
        <Field label="Display Name">
          <Input value={form.display_name} onChange={e => set("display_name", e.target.value)} required placeholder="e.g. John Smith" />
        </Field>
        <Field label="Email (for alerts)">
          <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jsmith@es2built.com" />
        </Field>
        <Field label="Temporary Password">
          <Input type="text" value={form.password} onChange={e => set("password", e.target.value)} required />
        </Field>
        <Field label="Role">
          <Select value={form.role} onChange={e => set("role", e.target.value)}>
            <option value="member">member</option>
            <option value="admin">admin</option>
          </Select>
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={saving}>{saving ? "Adding…" : "Add User"}</Button>
      <div className="text-[10px] text-dim mt-2">
        Share the username + temporary password with them. They can change it in My Settings.
      </div>
    </form>
  );
}

function StatusOptions() {
  const [options, setOptions] = useState(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then(s => setOptions(s.status_options || [])).catch(() => setOptions([]));
  }, []);

  const persist = async next => {
    setSaving(true);
    try {
      setOptions(await api.setStatusOptions(next));
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const add = e => {
    e.preventDefault();
    if (!draft.trim()) return;
    persist([...options, draft.trim()]);
    setDraft("");
  };

  if (!options) return null;

  return (
    <div className="bg-panel border border-line rounded-md p-4">
      <SectionLabel className="mb-1">Status Bar Presets</SectionLabel>
      <div className="text-[11px] text-mut mb-3">
        Quick-pick options shown when anyone clicks the status banner. The banner flashes red when the message contains "offline" or "busy".
      </div>
      <div className="flex flex-col gap-1.5 mb-3">
        {options.map((o, i) => (
          <div key={`${o}-${i}`} className="flex items-center gap-2 bg-well border border-line2 rounded-[3px] px-2.5 py-1.5">
            <span className="flex-1 text-[12px] text-soft">{o}</span>
            <button
              onClick={() => persist(options.filter((_, j) => j !== i))}
              disabled={saving}
              className="text-mut hover:text-bad cursor-pointer bg-transparent border-0 text-[14px] leading-none font-mono"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
        {options.length === 0 && <div className="text-[11px] text-ghost">No presets yet.</div>}
      </div>
      <form onSubmit={add} className="flex gap-2">
        <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="New preset, e.g. On site — AWSOM" className="flex-1" />
        <Button type="submit" disabled={saving}>Add</Button>
      </form>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState(null);

  const load = useCallback(() => {
    api.getUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  useEffect(load, [load]);

  const onSaved = u => setUsers(prev => prev.map(x => x.id === u.id ? u : x));

  return (
    <div className="px-4 sm:px-7 py-6 max-w-[840px]">
      <div className="font-sans text-[20px] font-semibold text-bright tracking-[-0.02em] mb-1">Admin</div>
      <div className="text-[11px] text-mut mb-5">Manage who can sign in and the status bar presets. No more signup codes — you create accounts here.</div>

      <AddUserForm onAdded={u => setUsers(prev => [...(prev || []), u])} />

      <div className="bg-panel border border-line rounded-md mb-6 overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-line2">
          <SectionLabel>Users ({users?.length ?? "…"})</SectionLabel>
        </div>
        {users?.map(u => (
          <UserRow key={u.id} u={u} isSelf={u.id === user?.id} onSaved={onSaved} />
        ))}
      </div>

      <StatusOptions />
    </div>
  );
}
