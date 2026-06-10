import { Link, NavLink } from "react-router-dom";
import StatusBar from "./StatusBar.jsx";
import { useAuth } from "../AuthContext.jsx";

export default function Shell({ children }) {
  const { user, logout } = useAuth();

  const links = [
    ["/", "Projects"],
    ["/summary", "Daily Summary"],
    ["/activity", "Activity"],
    ["/settings", "My Settings"],
  ];
  if (user?.role === "admin") links.push(["/admin", "Admin"]);

  return (
    <div className="min-h-screen bg-ink font-mono text-body flex flex-col">
      <header className="bg-panel border-b border-line px-4 sm:px-7 pt-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] text-mut tracking-[0.12em] uppercase mb-1">
              ES2 · Building Automation Systems
            </div>
            <Link to="/" className="font-sans text-[22px] font-semibold text-bright tracking-[-0.02em] no-underline">
              BAS Workspace
            </Link>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="hidden sm:block"><StatusBar /></div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-mut">{user?.name}</span>
              <button
                onClick={logout}
                className="text-[10px] text-dim bg-transparent border border-line rounded-[3px] px-2 py-[3px] cursor-pointer font-mono hover:text-mut"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
        <nav className="flex gap-1 mt-3 -mx-1 overflow-x-auto">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `px-3 py-2 text-[11px] tracking-[0.08em] uppercase no-underline whitespace-nowrap border-b-2 ${
                  isActive ? "border-accent text-accent" : "border-transparent text-mut hover:text-soft"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="px-4 sm:px-7 py-5 border-t border-hairline text-[10px] text-ghost">
        ES2 Building Automation Systems · Workspace
      </footer>
    </div>
  );
}
