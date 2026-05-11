import type { FormEvent } from "react";

import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";

import {
  createExport,
  exportDownloadUrl,
  getExport,
  listExports,
  type ExportCreateInput,
  type ExportFormat,
  type ExportKind,
  type ExportRead,
  type ExportStatus,
} from "@/api/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";

const kindLabels: Record<ExportKind, string> = {
  work: "Work export",
  publication: "Publication export",
};

const formatLabels: Record<ExportFormat, string> = {
  json: "JSON",
  tree: "Tree archive",
  zip: "ZIP package",
};

const statusLabels: Record<ExportStatus, string> = {
  pending: "Pending",
  ready: "Ready",
  failed: "Failed",
};

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
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

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getCollectionCount(metadata: Record<string, unknown>, key: string) {
  const collections = metadata.collections as Record<string, unknown> | undefined;
  return toNumber(collections?.[key]) ?? 0;
}

function ExportListItem({ exportItem, selected, onSelect }: { exportItem: ExportRead; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button type="button" className={`export-item ${selected ? "is-selected" : ""}`} onClick={() => onSelect(exportItem.id)}>
      <div>
        <p className="eyebrow">{kindLabels[exportItem.kind]}</p>
        <h4>{exportItem.label}</h4>
        <p className="muted">{exportItem.summary || "No summary yet."}</p>
      </div>
      <div className="export-meta">
        <span>{formatLabels[exportItem.format]}</span>
        <span>{statusLabels[exportItem.status]}</span>
        <span>{formatDate(exportItem.created_at)}</span>
      </div>
    </button>
  );
}

