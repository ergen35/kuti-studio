import type { ReactNode } from "react";

import { Link } from "react-router-dom";

import { Card } from "@/components/ui/card";

export type StoryWorkspaceStat = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
};

type StoryWorkspaceFrameProps = {
  eyebrow: string;
  title: string;
  intro: string;
  stats: StoryWorkspaceStat[];
  backHref: string;
  backLabel: string;
  actions?: ReactNode;
  asideTitle: string;
  asideBody: ReactNode;
  children: ReactNode;
};

export function StoryWorkspaceFrame({
  eyebrow,
  title,
  intro,
  stats,
  backHref,
  backLabel,
  actions,
  asideTitle,
  asideBody,
  children,
}: StoryWorkspaceFrameProps) {
  return (
    <div className="page-stack story-screen story-workspace">
      <div className="hero story-hero story-workspace-hero">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
          <p className="muted max-width">{intro}</p>
          <div className="story-summary-grid story-workspace-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="story-stat story-workspace-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
                {stat.hint ? <p className="muted story-workspace-hint">{stat.hint}</p> : null}
              </div>
            ))}
          </div>
        </div>
        <Card className="hero-card story-hub-card story-workspace-aside">
          <span className="status-dot" />
          <strong>{asideTitle}</strong>
          <div className="muted">{asideBody}</div>
        </Card>
      </div>

      <div className="story-toolbar story-workspace-toolbar">
        <Link to={backHref} className="button button-secondary">
          {backLabel}
        </Link>
        {actions ? <div className="project-actions">{actions}</div> : null}
      </div>

      {children}
    </div>
  );
}
