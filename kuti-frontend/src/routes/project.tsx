import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { archiveProject, getProject, openProject } from "@/api/client";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n";

export function ProjectRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const t = useT();
  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const openMutation = useMutation({
    mutationFn: () => openProject(projectId ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveProject(projectId ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  if (!projectId) {
    return <p className="muted">Missing project id.</p>;
  }

  return (
    <div className="page-stack">
      <Card>
        <p className="eyebrow">{t("projectDashboard")}</p>
        <h3>{projectQuery.data?.name ?? "Loading project..."}</h3>
        <p className="muted">{projectQuery.data?.root_path ?? "Fetching project metadata from the local API."}</p>
        <div className="project-actions">
          <button className="button" type="button" onClick={() => openMutation.mutate()}>
            {t("markOpen")}
          </button>
          <button className="button button-ghost" type="button" onClick={() => archiveMutation.mutate()}>
            {t("archive")}
          </button>
          <Link to={`/projects/${projectId}/story`} className="button button-secondary">
            {t("storyline")}
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
          <Link to={`/projects/${projectId}/characters`} className="button button-secondary">
            Characters
          </Link>
          <Link to={`/projects/${projectId}/settings`} className="button button-secondary">
            {t("settings")}
          </Link>
        </div>
      </Card>

      <div className="grid-2">
        <Card>
          <p className="eyebrow">{t("projectDashboard")}</p>
          <h4>{projectQuery.data?.status ?? "-"}</h4>
          <p className="muted">{t("projectSummary")}</p>
        </Card>
        <Card>
          <p className="eyebrow">{t("storage")}</p>
          <h4>{projectQuery.data?.slug ?? "-"}</h4>
          <p className="muted">Project data is stored locally and mirrored into `kuti-data`.</p>
        </Card>
      </div>
    </div>
  );
}
