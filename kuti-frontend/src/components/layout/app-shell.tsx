import { Link, Outlet } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleToggle } from "@/components/ui/locale-toggle";
import { Separator } from "@/components/ui/separator";
import { useT } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui";

export function AppShell() {
  const theme = useUIStore((state) => state.theme);
  const t = useT();

  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">{t("appTitle")}</p>
          <h1>{t("appTagline")}</h1>
          <p className="muted">
            {t("appDescription")}
          </p>
          <div className="brand-badges">
            <Badge>Local-first</Badge>
            <Badge variant="secondary">FastAPI</Badge>
            <Badge variant="outline">shadcn/ui</Badge>
          </div>
        </div>

        <nav className="nav-links" aria-label={t("primaryNavigation")}>
          <div className="nav-section">
            <p className="nav-label">Workspace</p>
            <Link to="/" className="nav-link">
              {t("projectHub")}
            </Link>
          </div>

          <div className="nav-section">
            <p className="nav-label">Project</p>
            <Link to="/projects/demo-project" className="nav-link">
              {t("projectDashboard")}
            </Link>
            <Link to="/projects/demo-project/story" className="nav-link">
              {t("storyline")}
            </Link>
            <Link to="/projects/demo-project/characters" className="nav-link">
              Characters
            </Link>
            <Link to="/projects/demo-project/assets" className="nav-link">
              {t("assetsLibrary")}
            </Link>
          </div>

          <div className="nav-section">
            <p className="nav-label">Production</p>
            <Link to="/projects/demo-project/generation" className="nav-link">
              {t("generationStudio")}
            </Link>
            <Link to="/projects/demo-project/exports" className="nav-link">
              {t("exports")}
            </Link>
            <Link to="/projects/demo-project/versions" className="nav-link">
              {t("versioning")}
            </Link>
            <Link to="/projects/demo-project/warnings" className="nav-link">
              {t("warnings")}
            </Link>
            <Link to="/projects/demo-project/settings" className="nav-link">
              {t("settings")}
            </Link>
          </div>

          <div className="nav-note">
            {t("workspaceDescription")}
          </div>
        </nav>

        <Separator className="sidebar-separator" />

        <div className="sidebar-footer">
          <ThemeToggle />
          <LocaleToggle />
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-copy">
            <p className="eyebrow">{t("currentWorkspace")}</p>
            <h2>{t("workspaceTitle")}</h2>
            <p className="muted">{t("workspaceDescription")}</p>
          </div>
          <div className="topbar-badges">
            <Badge variant="outline">{t("backendReady")}</Badge>
            <Badge>{theme}</Badge>
          </div>
        </header>

        <section className="content-surface">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
