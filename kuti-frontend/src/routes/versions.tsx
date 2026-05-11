import type { FormEvent } from "react";

import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";

import {
  compareVersions,
  createVersion,
  listVersionBranches,
  listVersions,
  restoreVersion,
  type VersionBranchRead,
  type VersionRead,
} from "@/api/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/lib/query-keys";

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function VersionCard({ version, selected, onSelect }: { version: VersionRead; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button type="button" className={`version-item ${selected ? "is-selected" : ""}`} onClick={() => onSelect(version.id)}>
      <div>
        <p className="eyebrow">{version.branch_name}</p>
        <h4>{version.label}</h4>
        <p className="muted">{version.summary || "No summary yet."}</p>
      </div>
      <div className="version-meta">
        <span>#{version.version_index}</span>
        <span>{new Date(version.created_at).toLocaleString()}</span>
      </div>
    </button>
  );
}

function BranchCard({ branch, versions, onPickLatest }: { branch: VersionBranchRead; versions: VersionRead[]; onPickLatest: (id: string) => void }) {
  return (
    <article className="branch-card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Branch</p>
          <h4>{branch.branch_name}</h4>
        </div>
        <strong>{branch.version_count}</strong>
      </div>
      <p className="muted">
        Latest checkpoint {branch.latest_version_id ? `#${versions.find((item) => item.id === branch.latest_version_id)?.version_index ?? "?"}` : "none"}
      </p>
      <button className="button button-ghost align-start" type="button" onClick={() => branch.latest_version_id && onPickLatest(branch.latest_version_id)}>
        Focus latest
      </button>
    </article>
  );
}