export function ExportsRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedExportId = searchParams.get("exportId");
  const kindFilter = (searchParams.get("kind") as ExportKind | "all" | null) ?? "all";
  const formatFilter = (searchParams.get("format") as ExportFormat | "all" | null) ?? "all";
  const statusFilter = (searchParams.get("status") as ExportStatus | "all" | null) ?? "all";
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("json");

  const exportsQuery = useQuery({
    queryKey: queryKeys.exports(projectId ?? ""),
    queryFn: () => listExports(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const allExports = exportsQuery.data ?? [];

  const filteredExports = useMemo(() => {
    return allExports.filter((item) => {
      const matchesKind = kindFilter === "all" || item.kind === kindFilter;
      const matchesFormat = formatFilter === "all" || item.format === formatFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesKind && matchesFormat && matchesStatus;
    });
  }, [allExports, kindFilter, formatFilter, statusFilter]);

  const selectedExport = useMemo(() => {
    if (!filteredExports.length) return null;
    return filteredExports.find((item) => item.id === selectedExportId) ?? filteredExports[0];
  }, [filteredExports, selectedExportId]);

  useEffect(() => {
    if (selectedExport?.id && selectedExport.id !== selectedExportId) {
      replaceSearchParams(searchParams, (params) => {
        params.set("exportId", selectedExport.id);
      }, setSearchParams);
    }
  }, [searchParams, selectedExport?.id, selectedExportId, setSearchParams]);

  useEffect(() => {
    if (selectedExport?.format) {
      setSelectedFormat(selectedExport.format);
    }
  }, [selectedExport?.id]);

  const refreshExports = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.exports(projectId ?? "") });
    await queryClient.invalidateQueries({ queryKey: queryKeys.export(projectId ?? "", selectedExport?.id) });
  };

  const selectedExportQuery = useQuery({
    queryKey: queryKeys.export(projectId ?? "", selectedExport?.id),
    queryFn: () => getExport(projectId ?? "", selectedExport?.id ?? ""),
    enabled: Boolean(projectId && selectedExport?.id),
  });

  const createMutation = useMutation({
    mutationFn: (payload: ExportCreateInput) => createExport(projectId ?? "", payload),
    onSuccess: async (created) => {
      await refreshExports();
      replaceSearchParams(searchParams, (params) => {
        params.set("exportId", created.id);
      }, setSearchParams);
    },
  });

  const selectedExportData = selectedExportQuery.data ?? selectedExport;

  const stats = useMemo(
    () => ({
      total: allExports.length,
      ready: allExports.filter((item) => item.status === "ready").length,
      pending: allExports.filter((item) => item.status === "pending").length,
      failed: allExports.filter((item) => item.status === "failed").length,
    }),
    [allExports],
  );

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    createMutation.mutate({
      kind: (normalizeText(formData.get("kind")) as ExportKind) || "work",
      format: selectedFormat,
      label: normalizeText(formData.get("label")) || undefined,
      summary: normalizeText(formData.get("summary")),
    });
    event.currentTarget.reset();
    setSelectedFormat("json");
  };

  if (!projectId) {
    return <p className="muted">Missing project id.</p>;
  }

  return (
    <div className="page-stack export-page">
      <div className="hero export-hero">
        <div>
          <p className="eyebrow">Phase 7</p>
          <h3>Export workshop</h3>
          <p className="muted max-width">
            Package the local project into portable exports, inspect the generated manifest, and pull downloads directly from the workspace.
          </p>
        </div>
        <div className="hero-card export-hero-card">
          <div className="export-summary-grid">
            <div className="story-stat">
              <strong>{stats.total}</strong>
              <span>Total exports</span>
            </div>
            <div className="story-stat">
              <strong>{stats.ready}</strong>
              <span>Ready</span>
            </div>
            <div className="story-stat">
              <strong>{stats.failed}</strong>
              <span>Failed</span>
            </div>
          </div>
          <p>Exports materialize inside `kuti-data/exports` and remain tied to the current project state.</p>
        </div>
      </div>

      <div className="story-toolbar">
        <Link to={`/projects/${projectId}`} className="button button-secondary">
          Back to dashboard
        </Link>
        <div className="asset-toolbar-note muted">Choose a format, generate an export, and download the resulting artifact when it is ready.</div>
      </div>

      <div className="story-toolbar">
        <div className="project-actions export-filters">
          <Select
            value={kindFilter}
            onChange={(event) =>
              replaceSearchParams(searchParams, (params) => {
                const value = event.currentTarget.value as ExportKind | "all";
                if (value === "all") params.delete("kind");
                else params.set("kind", value);
              }, setSearchParams)
            }
          >
            <option value="all">All kinds</option>
            <option value="work">Work</option>
            <option value="publication">Publication</option>
          </Select>
          <Select
            value={formatFilter}
            onChange={(event) =>
              replaceSearchParams(searchParams, (params) => {
                const value = event.currentTarget.value as ExportFormat | "all";
                if (value === "all") params.delete("format");
                else params.set("format", value);
              }, setSearchParams)
            }
          >
            <option value="all">All formats</option>
            <option value="json">JSON</option>
            <option value="tree">Tree</option>
            <option value="zip">ZIP</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(event) =>
              replaceSearchParams(searchParams, (params) => {
                const value = event.currentTarget.value as ExportStatus | "all";
                if (value === "all") params.delete("status");
                else params.set("status", value);
              }, setSearchParams)
            }
          >
            <option value="all">All statuses</option>
            <option value="ready">Ready</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
        <button
          className="button button-ghost"
          type="button"
          onClick={() =>
            replaceSearchParams(searchParams, (params) => {
              params.delete("kind");
              params.delete("format");
              params.delete("status");
            }, setSearchParams)
          }
        >
          Clear filters
        </button>
      </div>

      <div className="export-layout">
        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Exports</p>
              <h4>Archive index</h4>
            </div>
          </div>

          <div className="export-list">
            {filteredExports.length ? (
              filteredExports.map((item) => (
                <ExportListItem
                  key={item.id}
                  exportItem={item}
                  selected={item.id === selectedExportData?.id}
                  onSelect={(id) =>
                    replaceSearchParams(searchParams, (params) => {
                      params.set("exportId", id);
                    }, setSearchParams)
                  }
                />
              ))
            ) : (
              <p className="muted">{allExports.length ? "No exports match the current filters." : "No exports generated yet."}</p>
            )}
          </div>

          <div className="divider" />

          <form className="form-grid export-form" onSubmit={handleCreate}>
            <div className="form-head">
              <div>
                <p className="eyebrow">Create export</p>
                <h4>Capture the workspace</h4>
              </div>
            </div>

            <div className="form-grid-two">
              <label>
                Kind
                <Select name="kind" defaultValue="work">
                  <option value="work">Work export</option>
                  <option value="publication">Publication export</option>
                </Select>
              </label>
              <label>
                Format
                <Select value={selectedFormat} onChange={(event) => setSelectedFormat(event.currentTarget.value as ExportFormat)}>
                  <option value="json">JSON</option>
                  <option value="tree">Tree</option>
                  <option value="zip">ZIP</option>
                </Select>
              </label>
            </div>

            <label>
              Label
              <Input name="label" placeholder="Publication bundle" />
            </label>

            <label>
              Summary
              <Textarea name="summary" rows={3} placeholder="What this export is for" />
            </label>

            <button className="button button-primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Generating..." : "Generate export"}
            </button>
          </form>
        </Card>

        <Card>
          {selectedExportData ? (
            <div className="editor-stack export-detail">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Selected export</p>
                  <h4>{selectedExportData.label}</h4>
                </div>
                <div className={`export-status-pill status-${selectedExportData.status}`}>{statusLabels[selectedExportData.status]}</div>
              </div>

              <p className="muted">{selectedExportData.summary || "No summary provided."}</p>

              <div className="export-summary-grid export-summary-grid-detail">
                <div className="export-chip">
                  <strong>{kindLabels[selectedExportData.kind]}</strong>
                  <span>Kind</span>
                </div>
                <div className="export-chip">
                  <strong>{formatLabels[selectedExportData.format]}</strong>
                  <span>Format</span>
                </div>
                <div className="export-chip">
                  <strong>{selectedExportData.size_bytes ? `${Math.max(1, Math.round(selectedExportData.size_bytes / 1024))} KB` : "Pending"}</strong>
                  <span>Artifact size</span>
                </div>
                <div className="export-chip">
                  <strong>{selectedExportData.artifact_name ?? "—"}</strong>
                  <span>Artifact</span>
                </div>
              </div>

              <div className="project-actions">
                <a className={`button ${selectedExportData.status === "ready" ? "button-primary" : "button-secondary"}`} href={exportDownloadUrl(projectId, selectedExportData.id)}>
                  Download artifact
                </a>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() =>
                    replaceSearchParams(searchParams, (params) => {
                      params.set("exportId", selectedExportData.id);
                    }, setSearchParams)
                  }
                >
                  Focus details
                </button>
              </div>

              <div className="warning-metadata-grid">
                <div>
                  <p className="eyebrow">Timing</p>
                  <div className="mini-list">
                    <div className="stacked-card">
                      <strong>Created</strong>
                      <p className="muted monospace-block">{formatDate(selectedExportData.created_at)}</p>
                    </div>
                    <div className="stacked-card">
                      <strong>Updated</strong>
                      <p className="muted monospace-block">{formatDate(selectedExportData.updated_at)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="eyebrow">Manifest</p>
                  <div className="mini-list">
                    <div className="stacked-card">
                      <strong>Characters</strong>
                      <p className="muted">{getCollectionCount(selectedExportData.metadata_json, "characters")}</p>
                    </div>
                    <div className="stacked-card">
                      <strong>Scenes</strong>
                      <p className="muted">{getCollectionCount(selectedExportData.metadata_json, "scenes")}</p>
                    </div>
                    <div className="stacked-card">
                      <strong>Warnings</strong>
                      <p className="muted">{getCollectionCount(selectedExportData.metadata_json, "warnings")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div className="warning-metadata-grid">
                <div>
                  <p className="eyebrow">Artifact path</p>
                  <p className="muted monospace-block">{selectedExportData.artifact_path ?? "Unavailable"}</p>
                </div>
                <div>
                  <p className="eyebrow">Error</p>
                  <p className="muted">{selectedExportData.error_message ?? "No export errors recorded."}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="muted">Generate an export or select one to inspect its manifest and download link.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
