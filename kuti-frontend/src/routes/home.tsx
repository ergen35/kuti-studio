import type { FormEvent } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  archiveProject,
  cloneProject,
  createProject,
  listProjects,
  openProject,
  type ProjectRead,
} from "@/api/client";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { getConfig, getHealth } from "@/api/client";
import { Link } from "react-router-dom";

function ProjectRow({ project }: { project: ProjectRead }) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const openMutation = useMutation({
    mutationFn: () => openProject(project.id),
    onSuccess: invalidate,
  });
  const archiveMutation = useMutation({
    mutationFn: () => archiveProject(project.id),
    onSuccess: invalidate,
  });
  const cloneMutation = useMutation({
    mutationFn: () => cloneProject(project.id, { name: `${project.name} Copy` }),
    onSuccess: invalidate,
  });

  return (
    <article className="project-row">
      <div>
        <p className="eyebrow">{project.status}</p>
        <h4>{project.name}</h4>
        <p className="muted">Slug: {project.slug}</p>
        <p className="muted">Root: {project.root_path}</p>
      </div>
      <div className="project-actions">
        <Link to={`/projects/${project.id}`} className="button button-secondary">
          Open
        </Link>
        <button className="button" type="button" onClick={() => cloneMutation.mutate()}>
          Clone
        </button>
        <button className="button button-ghost" type="button" onClick={() => archiveMutation.mutate()}>
          Archive
        </button>
        <button className="button button-ghost" type="button" onClick={() => openMutation.mutate()}>
          Mark open
        </button>
      </div>
    </article>
  );
}

export function HomeRoute() {
  const queryClient = useQueryClient();
  const t = useT();
  const configQuery = useQuery({ queryKey: ["config"], queryFn: getConfig });
  const healthQuery = useQuery({ queryKey: ["health"], queryFn: getHealth });
  const projectsQuery = useQuery({ queryKey: ["projects"], queryFn: listProjects });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    if (!name) {
      return;
    }
    createMutation.mutate({ name, settings_json: { strategy: "scene-by-scene" } });
    event.currentTarget.reset();
  };

  return (
    <div className="page-stack">
      <div className="hero">
        <div>
          <p className="eyebrow">{t("projectHub")}</p>
          <h3>{t("homeHero")}</h3>
            <p className="muted max-width">
            {t("homeIntro")}
            </p>
        </div>
        <div className="hero-card">
          <span className="status-dot" />
          <strong>Local-first workflow</strong>
          <p>FastAPI backend, React Router shell, and portable data storage.</p>
        </div>
      </div>

      <div className="grid-2">
        <Card>
          <p className="eyebrow">{t("backendStatus")}</p>
          <h4>{healthQuery.data?.status ?? "checking..."}</h4>
          <p className="muted">
            {healthQuery.isError
              ? "Backend not reachable yet. Start kuti-backend on port 8000."
              : healthQuery.data
                ? `${healthQuery.data.service} v${healthQuery.data.version}`
                : "Querying the local API..."}
          </p>
        </Card>
        <Card>
          <p className="eyebrow">{t("runtimeConfig")}</p>
          <h4>{configQuery.data?.environment ?? "loading..."}</h4>
          <p className="muted">
            {configQuery.data
              ? `Data root: ${configQuery.data.dataDir}`
              : "The frontend will consume the exported backend contract."}
          </p>
        </Card>
      </div>

      <Card>
        <div className="section-head">
          <div>
            <p className="eyebrow">{t("projectHub")}</p>
            <h4>{t("availableProjects")}</h4>
          </div>
          <form className="inline-form" onSubmit={handleCreate}>
            <input name="name" placeholder="New project name" aria-label="Project name" />
            <button className="button button-primary" type="submit">
              {t("createProject")}
            </button>
          </form>
        </div>

        {projectsQuery.data?.items.length ? (
          <div className="project-list">
            {projectsQuery.data.items.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="muted">
            {t("noProjects")}
          </p>
        )}
      </Card>
    </div>
  );
}
