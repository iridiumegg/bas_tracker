import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { api } from "./api.js";

const inputStyle = {
  width: "100%", background: "#090c12", border: "1px solid #1e2330",
  borderRadius: 3, padding: "8px 10px", color: "#c8cdd8", fontSize: 13,
  fontFamily: "'IBM Plex Mono', monospace", outline: "none",
};

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [signupCode, setSignupCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        const { token, user } = await api.register(username, displayName, password, signupCode);
        localStorage.setItem("bas_token", token);
        await login(username, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0d11", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus { border-color: #3a5080 !important; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 360, padding: "0 20px" }}>
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#4a5570", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            Nathan Stewart · ES2
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#e0e4ef", fontFamily: "'IBM Plex Sans', sans-serif" }}>
            BAS Action Tracker
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", marginBottom: 16, background: "#090c12", border: "1px solid #1e2330", borderRadius: 4, padding: 3 }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{
                flex: 1, padding: "6px", background: mode === m ? "#1e2a40" : "transparent",
                border: mode === m ? "1px solid #2d4470" : "1px solid transparent",
                borderRadius: 3, color: mode === m ? "#8ab4f8" : "#3a4255",
                fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer",
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ background: "#0d1017", border: "1px solid #1e2330", borderRadius: 6, padding: "20px" }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: "#4a5570", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" style={inputStyle} />
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: "#4a5570", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="e.g. Nathan Stewart" style={inputStyle} />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: "#4a5570", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"} style={inputStyle} />
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: "#4a5570", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Signup Code</label>
              <input type="text" value={signupCode} onChange={e => setSignupCode(e.target.value)} required placeholder="Get this from Nathan" style={inputStyle} />
            </div>
          )}

          {error && (
            <div style={{ marginBottom: 12, fontSize: 11, color: "#e74c3c", background: "#1a0a0a", border: "1px solid #7b241c", borderRadius: 3, padding: "6px 10px" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "9px", background: loading ? "#111" : "#1e2a40",
            border: "1px solid #2d4470", borderRadius: 3, color: "#8ab4f8",
            fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", cursor: loading ? "default" : "pointer",
            letterSpacing: "0.08em", marginTop: 4,
          }}>
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
