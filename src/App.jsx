import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import Home from "./Home.jsx";
import ProjectPage from "./ProjectPage.jsx";
import LoginPage from "./LoginPage.jsx";
import { PROJECTS } from "./projects/index.js";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0b0d11", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 11, color: "#3a4255", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>LOADING…</div>
    </div>
  );

  if (!user) return <LoginPage />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {PROJECTS.map(({ meta, items }) => (
        <Route key={meta.id} path={`/${meta.id}`} element={<ProjectPage meta={meta} items={items} />} />
      ))}
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/bas_tracker">
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
