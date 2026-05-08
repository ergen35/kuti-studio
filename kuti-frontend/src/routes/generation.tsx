import type { FormEvent } from "react";

import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";

import {
  createGenerationJob,
  generationBoardDownloadUrl,
  generationPanelImageUrl,
  getGenerationJob,
  getStory,
  listModels,
  listGenerationBoards,
  listGenerationJobs,
  listVersions,
  updateGenerationPanel,
  validateGenerationBoard,
  type GenerationMode,
  type ModelProviderRead,
  type GenerationBoardPanelRead,
  type GenerationBoardRead,
  type GenerationJobRead,
  type GenerationSourceKind,
  type GenerationStrategy,
  type GenerationPanelStatus,
} from "@/api/client";
import { Card } from "@/components/ui/card";

type SourceOption = {
  id: string;
  label: string;
  subtitle: string;
  kind: GenerationSourceKind;
};

const strategyLabels: Record<GenerationStrategy, string> = {
  direct: "Direct board",
  intermediate: "Intermediate board",
};

const sourceKindLabels: Record<GenerationSourceKind, string> = {
  scene: "Scene",
  chapter: "Chapter",
  tome: "Tome",
  panel: "Panel",
};

const sourceKindModelKinds: Record<GenerationSourceKind, string[]> = {
  scene: ["image"],
  chapter: ["image"],
  tome: ["image"],
  panel: ["video", "image"],
};

const panelStatusLabels: Record<GenerationPanelStatus, string> = {
  draft: "Draft",
  selected: "Selected",
  rejected: "Rejected",
  replaced: "Replaced",
};

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function replaceSearchParams(
  params: URLSearchParams,
  mutator: (next: URLSearchParams) => void,
  setSearchParams: (nextInit: URLSearchParams, options?: { replace?: boolean }) => void,
) {
  const next = new URLSearchParams(params);
  mutator(next);
  setSearchParams(next, { replace: true });
}

function SourceCard({ option, selected, onSelect }: { option: SourceOption; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button type="button" className={`generation-source-item ${selected ? "is-selected" : ""}`} onClick={() => onSelect(option.id)}>
      <div>
        <p className="eyebrow">{sourceKindLabels[option.kind]}</p>
        <h4>{option.label}</h4>
        <p className="muted">{option.subtitle}</p>
      </div>
      <span className="muted monospace-block">{option.id.slice(0, 10)}</span>
    </button>
  );
}

function JobCard({ job, selected, onSelect }: { job: GenerationJobRead; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button type="button" className={`generation-job-item ${selected ? "is-selected" : ""}`} onClick={() => onSelect(job.id)}>
      <div>
        <p className="eyebrow">{strategyLabels[job.strategy]}</p>
        <h4>{job.title}</h4>
        <p className="muted">{job.summary || "No summary yet."}</p>
      </div>
      <div className="generation-meta">
        <span>{sourceKindLabels[job.source_kind]}</span>
        <span>{job.progress}%</span>
        <span>{formatDate(job.created_at)}</span>
      </div>
    </button>
  );
}

function PanelCard({ board, panel, selected, onSelect }: { board: GenerationBoardRead; panel: GenerationBoardPanelRead; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button type="button" className={`generation-panel-item ${selected ? "is-selected" : ""}`} onClick={() => onSelect(panel.id)}>
      <div className="generation-panel-preview">
        <img src={generationPanelImageUrl(board.project_id, board.id, panel.id)} alt={panel.title} />
      </div>
      <div>
        <p className="eyebrow">{panelStatusLabels[panel.status]}</p>
        <h4>{panel.title}</h4>
        <p className="muted">{panel.caption}</p>
      </div>
    </button>
  );
}

