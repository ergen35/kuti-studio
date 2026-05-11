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

function WorkspaceLink({
  to,
  children,
  end = false,
}: ComponentProps<typeof NavLink>) {
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
  const workspaceLabel = projectId ? `${t("projectDashboard")} · ${projectId.slice(0, 8)}` : t("projectHub");

  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">{t("appTitle")}</p>
          <h1>{t("appTagline")}</h1>
          <p className="muted">{t("appDescription")}</p>
          <div className="brand-badges">
            <Badge>Local-first</Badge>
            <Badge variant="secondary">FastAPI</Badge>
            <Badge variant="outline">shadcn/ui</Badge>
          </div>
        </div>

        <nav className="nav-links" aria-label={t("primaryNavigation")}>
          <div className="nav-section">
            <p className="nav-label">Workspace</p>
            <WorkspaceLink to="/" end>
              {t("projectHub")}
            </WorkspaceLink>
          </div>

          {projectId ? (
            <>
              <div className="nav-section">
                <p className="nav-label">Project</p>
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

              <div className="nav-note">
                {t("workspaceDescription")}
                <div className="divider" />
                <span className="monospace-block">Project ID: {projectId}</span>
              </div>
            </>
          ) : (
            <div className="nav-note">{t("workspaceDescription")}</div>
          )}
        </nav>

        <Separator className="sidebar-separator" />

        <div className="sidebar-footer">
          <ThemeToggle />
          <LocaleToggle />
        </div>
      </aside>

      <main className="workspace">
        {isBusy ? <div className="workspace-progress" aria-hidden="true" /> : null}

        <header className="topbar">
          <div className="topbar-copy">
            <p className="eyebrow">{t("currentWorkspace")}</p>
            <h2>{workspaceLabel}</h2>
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
