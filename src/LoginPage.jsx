import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0b0d11", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap'); * { box-sizing: border-box; }`}</style>
      <div style={{ width: "100%", maxWidth: 360, padding: "0 20px" }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#4a5570", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            Nathan Stewart · ES2
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#e0e4ef", fontFamily: "'IBM Plex Sans', sans-serif" }}>
            BAS Action Tracker
          </div>
        </div>

        <form onSubmit={submit} style={{ background: "#0d1017", border: "1px solid #1e2330", borderRadius: 6, padding: "24px 20px" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: "#4a5570", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: "100%", background: "#090c12", border: "1px solid #1e2330", borderRadius: 3, padding: "8px 10px", color: "#c8cdd8", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", outline: "none" }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, color: "#4a5570", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: "100%", background: "#090c12", border: "1px solid #1e2330", borderRadius: 3, padding: "8px 10px", color: "#c8cdd8", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", outline: "none" }}
            />
          </div>
          {error && (
            <div style={{ marginBottom: 14, fontSize: 11, color: "#e74c3c", background: "#1a0a0a", border: "1px solid #7b241c", borderRadius: 3, padding: "6px 10px" }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "9px", background: loading ? "#111" : "#1e2a40",
            border: "1px solid #2d4470", borderRadius: 3, color: "#8ab4f8",
            fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", cursor: loading ? "default" : "pointer",
            letterSpacing: "0.08em",
          }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 12, textAlign: "center", fontSize: 10, color: "#2a3045" }}>
          Contact Nathan to get an account.
        </div>
      </div>
    </div>
  );
}
