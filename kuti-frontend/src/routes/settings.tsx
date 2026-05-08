import type { FormEvent } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { getProject, updateProject } from "@/api/client";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n";

export function SettingsRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const t = useT();
  const [formError, setFormError] = useState<string | null>(null);
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
    let settings_json: Record<string, unknown>;

    try {
      const parsed = JSON.parse(rawSettings) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("invalid-settings-shape");
      }
      settings_json = parsed as Record<string, unknown>;
    } catch {
      setFormError(t("errorSettingsJsonInvalid"));
      return;
    }

    setFormError(null);

    updateMutation.mutate({
      name: name || undefined,
      settings_json,
    });
  };

  if (!projectId) {
    return <p className="muted">{t("missingProjectId")}</p>;
  }

  return (
    <div className="page-stack">
      <Card>
        <p className="eyebrow">{t("settings")}</p>
        <h3>{projectQuery.data?.name ?? t("projectSettingsIntro")}</h3>
        <form className="settings-form" onSubmit={handleSubmit}>
          <label>
            {t("projectDashboard")}
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
          {formError ? <p className="muted">{formError}</p> : null}
          <button className="button button-primary" type="submit">
            {t("saveSettings")}
          </button>
        </form>
      </Card>
    </div>
  );
}
