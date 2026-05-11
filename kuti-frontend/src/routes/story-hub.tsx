import { Link, useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import { getStory } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StoryWorkspaceFrame } from "@/components/layout/story-workspace";
import { queryKeys } from "@/lib/query-keys";
import { useT } from "@/lib/i18n";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="story-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function StoryHubRoute() {
  const { projectId } = useParams();
  const t = useT();

  const storyQuery = useQuery({
    queryKey: queryKeys.story(projectId ?? ""),
    queryFn: () => getStory(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  if (!projectId) {
    return <p className="muted">{t("missingProjectId")}</p>;
  }

  const tomes = storyQuery.data?.tomes ?? [];
  const chapters = storyQuery.data?.chapters ?? [];
  const scenes = storyQuery.data?.scenes ?? [];
  const orphanRefs = storyQuery.data?.orphan_references ?? [];

  return (
    <StoryWorkspaceFrame
      eyebrow={t("storyHub")}
      title={t("storyHubTitle")}
      intro={t("storyHubIntro")}
      stats={[
        { label: t("storyTomes"), value: tomes.length },
        { label: t("storyChapters"), value: chapters.length },
        { label: t("storyScenes"), value: scenes.length },
        { label: "Orphans", value: orphanRefs.length },
      ]}
      backHref={`/projects/${projectId}`}
      backLabel={t("backToDashboard")}
      asideTitle="Focused editing"
      asideBody={
        <p>
          Create tomes, chapters, and scenes on their own screens to keep the narrative tree easy to scan and edit.
        </p>
      }
    >
      <div className="story-hub-grid">
        <Card className="story-panel story-nav-card">
          <p className="eyebrow">{t("storyTomes")}</p>
          <h4>Volume layer</h4>
          <p className="muted">{t("storyTomesIntro")}</p>
          <Link to={`/projects/${projectId}/story/tomes`} className="button button-primary">
            {t("openTomes")}
          </Link>
        </Card>

        <Card className="story-panel story-nav-card">
          <p className="eyebrow">{t("storyChapters")}</p>
          <h4>Chapter layer</h4>
          <p className="muted">{t("storyChaptersIntro")}</p>
          <Link to={`/projects/${projectId}/story/chapters`} className="button button-primary">
            {t("openChapters")}
          </Link>
        </Card>

        <Card className="story-panel story-nav-card">
          <p className="eyebrow">{t("storyScenes")}</p>
          <h4>Scene layer</h4>
          <p className="muted">{t("storyScenesIntro")}</p>
          <Link to={`/projects/${projectId}/story/scenes`} className="button button-primary">
            {t("openScenes")}
          </Link>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Structure</p>
              <h4>Narrative inventory</h4>
            </div>
          </div>
          <div className="story-summary-grid">
            <Stat label={t("storyTomes")} value={tomes.length} />
            <Stat label={t("storyChapters")} value={chapters.length} />
            <Stat label={t("storyScenes")} value={scenes.length} />
            <Stat label="Orphans" value={orphanRefs.length} />
          </div>
        </Card>

        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Workflow</p>
              <h4>Focused editing</h4>
            </div>
          </div>
          <div className="brand-badges">
            <Badge>One screen per layer</Badge>
            <Badge variant="secondary">Narrative hierarchy</Badge>
            <Badge variant="outline">Local-first</Badge>
          </div>
          <p className="muted max-width">
            Create tomes, chapters, and scenes on their own screens instead of stacking every form on the same view.
          </p>
          <Link to={`/projects/${projectId}/story/tomes`} className="button button-secondary">
            {t("storyTomes")}
          </Link>
        </Card>
      </div>
    </StoryWorkspaceFrame>
  );
}
