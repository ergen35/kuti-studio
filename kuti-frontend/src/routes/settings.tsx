import type { FormEvent } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { getProject, updateProject } from "@/api/client";
import { Card } from "@/components/ui/card";

export function SettingsRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const updateMutation = useMutation({
    mutationFn: updateProject.bind(null, projectId ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const rawSettings = String(formData.get("settings") ?? "{}");

    updateMutation.mutate({
      name: name || undefined,
      settings_json: JSON.parse(rawSettings),
    });
  };

  if (!projectId) {
    return <p className="muted">Missing project id.</p>;
  }

  return (
    <div className="page-stack">
      <Card>
        <p className="eyebrow">Project Settings</p>
        <h3>{projectQuery.data?.name ?? "Project preferences"}</h3>
        <form className="settings-form" onSubmit={handleSubmit}>
          <label>
            Project name
            <input name="name" defaultValue={projectQuery.data?.name ?? ""} />
          </label>
          <label>
            Settings JSON
            <textarea
              name="settings"
              rows={8}
              defaultValue={JSON.stringify(projectQuery.data?.settings_json ?? {}, null, 2)}
            />
          </label>
          <button className="button button-primary" type="submit">
            Save settings
          </button>
        </form>
      </Card>
    </div>
  );
}
