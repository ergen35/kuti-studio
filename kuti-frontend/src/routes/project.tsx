import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { archiveProject, getProject, openProject } from "@/api/client";
import { Card } from "@/components/ui/card";

export function ProjectRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
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
        <p className="eyebrow">Project Dashboard</p>
        <h3>{projectQuery.data?.name ?? "Loading project..."}</h3>
        <p className="muted">{projectQuery.data?.root_path ?? "Fetching project metadata from the local API."}</p>
        <div className="project-actions">
          <button className="button" type="button" onClick={() => openMutation.mutate()}>
            Mark open
          </button>
          <button className="button button-ghost" type="button" onClick={() => archiveMutation.mutate()}>
            Archive
          </button>
          <Link to={`/projects/${projectId}/story`} className="button button-secondary">
            Storyline
          </Link>
          <Link to={`/projects/${projectId}/assets`} className="button button-secondary">
            Assets
          </Link>
          <Link to={`/projects/${projectId}/versions`} className="button button-secondary">
            Versions
          </Link>
          <Link to={`/projects/${projectId}/characters`} className="button button-secondary">
            Characters
          </Link>
          <Link to={`/projects/${projectId}/settings`} className="button button-secondary">
            Settings
          </Link>
        </div>
      </Card>

      <div className="grid-2">
        <Card>
          <p className="eyebrow">Status</p>
          <h4>{projectQuery.data?.status ?? "-"}</h4>
          <p className="muted">Open the project for editing and dashboard tracking.</p>
        </Card>
        <Card>
          <p className="eyebrow">Storage</p>
          <h4>{projectQuery.data?.slug ?? "-"}</h4>
          <p className="muted">Project data is stored locally and mirrored into `kuti-data`.</p>
        </Card>
      </div>
    </div>
  );
}
