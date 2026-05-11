import type { FormEvent } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { getProject, updateProject } from "@/api/client";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";

export function SettingsRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const t = useT();
  const [formError, setFormError] = useState<string | null>(null);
  const projectQuery = useQuery({
    queryKey: queryKeys.project(projectId ?? ""),
    queryFn: () => getProject(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const updateMutation = useMutation({
    mutationFn: updateProject.bind(null, projectId ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId ?? "") });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
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
    <div className="page-stack settings-screen">
      <Card className="settings-card">
        <p className="eyebrow">{t("settings")}</p>
        <h3>{projectQuery.data?.name ?? t("projectSettingsIntro")}</h3>
        <p className="muted max-width">Project-level configuration stays local and is edited without leaving the workspace.</p>
        <form className="settings-form" onSubmit={handleSubmit}>
          <label>
            {t("projectDashboard")}
            <Input name="name" defaultValue={projectQuery.data?.name ?? ""} />
          </label>
          <label>
            Settings JSON
            <Textarea
              name="settings"
              rows={8}
              defaultValue={JSON.stringify(projectQuery.data?.settings_json ?? {}, null, 2)}
            />
          </label>
          {formError ? <p className="muted">{formError}</p> : null}
          <Button variant="primary" type="submit">
            {t("saveSettings")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
