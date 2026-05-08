import { Link, Outlet } from "react-router-dom";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleToggle } from "@/components/ui/locale-toggle";
import { useUIStore } from "@/stores/ui";

export function AppShell() {
  const theme = useUIStore((state) => state.theme);

  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Kuti Studio</p>
          <h1>Local narrative production</h1>
          <p className="muted">
            Phase 0 scaffold: backend contract, UI shell, and project-wide context.
          </p>
        </div>

        <nav className="nav-links" aria-label="Primary navigation">
          <Link to="/" className="nav-link">
            Project Hub
          </Link>
          <Link to="/projects/demo-project" className="nav-link">
            Project Dashboard
          </Link>
          <div className="nav-note">
            Characters live inside a project context. Open a project dashboard to access Phase 2.
          </div>
          <Link to="/projects/demo-project/settings" className="nav-link">
            Project Settings
          </Link>
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle />
          <LocaleToggle />
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Current workspace</p>
            <h2>Project context pinned across routes</h2>
          </div>
          <div className="status-pill">Backend contract ready</div>
        </header>

        <section className="content-surface">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