export function GenerationRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedJobId = searchParams.get("jobId");
  const selectedBoardId = searchParams.get("boardId");
  const selectedPanelId = searchParams.get("panelId");
  const querySourceKind = searchParams.get("sourceKind") as GenerationSourceKind | null;
  const querySourceId = searchParams.get("sourceId") ?? "";
  const queryMode = searchParams.get("mode") as GenerationMode | null;
  const [sourceKind, setSourceKind] = useState<GenerationSourceKind>(querySourceKind ?? "scene");
  const [strategy, setStrategy] = useState<GenerationStrategy>("direct");
  const [selectedSourceId, setSelectedSourceId] = useState(querySourceId);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [selectedModelKey, setSelectedModelKey] = useState<string>("");

  const jobsQuery = useQuery({
    queryKey: ["generation-jobs", projectId],
    queryFn: () => listGenerationJobs(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const boardsQuery = useQuery({
    queryKey: ["generation-boards", projectId],
    queryFn: () => listGenerationBoards(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const storyQuery = useQuery({
    queryKey: ["generation-story", projectId],
    queryFn: () => getStory(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const versionsQuery = useQuery({
    queryKey: ["generation-versions", projectId],
    queryFn: () => listVersions(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const modelsQuery = useQuery({
    queryKey: ["generation-models"],
    queryFn: listModels,
  });

  const sourceOptions = useMemo(() => {
    const story = storyQuery.data;
    const panelOptions = (boardsQuery.data ?? []).flatMap((board) =>
      board.panels.map((panel) => ({
        id: panel.id,
        label: `${board.title} · ${panel.title}`,
        subtitle: panel.caption || panel.prompt || panel.image_name,
        kind: "panel" as const,
      })),
    );
    if (!story) return { scene: [] as SourceOption[], chapter: [] as SourceOption[], tome: [] as SourceOption[], panel: panelOptions };
    return {
      scene: story.scenes.map((scene) => ({ id: scene.id, label: scene.title, subtitle: scene.summary || scene.slug, kind: "scene" as const })),
      chapter: story.chapters.map((chapter) => ({ id: chapter.id, label: chapter.title, subtitle: chapter.synopsis || chapter.slug, kind: "chapter" as const })),
      tome: story.tomes.map((tome) => ({ id: tome.id, label: tome.title, subtitle: tome.synopsis || tome.slug, kind: "tome" as const })),
      panel: panelOptions,
    };
  }, [boardsQuery.data, storyQuery.data]);

  const allSources = sourceOptions[sourceKind];
  const jobs = jobsQuery.data ?? [];
  const boards = boardsQuery.data ?? [];
  const availableModels = useMemo(
    () => (modelsQuery.data ?? []).filter((model) => sourceKindModelKinds[sourceKind].includes(model.kind)),
    [modelsQuery.data, sourceKind],
  );
  const configuredModels = useMemo(
    () => availableModels.filter((model) => model.enabled && model.configured),
    [availableModels],
  );

  const selectedJob = useMemo(() => {
    if (!jobs.length) return null;
    return jobs.find((job) => job.id === selectedJobId) ?? jobs[0];
  }, [jobs, selectedJobId]);

  const selectedJobQuery = useQuery({
    queryKey: ["generation-job", projectId, selectedJob?.id],
    queryFn: () => getGenerationJob(projectId ?? "", selectedJob?.id ?? ""),
    enabled: Boolean(projectId && selectedJob?.id),
  });

  const selectedBoard = useMemo(() => {
    if (boards.length && selectedBoardId) {
      return boards.find((board) => board.id === selectedBoardId) ?? boards[0];
    }
    return selectedJobQuery.data?.board ?? boards[0] ?? null;
  }, [boards, selectedBoardId, selectedJobQuery.data?.board]);

  const selectedPanel = useMemo(() => {
    if (!selectedBoard?.panels.length) return null;
    return selectedBoard.panels.find((panel) => panel.id === selectedPanelId) ?? selectedBoard.panels[0];
  }, [selectedBoard, selectedPanelId]);

  useEffect(() => {
    if (!jobs.length) return;
    if (!selectedJobId || !jobs.some((job) => job.id === selectedJobId)) {
      replaceSearchParams(searchParams, (params) => {
        params.set("jobId", jobs[0].id);
      }, setSearchParams);
    }
  }, [jobs, searchParams, selectedJobId, setSearchParams]);

  useEffect(() => {
    if (!boards.length) return;
    if (!selectedBoardId || !boards.some((board) => board.id === selectedBoardId)) {
      replaceSearchParams(searchParams, (params) => {
        params.set("boardId", boards[0].id);
      }, setSearchParams);
    }
  }, [boards, searchParams, selectedBoardId, setSearchParams]);

  useEffect(() => {
    if (allSources.length && !allSources.some((option) => option.id === selectedSourceId)) {
      setSelectedSourceId(allSources[0].id);
    }
  }, [allSources, selectedSourceId]);

  useEffect(() => {
    if (versionsQuery.data?.length && !selectedVersionId) {
      setSelectedVersionId(versionsQuery.data[0].id);
    }
  }, [selectedVersionId, versionsQuery.data]);

  useEffect(() => {
    const preferred = configuredModels[0] ?? availableModels[0];
    if (preferred && preferred.key !== selectedModelKey) {
      setSelectedModelKey(preferred.key);
    }
  }, [availableModels, configuredModels, selectedModelKey]);

  useEffect(() => {
    if (querySourceKind && querySourceKind !== sourceKind) {
      setSourceKind(querySourceKind);
    }
  }, [querySourceKind, sourceKind]);

  useEffect(() => {
    if (querySourceId && querySourceId !== selectedSourceId) {
      setSelectedSourceId(querySourceId);
    }
  }, [querySourceId, selectedSourceId]);

  const selectedMode: GenerationMode = sourceKind === "scene" ? (queryMode ?? "separate") : "grid";

  const selectedSelectionIds = useMemo(() => {
    if (!storyQuery.data || !selectedSourceId) return [];
    if (sourceKind === "chapter") {
      return storyQuery.data.scenes.filter((scene) => scene.chapter_id === selectedSourceId).map((scene) => scene.id);
    }
    if (sourceKind === "tome") {
      return storyQuery.data.chapters.filter((chapter) => chapter.tome_id === selectedSourceId).map((chapter) => chapter.id);
    }
    return [];
  }, [selectedSourceId, sourceKind, storyQuery.data]);

  const selectedGridShape = useMemo(() => {
    const count = sourceKind === "scene" ? 1 : Math.max(1, selectedSelectionIds.length);
    const rows = Math.max(1, Math.round(Math.sqrt(count)));
    const cols = Math.max(1, Math.ceil(count / rows));
    return { rows, cols };
  }, [selectedSelectionIds.length, sourceKind]);

  const refreshGeneration = async () => {
    await queryClient.invalidateQueries({ queryKey: ["generation-jobs", projectId] });
    await queryClient.invalidateQueries({ queryKey: ["generation-boards", projectId] });
    await queryClient.invalidateQueries({ queryKey: ["generation-job", projectId, selectedJob?.id] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createGenerationJob>[1]) => createGenerationJob(projectId ?? "", payload),
    onSuccess: async (created) => {
      await refreshGeneration();
      replaceSearchParams(searchParams, (params) => {
        params.set("jobId", created.id);
        if (created.board?.id) params.set("boardId", created.board.id);
        if (created.board?.panels[0]?.id) params.set("panelId", created.board.panels[0].id);
      }, setSearchParams);
    },
  });

  const validateMutation = useMutation({
    mutationFn: (boardId: string) => validateGenerationBoard(projectId ?? "", boardId, { note: "Validated from Generation Studio." }),
    onSuccess: async () => {
      await refreshGeneration();
    },
  });

  const panelUpdateMutation = useMutation({
    mutationFn: ({ boardId, panelId, payload }: { boardId: string; panelId: string; payload: Parameters<typeof updateGenerationPanel>[3] }) =>
      updateGenerationPanel(projectId ?? "", boardId, panelId, payload),
    onSuccess: refreshGeneration,
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSourceId) return;
    const formData = new FormData(event.currentTarget);
    createMutation.mutate({
      source_kind: sourceKind,
      source_id: selectedSourceId,
      source_version_id: selectedVersionId || undefined,
      strategy,
      model_key: selectedModelKey || undefined,
      mode: selectedMode,
      selection_ids: selectedSelectionIds,
      grid_rows: selectedMode === "grid" ? selectedGridShape.rows : undefined,
      grid_cols: selectedMode === "grid" ? selectedGridShape.cols : undefined,
      image_count: selectedMode === "separate" ? (sourceKind === "scene" ? 3 : selectedSelectionIds.length || undefined) : undefined,
      title: normalizeText(formData.get("title")) || undefined,
      summary: normalizeText(formData.get("summary")),
    });
  };

  if (!projectId) {
    return <p className="muted">Missing project id.</p>;
  }

  return (
    <div className="page-stack generation-page">
      <div className="hero generation-hero">
        <div>
          <p className="eyebrow">Phase 8</p>
          <h3>Generation studio</h3>
          <p className="muted max-width">
            Launch scene, chapter, tome, or panel based generation jobs, inspect the intermediate steps, and validate the resulting board locally.
          </p>
        </div>
        <div className="hero-card generation-hero-card">
          <span className="status-dot" />
          <strong>{jobs.length} jobs / {boards.length} boards</strong>
          <p>Generation outputs stay inside `kuti-data/generation` and remain tied to the source version when available.</p>
        </div>
      </div>

      <div className="story-toolbar">
        <Link to={`/projects/${projectId}`} className="button button-secondary">
          Back to dashboard
        </Link>
        <div className="asset-toolbar-note muted">Use the form to create a local job, then validate the generated board or individual panels.</div>
      </div>

      <div className="generation-layout">
        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Source picker</p>
              <h4>Pick the narrative anchor</h4>
            </div>
          </div>

          <div className="project-actions generation-tabs">
            {(["scene", "chapter", "tome", "panel"] as GenerationSourceKind[]).map((kind) => (
              <button key={kind} type="button" className={`button ${sourceKind === kind ? "button-primary" : "button-secondary"}`} onClick={() => setSourceKind(kind)}>
                {sourceKindLabels[kind]}
              </button>
            ))}
          </div>

          <div className="stacked-card">
            <p className="eyebrow">Mode</p>
            <h4>{selectedMode === "grid" ? "Grid planche" : "Separate images"}</h4>
            <p className="muted">
              {sourceKind === "scene"
                ? "Scene sources can be rendered as separate candidates or as a compact grid planche."
                : "Chapter and tome sources generate a grid planche from the selected child items."}
            </p>
          </div>

          <div className="generation-source-list">
            {allSources.length ? (
              allSources.map((option) => <SourceCard key={option.id} option={option} selected={option.id === selectedSourceId} onSelect={setSelectedSourceId} />)
            ) : (
              <p className="muted">
                {sourceKind === "panel"
                  ? "No generated panels are available yet. Create a board first to reuse its panels as video or audio sources."
                  : `No ${sourceKindLabels[sourceKind].toLowerCase()}s are available yet.`}
              </p>
            )}
          </div>

          <div className="divider" />

          <form className="form-grid" onSubmit={handleCreate}>
            <div className="form-head">
              <div>
                <p className="eyebrow">Launch job</p>
                <h4>Create generation</h4>
              </div>
            </div>

            <div className="form-grid-two">
              <label>
                Strategy
                <select value={strategy} onChange={(event) => setStrategy(event.currentTarget.value as GenerationStrategy)}>
                  <option value="direct">Direct board</option>
                  <option value="intermediate">Intermediate board</option>
                </select>
              </label>
              <label>
                Source version
                <select value={selectedVersionId} onChange={(event) => setSelectedVersionId(event.currentTarget.value)}>
                  <option value="">Current project state</option>
                  {versionsQuery.data?.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.branch_name} #{version.version_index} · {version.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Model
              <select value={selectedModelKey} onChange={(event) => setSelectedModelKey(event.currentTarget.value)}>
                {availableModels.length ? (
                  availableModels.map((model: ModelProviderRead) => (
                    <option key={model.key} value={model.key} disabled={!model.enabled || !model.configured}>
                      {model.display_name} {model.enabled ? (model.configured ? "" : "(unconfigured)") : "(disabled)"}
                    </option>
                  ))
                ) : (
                  <option value="">No compatible models available</option>
                )}
              </select>
            </label>

            <div className="generation-model-grid">
              {availableModels.length ? (
                availableModels.map((model) => (
                  <div key={model.key} className={`stacked-card generation-model-card ${selectedModelKey === model.key ? "is-selected" : ""}`}>
                    <div className="section-head">
                      <div>
                        <p className="eyebrow">{model.kind}</p>
                        <h4>{model.display_name}</h4>
                      </div>
                      <span className="status-pill">{model.enabled ? (model.configured ? "Ready" : "Missing config") : "Disabled"}</span>
                    </div>
                    <p className="muted monospace-block">{model.base_url ?? "No base URL"}</p>
                    <p className="muted">API key {model.has_api_key ? "present" : "missing"}</p>
                    <button className="button button-ghost align-start" type="button" onClick={() => setSelectedModelKey(model.key)} disabled={!model.enabled || !model.configured}>
                      Use model
                    </button>
                  </div>
                ))
              ) : (
                <p className="muted">No compatible model providers are configured yet.</p>
              )}
            </div>

            <label>
              Title
              <input name="title" placeholder="Chapter 4 board" />
            </label>

            <label>
              Summary
              <textarea name="summary" rows={3} placeholder="Why this board is being generated" />
            </label>

            <button className="button button-primary" type="submit" disabled={createMutation.isPending || !selectedSourceId || !configuredModels.length}>
              {createMutation.isPending ? "Generating..." : "Generate board"}
            </button>
            {!configuredModels.length ? (
              <p className="muted">Configure at least one compatible model with a base URL and API key before creating a job.</p>
            ) : null}
          </form>
        </Card>

        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Jobs</p>
              <h4>Generation queue</h4>
            </div>
            {selectedJob ? <span className="status-pill">{selectedJob.status}</span> : null}
          </div>

          <div className="generation-job-list">
            {jobs.length ? (
              jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  selected={job.id === selectedJob?.id}
                  onSelect={(id) =>
                    replaceSearchParams(searchParams, (params) => {
                      params.set("jobId", id);
                      params.delete("boardId");
                      params.delete("panelId");
                    }, setSearchParams)
                  }
                />
              ))
            ) : (
              <p className="muted">No generation jobs yet.</p>
            )}
          </div>

          <div className="divider" />

          {selectedJobQuery.data ? (
            <div className="editor-stack generation-detail">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Selected job</p>
                  <h4>{selectedJobQuery.data.title}</h4>
                </div>
                <a className="button button-secondary" href={generationBoardDownloadUrl(projectId, selectedJobQuery.data.board?.id ?? selectedBoard?.id ?? "")}
                  aria-disabled={!selectedJobQuery.data.board && !selectedBoard}
                >
                  Download board
                </a>
              </div>

              <p className="muted">{selectedJobQuery.data.prompt}</p>

              <div className="generation-summary-grid">
                <div className="story-stat">
                  <strong>{selectedJobQuery.data.source_label}</strong>
                  <span>Source</span>
                </div>
                <div className="story-stat">
                  <strong>{strategyLabels[selectedJobQuery.data.strategy]}</strong>
                  <span>Strategy</span>
                </div>
                <div className="story-stat">
                  <strong>{selectedJobQuery.data.progress}%</strong>
                  <span>Progress</span>
                </div>
                <div className="story-stat">
                  <strong>{selectedJobQuery.data.source_version_id ?? "Current"}</strong>
                  <span>Version</span>
                </div>
              </div>

              <div className="generation-step-list">
                {selectedJobQuery.data.steps.length ? (
                  selectedJobQuery.data.steps.map((step) => (
                    <div key={step.id} className="stacked-card">
                      <div className="section-head">
                        <div>
                          <p className="eyebrow">Step {step.order_index}</p>
                          <h4>{step.title}</h4>
                        </div>
                        <span className="status-pill">{step.status}</span>
                      </div>
                      <p className="muted">{step.output_text}</p>
                      <p className="muted monospace-block">{step.artifact_path}</p>
                    </div>
                  ))
                ) : (
                  <p className="muted">No steps recorded.</p>
                )}
              </div>

              <div className="divider" />

              <div className="section-head">
                <div>
                  <p className="eyebrow">Board</p>
                  <h4>{selectedBoard?.title ?? "No board selected"}</h4>
                </div>
                {selectedBoard ? (
                  <button className="button button-primary" type="button" onClick={() => validateMutation.mutate(selectedBoard.id)} disabled={validateMutation.isPending}>
                    {validateMutation.isPending ? "Validating..." : "Validate board"}
                  </button>
                ) : null}
              </div>

              <div className="generation-board-strip">
                {selectedBoard?.panels.length ? (
                  selectedBoard.panels.map((panel) => (
                    <PanelCard
                      key={panel.id}
                      board={selectedBoard}
                      panel={panel}
                      selected={panel.id === selectedPanel?.id}
                      onSelect={(id) => replaceSearchParams(searchParams, (params) => params.set("panelId", id), setSearchParams)}
                    />
                  ))
                ) : (
                  <p className="muted">No board panels available yet.</p>
                )}
              </div>

              {selectedPanel && selectedBoard ? (
                <div className="generation-preview-grid">
                  <div className="generation-preview-frame">
                    <img src={generationPanelImageUrl(projectId, selectedBoard.id, selectedPanel.id)} alt={selectedPanel.title} />
                  </div>

                  <div className="editor-stack">
                    <div className="stacked-card">
                      <p className="eyebrow">Panel detail</p>
                      <h4>{selectedPanel.title}</h4>
                      <p className="muted">{selectedPanel.caption}</p>
                    </div>

                    <form
                      className="form-grid"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        panelUpdateMutation.mutate({
                          boardId: selectedBoard.id,
                          panelId: selectedPanel.id,
                          payload: {
                            status: (normalizeText(formData.get("status")) as GenerationPanelStatus) || undefined,
                            title: normalizeText(formData.get("title")) || undefined,
                            caption: normalizeText(formData.get("caption")) || undefined,
                          },
                        });
                      }}
                    >
                      <div className="form-grid-two">
                        <label>
                          Title
                          <input name="title" defaultValue={selectedPanel.title} />
                        </label>
                        <label>
                          Status
                          <select name="status" defaultValue={selectedPanel.status}>
                            <option value="draft">Draft</option>
                            <option value="selected">Selected</option>
                            <option value="rejected">Rejected</option>
                            <option value="replaced">Replaced</option>
                          </select>
                        </label>
                      </div>
                      <label>
                        Caption
                        <textarea name="caption" rows={4} defaultValue={selectedPanel.caption} />
                      </label>
                      <button className="button button-primary" type="submit">
                        Save panel
                      </button>
                    </form>
                  </div>
                </div>
              ) : null}

              <div className="divider" />

              <div className="warning-metadata-grid">
                <div>
                  <p className="eyebrow">Generation facts</p>
                  <p className="muted">Entrypoint: {selectedJobQuery.data.entrypoint}</p>
                  <p className="muted">Created: {formatDate(selectedJobQuery.data.created_at)}</p>
                  <p className="muted">Updated: {formatDate(selectedJobQuery.data.updated_at)}</p>
                </div>
                <div>
                  <p className="eyebrow">Artifacts</p>
                  <p className="muted monospace-block">{(selectedJobQuery.data.metadata_json.artifact_root as string | undefined) ?? "No artifact root recorded."}</p>
                  <p className="muted monospace-block">{selectedBoard?.artifact_path ?? "No board artifact selected."}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="muted">Create a generation job or select an existing one to inspect its board and panels.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
