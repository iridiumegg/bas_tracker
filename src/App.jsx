import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import Shell from "./components/Shell.jsx";
import Home from "./pages/Home.jsx";
import ProjectPage from "./pages/ProjectPage.jsx";
import SummaryPage from "./pages/SummaryPage.jsx";
import ActivityPage from "./pages/ActivityPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="text-[11px] text-dim font-mono tracking-[0.1em]">LOADING…</div>
    </div>
  );

  if (!user) return <LoginPage />;

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/p/:slug" element={<ProjectPage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {user.role === "admin" && <Route path="/admin" element={<AdminPage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}
