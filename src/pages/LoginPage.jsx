import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";
import { Field, Input, ErrorText } from "../components/ui.jsx";

export default function LoginPage() {
  const { login, setup } = useAuth();
  const [needsSetup, setNeedsSetup] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.needsSetup().then(r => setNeedsSetup(r.needsSetup)).catch(() => {});
  }, []);

  const submit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (needsSetup) {
        await setup({ username, display_name: displayName, email, password });
      } else {
        await login(username, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center font-mono">
      <div className="w-full max-w-[360px] px-5">
        <div className="mb-7 text-center">
          <img src="https://i.redd.it/buutovko6k1a1.gif" alt="" className="w-full rounded-md block" />
        </div>

        <form onSubmit={submit} className="bg-panel border border-line rounded-md p-5">
          {needsSetup && (
            <div className="text-[11px] text-accent bg-accent-bg border border-accent-line rounded-[3px] px-2.5 py-2 mb-4">
              First run — create the admin account. You'll add everyone else from the Admin page.
            </div>
          )}

          <Field label="Username" className="mb-3">
            <Input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
          </Field>

          {needsSetup && (
            <>
              <Field label="Display Name" className="mb-3">
                <Input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="e.g. Nathan Stewart" />
              </Field>
              <Field label="Email (for alerts)" className="mb-3">
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@es2built.com" />
              </Field>
            </>
          )}

          <Field label="Password" className="mb-3">
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              autoComplete={needsSetup ? "new-password" : "current-password"} />
          </Field>

          <ErrorText>{error}</ErrorText>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-[9px] bg-accent-bg border border-accent-line rounded-[3px] text-accent text-[12px] font-mono cursor-pointer tracking-[0.08em] mt-1 disabled:opacity-50 disabled:cursor-default"
          >
            {loading ? "Please wait…" : needsSetup ? "Create Admin Account" : "Sign In"}
          </button>

          {!needsSetup && (
            <div className="text-[10px] text-dim mt-3 text-center">
              Need an account? Ask an admin to add you.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
