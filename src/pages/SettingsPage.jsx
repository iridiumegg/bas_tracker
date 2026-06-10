import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";
import { Button, Field, Input, ErrorText } from "../components/ui.jsx";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const body = { display_name: displayName, email };
      if (newPassword) {
        body.password = newPassword;
        body.current_password = currentPassword;
      }
      const { user: updated } = await api.updateMe(body);
      setUser(updated);
      setCurrentPassword("");
      setNewPassword("");
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 sm:px-7 py-6 max-w-[480px]">
      <div className="font-sans text-[20px] font-semibold text-bright tracking-[-0.02em] mb-1">My Settings</div>
      <div className="text-[11px] text-mut mb-5">Signed in as @{user?.username}</div>

      <form onSubmit={submit} className="bg-panel border border-line rounded-md p-5">
        <Field label="Display Name" className="mb-3">
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} required />
        </Field>
        <Field label="Email (optional)" className="mb-5">
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@es2built.com" />
        </Field>

        <div className="border-t border-line2 pt-4 mb-4">
          <div className="text-[10px] text-dim tracking-[0.1em] uppercase mb-3">Change Password (optional)</div>
          <Field label="Current Password" className="mb-3">
            <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <Field label="New Password">
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>

        <ErrorText>{error}</ErrorText>
        {saved && <div className="text-[11px] text-ok mb-3">Saved.</div>}

        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Settings"}</Button>
      </form>
    </div>
  );
}
