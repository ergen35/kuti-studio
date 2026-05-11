import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import {
  archiveProject,
  getProject,
  getStory,
  listAssets,
  listCharacters,
  listExports,
  listGenerationJobs,
  listVersions,
  listWarnings,
  openProject,
} from "@/api/client";
import { queryKeys } from "@/lib/query-keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n";

export function ProjectRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const t = useT();
  const projectQuery = useQuery({
    queryKey: queryKeys.project(projectId ?? ""),
    queryFn: () => getProject(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const charactersQuery = useQuery({
    queryKey: queryKeys.characters(projectId ?? ""),
    queryFn: () => listCharacters(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const storyQuery = useQuery({
    queryKey: queryKeys.story(projectId ?? ""),
    queryFn: () => getStory(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const assetsQuery = useQuery({
    queryKey: queryKeys.assets(projectId ?? ""),
    queryFn: () => listAssets(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const versionsQuery = useQuery({
    queryKey: queryKeys.versions(projectId ?? ""),
    queryFn: () => listVersions(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const warningsQuery = useQuery({
    queryKey: queryKeys.warnings(projectId ?? ""),
    queryFn: () => listWarnings(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const generationJobsQuery = useQuery({
    queryKey: queryKeys.generationJobs(projectId ?? ""),
    queryFn: () => listGenerationJobs(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const exportsQuery = useQuery({
    queryKey: queryKeys.exports(projectId ?? ""),
    queryFn: () => listExports(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const openMutation = useMutation({
    mutationFn: () => openProject(projectId ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId ?? "") });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveProject(projectId ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId ?? "") });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });

  const storyStats = {
    tomes: storyQuery.data?.tomes.length ?? 0,
    chapters: storyQuery.data?.chapters.length ?? 0,
    scenes: storyQuery.data?.scenes.length ?? 0,
  };

  const workspaceStats = [
    { label: "Characters", value: charactersQuery.data?.items.length ?? 0, href: `/projects/${projectId}/characters` },
    { label: "Tomes", value: storyStats.tomes, href: `/projects/${projectId}/story/tomes` },
    { label: "Chapters", value: storyStats.chapters, href: `/projects/${projectId}/story/chapters` },
    { label: "Scenes", value: storyStats.scenes, href: `/projects/${projectId}/story/scenes` },
    { label: "Assets", value: assetsQuery.data?.items.length ?? 0, href: `/projects/${projectId}/assets` },
    { label: "Warnings", value: warningsQuery.data?.length ?? 0, href: `/projects/${projectId}/warnings` },
    { label: "Versions", value: versionsQuery.data?.length ?? 0, href: `/projects/${projectId}/versions` },
    { label: "Jobs", value: generationJobsQuery.data?.length ?? 0, href: `/projects/${projectId}/generation` },
    { label: "Exports", value: exportsQuery.data?.length ?? 0, href: `/projects/${projectId}/exports` },
  ];

  const recentWarning = warningsQuery.data?.[0];
  const recentJob = generationJobsQuery.data?.[0];
  const latestVersion = versionsQuery.data?.[0];

  if (!projectId) {
    return <p className="muted">{t("missingProjectId")}</p>;
  }

  return (
    <div className="page-stack project-screen">
      <div className="hero project-hero">
        <div>
          <p className="eyebrow">{t("projectDashboard")}</p>
          <h3>{projectQuery.data?.name ?? t("loadingProject")}</h3>
          <p className="muted max-width">{projectQuery.data?.root_path ?? t("fetchingProjectMetadata")}</p>
          <div className="brand-badges">
            <Badge>{projectQuery.data?.status ?? t("loading")}</Badge>
            <Badge variant="outline">{projectQuery.data?.slug ?? "project"}</Badge>
            <Badge variant="secondary">{projectQuery.data ? `Updated ${new Date(projectQuery.data.updated_at).toLocaleDateString()}` : t("loading")}</Badge>
          </div>
        </div>
        <div className="hero-card">
          <span className="status-dot" />
          <strong>Workspace cockpit</strong>
          <p>Track narrative structure, media, versioning, warnings, and generation from a single project home.</p>
        </div>
      </div>

      <div className="project-actions">
        <Button variant="primary" type="button" onClick={() => openMutation.mutate()}>
          {t("markOpen")}
        </Button>
        <Button variant="ghost" type="button" onClick={() => archiveMutation.mutate()}>
          {t("archive")}
        </Button>
        <Link to={`/projects/${projectId}/story`} className="button button-secondary">
          {t("storyline")}
        </Link>
        <Link to={`/projects/${projectId}/characters`} className="button button-secondary">
          Characters
        </Link>
        <Link to={`/projects/${projectId}/assets`} className="button button-secondary">
          {t("assetsLibrary")}
        </Link>
        <Link to={`/projects/${projectId}/generation`} className="button button-secondary">
          {t("generationStudio")}
        </Link>
        <Link to={`/projects/${projectId}/exports`} className="button button-secondary">
          {t("exports")}
        </Link>
        <Link to={`/projects/${projectId}/versions`} className="button button-secondary">
          {t("versioning")}
        </Link>
        <Link to={`/projects/${projectId}/warnings`} className="button button-secondary">
          {t("warnings")}
        </Link>
        <Link to={`/projects/${projectId}/settings`} className="button button-secondary">
          {t("settings")}
        </Link>
      </div>

      <div className="grid-2">
        {workspaceStats.map((stat) => (
          <Card key={stat.label}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{stat.label}</p>
                <h4>{stat.value}</h4>
              </div>
              <Link to={stat.href} className="button button-ghost align-start">
                Open
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <div className="detail-grid">
        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Activity</p>
              <h4>Latest signals</h4>
            </div>
          </div>
          <div className="mini-list">
            <div className="stacked-card">
              <strong>Recent version</strong>
              <p className="muted">{latestVersion ? `${latestVersion.branch_name} · #${latestVersion.version_index}` : "No version yet"}</p>
            </div>
            <div className="stacked-card">
              <strong>Recent job</strong>
              <p className="muted">{recentJob ? `${recentJob.title} · ${recentJob.status}` : "No generation job yet"}</p>
            </div>
            <div className="stacked-card">
              <strong>Recent warning</strong>
              <p className="muted">{recentWarning ? `${recentWarning.title} · ${recentWarning.severity}` : "No warnings yet"}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Project state</p>
              <h4>Storage and health</h4>
            </div>
          </div>
          <div className="mini-list">
            <div className="stacked-card">
              <strong>{projectQuery.data?.slug ?? "-"}</strong>
              <p className="muted">Project data is stored locally and mirrored into `kuti-data`.</p>
            </div>
            <div className="stacked-card">
              <strong>{projectQuery.data?.root_path ?? "-"}</strong>
              <p className="muted">Current project root.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
