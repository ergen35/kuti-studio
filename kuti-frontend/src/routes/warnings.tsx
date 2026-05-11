import type { FormEvent } from "react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";

import {
  listWarnings,
  scanWarnings,
  updateWarning,
  type WarningKind,
  type WarningRead,
  type WarningSeverity,
  type WarningStatus,
} from "@/api/client";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";

const kindLabels: Record<WarningKind, string> = {
  missing_character_reference: "Missing character",
  invalid_location: "Invalid location",
  timeline_incoherence: "Timeline conflict",
  orphan_reference: "Orphan reference",
};

const severityLabels: Record<WarningSeverity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

const statusLabels: Record<WarningStatus, string> = {
  open: "Open",
  ignored: "Ignored",
  resolved: "Resolved",
};

function replaceQueryParams(
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

function getNote(metadata: Record<string, unknown>) {
  return typeof metadata.note === "string" ? metadata.note : "";
}

function getMetadataEntries(metadata: Record<string, unknown>) {
  return Object.entries(metadata).filter(([key]) => key !== "note");
}

function WarningListItem({ warning, selected, onSelect }: { warning: WarningRead; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button type="button" className={`warning-item ${selected ? "is-selected" : ""}`} onClick={() => onSelect(warning.id)}>
      <div>
        <p className="eyebrow">{kindLabels[warning.kind]}</p>
        <h4>{warning.title}</h4>
        <p className="muted">{warning.message}</p>
      </div>
      <div className="warning-meta">
        <span>{severityLabels[warning.severity]}</span>
        <span>{statusLabels[warning.status]}</span>
        <span>{formatDate(warning.updated_at)}</span>
      </div>
    </button>
  );
}

export function WarningsRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedWarningId = searchParams.get("warningId");
  const statusFilter = (searchParams.get("status") as WarningStatus | "all" | null) ?? "open";
  const severityFilter = (searchParams.get("severity") as WarningSeverity | "all" | null) ?? "all";
  const kindFilter = (searchParams.get("kind") as WarningKind | "all" | null) ?? "all";
  const [noteDraft, setNoteDraft] = useState("");

  const warningsQuery = useQuery({
    queryKey: queryKeys.warnings(projectId ?? ""),
    queryFn: () => listWarnings(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const warnings = warningsQuery.data ?? [];

  const filteredWarnings = useMemo(() => {
    return warnings.filter((warning) => {
      const matchesStatus = statusFilter === "all" || warning.status === statusFilter;
      const matchesSeverity = severityFilter === "all" || warning.severity === severityFilter;
      const matchesKind = kindFilter === "all" || warning.kind === kindFilter;
      return matchesStatus && matchesSeverity && matchesKind;
    });
  }, [warnings, statusFilter, severityFilter, kindFilter]);

  const selectedWarning = useMemo(() => {
    if (!filteredWarnings.length) {
      return null;
    }
    return filteredWarnings.find((warning) => warning.id === selectedWarningId) ?? filteredWarnings[0];
  }, [filteredWarnings, selectedWarningId]);

  useEffect(() => {
    if (selectedWarning?.id && selectedWarning.id !== selectedWarningId) {
      replaceQueryParams(searchParams, (params) => {
        params.set("warningId", selectedWarning.id);
      }, setSearchParams);
    }
  }, [searchParams, selectedWarning?.id, selectedWarningId, setSearchParams]);

  useEffect(() => {
    setNoteDraft(getNote(selectedWarning?.metadata_json ?? {}));
  }, [selectedWarning?.id]);

  const refreshWarnings = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.warnings(projectId ?? "") });
  };

  const scanMutation = useMutation({
    mutationFn: () => scanWarnings(projectId ?? ""),
    onSuccess: refreshWarnings,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateWarning>[2] }) =>
      updateWarning(projectId ?? "", id, payload),
    onSuccess: refreshWarnings,
  });

  const applyFilter = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      replaceQueryParams(searchParams, mutator, setSearchParams);
    },
    [searchParams, setSearchParams],
  );

  const counts = useMemo(
    () => ({
      total: warnings.length,
      open: warnings.filter((warning) => warning.status === "open").length,
      ignored: warnings.filter((warning) => warning.status === "ignored").length,
      resolved: warnings.filter((warning) => warning.status === "resolved").length,
      critical: warnings.filter((warning) => warning.severity === "critical").length,
    }),
    [warnings],
  );

  const handleStatusChange = (status: WarningStatus) => {
    if (!selectedWarning?.id) {
      return;
    }
    updateMutation.mutate({
      id: selectedWarning.id,
      payload: {
        status,
        note: noteDraft.trim() || null,
      },
    });
  };

  if (!projectId) {
    return <p className="muted">Missing project id.</p>;
  }

  return (
    <div className="page-stack warning-page">
      <div className="hero warning-hero">
        <div>
          <p className="eyebrow">Phase 6</p>
          <h3>Coherence sentry</h3>
          <p className="muted max-width">
            Track structural issues, inspect their source, and clear narrative inconsistencies before they spread through the workspace.
          </p>
        </div>
        <div className="hero-card warning-hero-card">
          <div className="warning-summary-grid">
            <div className="story-stat">
              <strong>{counts.total}</strong>
              <span>Total warnings</span>
            </div>
            <div className="story-stat">
              <strong>{counts.open}</strong>
              <span>Open</span>
            </div>
            <div className="story-stat">
              <strong>{counts.critical}</strong>
              <span>Critical</span>
            </div>
          </div>
          <p>Scanning rebuilds the warnings ledger from the current project state.</p>
        </div>
      </div>

      <div className="story-toolbar">
        <Link to={`/projects/${projectId}`} className="button button-secondary">
          Back to dashboard
        </Link>
        <div className="project-actions">
          <button className="button button-primary" type="button" onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending}>
            {scanMutation.isPending ? "Scanning..." : "Scan project"}
          </button>
          <div className="asset-toolbar-note muted">Warnings persist in the ledger and can be resolved or ignored after review.</div>
        </div>
      </div>

      <div className="warning-filters card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Filters</p>
            <h4>Focus the ledger</h4>
          </div>
          <button
            className="button button-ghost"
            type="button"
            onClick={() =>
              applyFilter((params) => {
                params.delete("status");
                params.delete("severity");
                params.delete("kind");
              })
            }
          >
            Clear filters
          </button>
        </div>

        <form className="filters-row" onSubmit={(event) => event.preventDefault()}>
          <Select
            name="status"
            value={statusFilter}
            onChange={(event) =>
              applyFilter((params) => {
                const value = event.currentTarget.value as WarningStatus | "all";
                if (value === "all") params.delete("status");
                else params.set("status", value);
              })
            }
          >
            <option value="open">Open</option>
            <option value="all">All statuses</option>
            <option value="ignored">Ignored</option>
            <option value="resolved">Resolved</option>
          </Select>
          <Select
            name="severity"
            value={severityFilter}
            onChange={(event) =>
              applyFilter((params) => {
                const value = event.currentTarget.value as WarningSeverity | "all";
                if (value === "all") params.delete("severity");
                else params.set("severity", value);
              })
            }
          >
            <option value="all">All severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </Select>
          <Select
            name="kind"
            value={kindFilter}
            onChange={(event) =>
              applyFilter((params) => {
                const value = event.currentTarget.value as WarningKind | "all";
                if (value === "all") params.delete("kind");
                else params.set("kind", value);
              })
            }
          >
            <option value="all">All kinds</option>
            <option value="missing_character_reference">Missing character</option>
            <option value="invalid_location">Invalid location</option>
            <option value="timeline_incoherence">Timeline conflict</option>
            <option value="orphan_reference">Orphan reference</option>
          </Select>
        </form>
      </div>

      <div className="warning-layout">
        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Ledger</p>
              <h4>Warnings</h4>
            </div>
          </div>

          <div className="warning-list">
            {filteredWarnings.length ? (
              filteredWarnings.map((warning) => (
                <WarningListItem
                  key={warning.id}
                  warning={warning}
                  selected={warning.id === selectedWarning?.id}
                  onSelect={(id) =>
                    applyFilter((params) => {
                      params.set("warningId", id);
                    })
                  }
                />
              ))
            ) : (
              <p className="muted">{warnings.length ? "No warnings match the current filters." : "No warnings detected yet."}</p>
            )}
          </div>

          <div className="divider" />

          <div className="warning-summary-grid warning-summary-grid-foot">
            <div className="warning-chip">
              <strong>{counts.ignored}</strong>
              <span>Ignored</span>
            </div>
            <div className="warning-chip">
              <strong>{counts.resolved}</strong>
              <span>Resolved</span>
            </div>
            <div className="warning-chip">
              <strong>{counts.total - counts.open}</strong>
              <span>Closed</span>
            </div>
          </div>
        </Card>

        <Card>
          {selectedWarning ? (
            <div className="editor-stack warning-detail">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Selected warning</p>
                  <h4>{selectedWarning.title}</h4>
                </div>
                <div className={`warning-status-pill severity-${selectedWarning.severity}`}>
                  {severityLabels[selectedWarning.severity]}
                </div>
              </div>

              <p className="muted">{selectedWarning.message}</p>

              <div className="warning-badges">
                <span className="warning-chip"><strong>{kindLabels[selectedWarning.kind]}</strong><span>Kind</span></span>
                <span className="warning-chip"><strong>{statusLabels[selectedWarning.status]}</strong><span>Status</span></span>
                <span className="warning-chip"><strong>{selectedWarning.entity_kind}</strong><span>Entity</span></span>
                <span className="warning-chip"><strong>#{selectedWarning.entity_id.slice(0, 8)}</strong><span>Entity id</span></span>
              </div>

              <div className="warning-metadata">
                <div className="warning-chip">
                  <strong>{formatDate(selectedWarning.created_at)}</strong>
                  <span>Created</span>
                </div>
                <div className="warning-chip">
                  <strong>{formatDate(selectedWarning.updated_at)}</strong>
                  <span>Updated</span>
                </div>
                <div className="warning-chip">
                  <strong>{selectedWarning.resolved_at ? formatDate(selectedWarning.resolved_at) : "Not yet"}</strong>
                  <span>Resolved</span>
                </div>
              </div>

              <div className="divider" />

              <div className="warning-metadata-grid">
                <div>
                  <p className="eyebrow">Fingerprint</p>
                  <p className="muted monospace-block">{selectedWarning.fingerprint}</p>
                </div>
                <div>
                  <p className="eyebrow">Metadata</p>
                  {getMetadataEntries(selectedWarning.metadata_json).length ? (
                    <div className="mini-list">
                      {getMetadataEntries(selectedWarning.metadata_json).map(([key, value]) => (
                        <div className="stacked-card" key={key}>
                          <strong>{key}</strong>
                          <p className="muted monospace-block">{typeof value === "string" ? value : JSON.stringify(value)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">No additional metadata.</p>
                  )}
                </div>
              </div>

              <form
                className="form-grid warning-response-form"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  if (!selectedWarning?.id) {
                    return;
                  }
                  updateMutation.mutate({
                    id: selectedWarning.id,
                    payload: {
                      status: selectedWarning.status,
                      note: noteDraft.trim() || null,
                    },
                  });
                }}
              >
                <div className="form-head">
                  <div>
                    <p className="eyebrow">Resolution note</p>
                    <h4>Capture context</h4>
                  </div>
                </div>
                <label>
                  Note
                  <Textarea value={noteDraft} onChange={(event) => setNoteDraft(event.currentTarget.value)} rows={4} placeholder="Why this warning was resolved or ignored" />
                </label>
                <div className="project-actions warning-actions">
                  <button className="button button-primary" type="button" onClick={() => handleStatusChange("resolved")}>
                    Mark resolved
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => handleStatusChange("ignored")}>
                    Ignore
                  </button>
                  <button className="button button-ghost" type="button" onClick={() => handleStatusChange("open")}>
                    Reopen
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <p className="muted">Run a scan or select a warning to inspect its details.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
