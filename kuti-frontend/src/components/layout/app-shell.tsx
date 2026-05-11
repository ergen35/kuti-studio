import type { ComponentProps } from "react";

import { Link, NavLink, Outlet, useNavigation, useParams } from "react-router-dom";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { LocaleToggle } from "@/components/ui/locale-toggle";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui";

function navLinkClass({ isActive, isPending }: { isActive: boolean; isPending: boolean }) {
  return cn("nav-link", isActive && "is-active", isPending && "is-pending");
}

function WorkspaceLink({ to, children, end = false }: ComponentProps<typeof NavLink>) {
  return (
    <NavLink to={to} end={end} className={navLinkClass}>
      {children}
    </NavLink>
  );
}

export function AppShell() {
  const theme = useUIStore((state) => state.theme);
  const t = useT();
  const navigation = useNavigation();
  const { projectId } = useParams();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isNavigating = navigation.state !== "idle";
  const isBusy = isNavigating || isFetching > 0 || isMutating > 0;

  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className="sidebar">
        <header className="sidebar-hero">
          <div>
            <p className="eyebrow">Kuti Studio</p>
            <h1>{t("appTagline")}</h1>
            <p className="muted">Classic editorial workbench for narrative production.</p>
          </div>
          <div className="sidebar-status-row">
            <Badge variant="outline">Local</Badge>
            <Badge variant="secondary">FastAPI</Badge>
            <Badge variant="outline">SQLite</Badge>
          </div>
        </header>

        <section className="sidebar-project">
          <div className="section-head">
            <div>
              <p className="nav-label">Workspace</p>
              <h4>{projectId ? projectId.slice(0, 8) : t("projectHub")}</h4>
            </div>
            {projectId ? (
              <Link to={`/projects/${projectId}`} className="button button-ghost align-start">
                Open
              </Link>
            ) : null}
          </div>
          <p className="muted">{projectId ? t("workspaceDescription") : "Browse projects, then enter a project workspace."}</p>
        </section>

        <nav className="nav-links" aria-label={t("primaryNavigation")}>
          <div className="nav-section">
            <p className="nav-label">Index</p>
            <div className="nav-grid">
              <WorkspaceLink to="/" end>
                {t("projectHub")}
              </WorkspaceLink>
            </div>
          </div>

          {projectId ? (
            <>
              <div className="nav-section">
                <p className="nav-label">Project</p>
                <div className="nav-grid">
                  <WorkspaceLink to={`/projects/${projectId}`} end>
                    {t("projectDashboard")}
                  </WorkspaceLink>
                  <WorkspaceLink to={`/projects/${projectId}/story`}>
                    {t("storyline")}
                  </WorkspaceLink>
                  <WorkspaceLink to={`/projects/${projectId}/characters`}>
                    Characters
                  </WorkspaceLink>
                  <WorkspaceLink to={`/projects/${projectId}/assets`}>
                    {t("assetsLibrary")}
                  </WorkspaceLink>
                  <WorkspaceLink to={`/projects/${projectId}/generation`}>
                    {t("generationStudio")}
                  </WorkspaceLink>
                  <WorkspaceLink to={`/projects/${projectId}/exports`}>
                    {t("exports")}
                  </WorkspaceLink>
                  <WorkspaceLink to={`/projects/${projectId}/versions`}>
                    {t("versioning")}
                  </WorkspaceLink>
                  <WorkspaceLink to={`/projects/${projectId}/warnings`}>
                    {t("warnings")}
                  </WorkspaceLink>
                  <WorkspaceLink to={`/projects/${projectId}/settings`}>
                    {t("settings")}
                  </WorkspaceLink>
                </div>
              </div>

              <div className="nav-note compact-note">
                <strong>Workspace notes</strong>
                <p>{t("workspaceDescription")}</p>
              </div>
            </>
          ) : null}
        </nav>

        <Separator className="sidebar-separator" />

        <footer className="sidebar-footer">
          <ThemeToggle />
          <LocaleToggle />
        </footer>
      </aside>

      <main className="workspace">
        {isBusy ? <div className="workspace-progress" aria-hidden="true" /> : null}

        <header className="topbar">
          <div className="topbar-copy">
            <p className="eyebrow">{t("currentWorkspace")}</p>
            <h2>{projectId ? `${t("projectDashboard")} · ${projectId.slice(0, 8)}` : t("projectHub")}</h2>
            <p className="muted">{t("workspaceDescription")}</p>
          </div>
          <div className="topbar-badges">
            <Badge variant="outline">{projectId ? projectId.slice(0, 8) : "hub"}</Badge>
            <Badge>{theme}</Badge>
            <Badge variant="secondary">{isMutating > 0 ? `${isMutating} saving` : "idle"}</Badge>
            <Badge variant="outline">{isFetching > 0 ? `${isFetching} loading` : "synced"}</Badge>
          </div>
        </header>

        <section className="content-surface" aria-busy={isBusy}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}