export function VersionsRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedVersionId = searchParams.get("versionId");
  const compareLeftId = searchParams.get("left");
  const compareRightId = searchParams.get("right");
  const [restoreLabel, setRestoreLabel] = useState("");
  const [restoreSummary, setRestoreSummary] = useState("");

  const versionsQuery = useQuery({
    queryKey: queryKeys.versions(projectId ?? ""),
    queryFn: () => listVersions(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const branchesQuery = useQuery({
    queryKey: queryKeys.versionBranches(projectId ?? ""),
    queryFn: () => listVersionBranches(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const versions = versionsQuery.data ?? [];
  const branches = branchesQuery.data ?? [];

  const selectedVersion = useMemo(() => {
    if (!versions.length) return null;
    return versions.find((version) => version.id === selectedVersionId) ?? versions[0];
  }, [selectedVersionId, versions]);

  const compareSelection = useMemo(() => {
    if (versions.length < 2) return null;
    const left = versions.find((version) => version.id === compareLeftId) ?? versions[0];
    const right = versions.find((version) => version.id === compareRightId) ?? versions[1] ?? versions[0];
    return left && right ? { left, right } : null;
  }, [compareLeftId, compareRightId, versions]);

  const compareQuery = useQuery({
    queryKey: queryKeys.versionCompare(projectId ?? "", compareSelection?.left.id, compareSelection?.right.id),
    queryFn: () => compareVersions(projectId ?? "", { left_version_id: compareSelection!.left.id, right_version_id: compareSelection!.right.id }),
    enabled: Boolean(projectId && compareSelection && compareSelection.left.id !== compareSelection.right.id),
  });

  useEffect(() => {
    if (!versions.length) return;
    if (!selectedVersionId) {
      const next = new URLSearchParams(searchParams);
      next.set("versionId", versions[0].id);
      if (!compareLeftId) next.set("left", versions[0].id);
      if (!compareRightId) next.set("right", versions[Math.min(1, versions.length - 1)].id);
      setSearchParams(next, { replace: true });
    }
  }, [compareLeftId, compareRightId, searchParams, selectedVersionId, setSearchParams, versions]);

  useEffect(() => {
    if (selectedVersion) {
      setRestoreLabel(`Restore ${selectedVersion.branch_name} #${selectedVersion.version_index}`);
      setRestoreSummary(selectedVersion.summary);
    }
  }, [selectedVersion?.id]);

  const refreshVersions = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.versions(projectId ?? "") });
    await queryClient.invalidateQueries({ queryKey: queryKeys.versionBranches(projectId ?? "") });
    await queryClient.invalidateQueries({ queryKey: queryKeys.versionCompare(projectId ?? "") });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createVersion>[1]) => createVersion(projectId ?? "", payload),
    onSuccess: async (created) => {
      await refreshVersions();
      const next = new URLSearchParams(searchParams);
      next.set("versionId", created.id);
      next.set("left", created.id);
      if (!next.get("right") && versions[0]?.id) next.set("right", versions[0].id);
      setSearchParams(next, { replace: true });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof restoreVersion>[2] }) =>
      restoreVersion(projectId ?? "", id, payload),
    onSuccess: async (created) => {
      await refreshVersions();
      const next = new URLSearchParams(searchParams);
      next.set("versionId", created.id);
      next.set("left", created.id);
      next.set("right", selectedVersion?.id ?? created.id);
      setSearchParams(next, { replace: true });
    },
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    createMutation.mutate({
      branch_name: normalizeText(formData.get("branch_name")) || undefined,
      label: normalizeText(formData.get("label")) || undefined,
      summary: normalizeText(formData.get("summary")),
    });
    event.currentTarget.reset();
  };

  const handleRestore = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedVersion?.id) return;
    restoreMutation.mutate({
      id: selectedVersion.id,
      payload: {
        label: restoreLabel.trim() || undefined,
        summary: restoreSummary.trim() || undefined,
      },
    });
  };

  if (!projectId) {
    return <p className="muted">Missing project id.</p>;
  }

  return (
    <div className="page-stack version-page">
      <div className="hero version-hero">
        <div>
          <p className="eyebrow">Phase 5</p>
          <h3>Versioning ledger</h3>
          <p className="muted max-width">
            Capture project checkpoints, inspect branches, compare snapshots, and restore earlier states without leaving the local workspace.
          </p>
        </div>
        <div className="hero-card">
          <span className="status-dot" />
          <strong>{versions.length} versions across {branches.length} branches</strong>
          <p>Restores create a fresh checkpoint so history stays readable.</p>
        </div>
      </div>

      <div className="story-toolbar">
        <Link to={`/projects/${projectId}`} className="button button-secondary">
          Back to dashboard
        </Link>
        <div className="asset-toolbar-note muted">Branch checkpoints are capped at three snapshots per branch.</div>
      </div>

      <div className="version-layout">
        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Branches</p>
              <h4>Branch overview</h4>
            </div>
          </div>

          <div className="branch-list">
            {branches.length ? (
              branches.map((branch) => (
                <BranchCard
                  key={branch.branch_name}
                  branch={branch}
                  versions={versions.filter((version) => version.branch_name === branch.branch_name)}
                  onPickLatest={(id) => {
                    const next = new URLSearchParams(searchParams);
                    next.set("versionId", id);
                    next.set("left", id);
                    next.set("right", compareRightId ?? id);
                    setSearchParams(next, { replace: true });
                  }}
                />
              ))
            ) : (
              <p className="muted">No checkpoints yet. Create the first snapshot below.</p>
            )}
          </div>

          <div className="divider" />

          <form className="form-grid" onSubmit={handleCreate}>
            <div className="form-head">
              <p className="eyebrow">Create checkpoint</p>
              <h4>Capture state</h4>
            </div>
            <div className="form-grid-two">
              <label>
                Branch
                <Input name="branch_name" placeholder="main" defaultValue="main" />
              </label>
              <label>
                Label
                <Input name="label" placeholder="Checkpoint" />
              </label>
            </div>
            <label>
              Summary
              <Textarea name="summary" rows={3} placeholder="What changed in this snapshot" />
            </label>
            <button className="button button-primary" type="submit">
              Create version
            </button>
          </form>
        </Card>

        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">History</p>
              <h4>{selectedVersion ? `${selectedVersion.branch_name} · #${selectedVersion.version_index}` : "Select a version"}</h4>
            </div>
          </div>

          <div className="version-list">
            {versions.length ? (
              versions.map((version) => (
                <VersionCard
                  key={version.id}
                  version={version}
                  selected={version.id === selectedVersion?.id}
                  onSelect={(id) => {
                    const next = new URLSearchParams(searchParams);
                    next.set("versionId", id);
                    next.set("left", compareLeftId ?? id);
                    next.set("right", compareRightId ?? id);
                    setSearchParams(next, { replace: true });
                  }}
                />
              ))
            ) : (
              <p className="muted">No versions recorded yet.</p>
            )}
          </div>

          <div className="divider" />

          {selectedVersion ? (
            <div className="editor-stack">
              <div className="version-summary-grid">
                <div className="story-stat">
                  <strong>#{selectedVersion.version_index}</strong>
                  <span>Version index</span>
                </div>
                <div className="story-stat">
                  <strong>{selectedVersion.branch_name}</strong>
                  <span>Branch</span>
                </div>
                <div className="story-stat">
                  <strong>{new Date(selectedVersion.created_at).toLocaleDateString()}</strong>
                  <span>Captured</span>
                </div>
                <div className="story-stat">
                  <strong>{selectedVersion.summary ? "Noted" : "Empty"}</strong>
                  <span>Summary state</span>
                </div>
              </div>

              <form className="form-grid" onSubmit={handleRestore}>
                <div className="form-head">
                  <p className="eyebrow">Restore</p>
                  <h4>Write a fresh checkpoint</h4>
                </div>
                <div className="form-grid-two">
                  <label>
                    Restore label
                    <Input value={restoreLabel} onChange={(event) => setRestoreLabel(event.currentTarget.value)} />
                  </label>
                  <label>
                    Restore summary
                    <Input value={restoreSummary} onChange={(event) => setRestoreSummary(event.currentTarget.value)} />
                  </label>
                </div>
                <button className="button button-primary" type="submit">
                  Restore and checkpoint
                </button>
              </form>
            </div>
          ) : (
            <p className="muted">Select a version to inspect it and restore from it.</p>
          )}

          <div className="divider" />

          <div className="section-head">
            <div>
              <p className="eyebrow">Comparison</p>
              <h4>Side-by-side diff</h4>
            </div>
          </div>

          {compareSelection && compareSelection.left.id !== compareSelection.right.id ? (
            <div className="comparison-grid">
              <Card className="compare-card">
                <p className="eyebrow">Left</p>
                <h4>{compareSelection.left.label}</h4>
                <p className="muted">{compareSelection.left.branch_name} · #{compareSelection.left.version_index}</p>
              </Card>
              <Card className="compare-card">
                <p className="eyebrow">Right</p>
                <h4>{compareSelection.right.label}</h4>
                <p className="muted">{compareSelection.right.branch_name} · #{compareSelection.right.version_index}</p>
              </Card>
              <Card className="compare-card compare-card-wide">
                <p className="eyebrow">Changes</p>
                <div className="mini-list">
                  <div className="stacked-card">
                    <strong>{compareQuery.data?.project_changes.length ?? 0} project changes</strong>
                    <p className="muted">{compareQuery.data?.project_changes.join(" · ") || "No project-level differences."}</p>
                  </div>
                  <div className="stacked-card">
                    <strong>Entity deltas</strong>
                    <p className="muted">
                      {Object.entries(compareQuery.data?.counts_delta ?? {}).map(([key, value]) => `${key}: ${value >= 0 ? "+" : ""}${value}`).join(" · ") || "No count deltas."}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <p className="muted">Pick two different versions in the URL to activate comparison.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
