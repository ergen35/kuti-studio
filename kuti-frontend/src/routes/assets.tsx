import type { FormEvent } from "react";

import { useEffect, useMemo, useState } from "react";

import {
  archiveAsset,
  createAssetLink,
  deleteAsset,
  deleteAssetLink,
  getAsset,
  getStory,
  importAsset,
  listAssets,
  listCharacters,
  updateAsset,
  type AssetDetail,
  type AssetLinkRead,
  type AssetRead,
} from "@/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n";

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function AssetListItem({ asset, selected, onSelect }: { asset: AssetRead; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button type="button" className={`asset-item ${selected ? "is-selected" : ""}`} onClick={() => onSelect(asset.id)}>
      <div>
        <p className="eyebrow">{asset.status}</p>
        <h4>{asset.name}</h4>
        <p className="muted">{asset.original_filename}</p>
      </div>
      <div className="asset-meta">
        <span>/{asset.slug}</span>
        <span>{Math.max(1, Math.round(asset.size_bytes / 1024))} KB</span>
      </div>
    </button>
  );
}

function AssetLinkItem({ link, onDelete }: { link: AssetLinkRead; onDelete: (id: string) => void }) {
  return (
    <article className="asset-chip">
      <div>
        <strong>{link.target_kind}</strong>
        <p className="muted">{link.target_id}</p>
      </div>
      <p className="muted">{link.note || "Usage link"}</p>
      <button className="button button-ghost align-start" type="button" onClick={() => onDelete(link.id)}>
        Remove link
      </button>
    </article>
  );
}

export function AssetsRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAssetId = searchParams.get("assetId");
  const [targetKind, setTargetKind] = useState<"character" | "tome" | "chapter" | "scene">("character");

  const assetsQuery = useQuery({
    queryKey: ["assets", projectId],
    queryFn: () => listAssets(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const charactersQuery = useQuery({
    queryKey: ["assets-target-characters", projectId],
    queryFn: () => listCharacters(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const storyQuery = useQuery({
    queryKey: ["assets-target-story", projectId],
    queryFn: () => getStory(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const selectedAsset = useMemo(() => {
    const items = assetsQuery.data?.items ?? [];
    if (!items.length) return null;
    return items.find((asset) => asset.id === selectedAssetId) ?? items[0];
  }, [assetsQuery.data?.items, selectedAssetId]);

  const targetOptions = useMemo(() => {
    const tomes = storyQuery.data?.tomes ?? [];
    const chapters = storyQuery.data?.chapters ?? [];
    const scenes = storyQuery.data?.scenes ?? [];
    const characters = charactersQuery.data?.items ?? [];

    return {
      character: characters.map((character) => ({ id: character.id, label: character.name, secondary: character.slug })),
      tome: tomes.map((tome) => ({ id: tome.id, label: tome.title, secondary: tome.slug })),
      chapter: chapters.map((chapter) => ({ id: chapter.id, label: chapter.title, secondary: chapter.slug })),
      scene: scenes.map((scene) => ({ id: scene.id, label: scene.title, secondary: scene.slug })),
    };
  }, [charactersQuery.data?.items, storyQuery.data?.chapters, storyQuery.data?.scenes, storyQuery.data?.tomes]);

  const selectedTargetOptions = targetOptions[targetKind];
  const [targetId, setTargetId] = useState<string>("");

  const assetDetailQuery = useQuery({
    queryKey: ["asset", projectId, selectedAsset?.id],
    queryFn: () => getAsset(projectId ?? "", selectedAsset?.id ?? ""),
    enabled: Boolean(projectId && selectedAsset?.id),
  });

  useEffect(() => {
    if (!selectedAssetId && selectedAsset?.id) {
      const next = new URLSearchParams(searchParams);
      next.set("assetId", selectedAsset.id);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, selectedAsset?.id, selectedAssetId, setSearchParams]);

  useEffect(() => {
    if (!selectedTargetOptions.length) {
      setTargetId("");
      return;
    }
    if (!selectedTargetOptions.some((option) => option.id === targetId)) {
      setTargetId(selectedTargetOptions[0].id);
    }
  }, [selectedTargetOptions, targetId]);

  const refreshAssets = async () => {
    await queryClient.invalidateQueries({ queryKey: ["assets", projectId] });
    await queryClient.invalidateQueries({ queryKey: ["asset", projectId, selectedAsset?.id] });
  };

  const importMutation = useMutation({
    mutationFn: (payload: Parameters<typeof importAsset>[1]) => importAsset(projectId ?? "", payload),
    onSuccess: async (created) => {
      await refreshAssets();
      const next = new URLSearchParams(searchParams);
      next.set("assetId", created.id);
      setSearchParams(next, { replace: true });
    },
  });

  const metadataMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateAsset>[2] }) =>
      updateAsset(projectId ?? "", id, payload),
    onSuccess: refreshAssets,
  });

  const linkCreateMutation = useMutation({
    mutationFn: ({ assetId, payload }: { assetId: string; payload: Parameters<typeof createAssetLink>[2] }) =>
      createAssetLink(projectId ?? "", assetId, payload),
    onSuccess: refreshAssets,
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveAsset(projectId ?? "", selectedAsset?.id ?? ""),
    onSuccess: refreshAssets,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAsset(projectId ?? "", selectedAsset?.id ?? ""),
    onSuccess: async () => {
      await refreshAssets();
      const next = new URLSearchParams(searchParams);
      next.delete("assetId");
      setSearchParams(next, { replace: true });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (linkId: string) => deleteAssetLink(projectId ?? "", selectedAsset?.id ?? "", linkId),
    onSuccess: refreshAssets,
  });

  const assetList = assetsQuery.data?.items ?? [];
  const detail = assetDetailQuery.data as AssetDetail | undefined;
  const links = detail?.links ?? [];

  const handleImport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const sourcePath = normalizeText(formData.get("source_path"));
    if (!sourcePath) return;

    importMutation.mutate({
      source_path: sourcePath,
      name: normalizeText(formData.get("name")) || null,
      slug: normalizeText(formData.get("slug")) || null,
      description: normalizeText(formData.get("description")),
      tags_json: splitLines(normalizeText(formData.get("tags_json"))),
      mime_type: normalizeText(formData.get("mime_type")) || null,
    });

    event.currentTarget.reset();
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAsset?.id) return;

    const formData = new FormData(event.currentTarget);
    metadataMutation.mutate({
      id: selectedAsset.id,
      payload: {
        name: normalizeText(formData.get("name")) || undefined,
        slug: normalizeText(formData.get("slug")) || undefined,
        description: normalizeText(formData.get("description")) || undefined,
        tags_json: splitLines(normalizeText(formData.get("tags_json"))),
      },
    });
  };

  const handleLinkCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAsset?.id) return;

    if (!targetId) return;

    linkCreateMutation.mutate({
      assetId: selectedAsset.id,
      payload: {
        asset_id: selectedAsset.id,
        target_kind: targetKind,
        target_id: targetId,
        note: normalizeText(new FormData(event.currentTarget).get("note")),
      },
    });
    event.currentTarget.reset();
  };

  if (!projectId) {
    return <p className="muted">Missing project id.</p>;
  }

  return (
    <div className="page-stack asset-page">
      <div className="hero story-hero">
        <div>
          <p className="eyebrow">Phase 4</p>
          <h3>{t("assetsLibrary")}</h3>
          <p className="muted max-width">
            Import local files into the project, track usage links, and keep the media archive tied to the same portable
            workspace as story and character data.
          </p>
        </div>
        <div className="hero-card">
          <span className="status-dot" />
          <strong>{assetList.length} assets tracked</strong>
          <p>{links.length} usage links on the selected asset.</p>
        </div>
      </div>

      <div className="story-toolbar">
        <Link to={`/projects/${projectId}`} className="button button-secondary">{t("backToDashboard")}</Link>
        <div className="asset-toolbar-note muted">Imports copy files into `kuti-data` and preserve the original filename.</div>
      </div>

      <div className="asset-layout">
        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Assets</p>
              <h4>{t("assetsLibrary")}</h4>
            </div>
          </div>

          <div className="asset-list">
            {assetList.length ? (
              assetList.map((asset) => (
                <AssetListItem
                  key={asset.id}
                  asset={asset}
                  selected={asset.id === selectedAsset?.id}
                  onSelect={(id) => {
                    const next = new URLSearchParams(searchParams);
                    next.set("assetId", id);
                    setSearchParams(next, { replace: true });
                  }}
                />
              ))
            ) : (
              <p className="muted">No assets imported yet.</p>
            )}
          </div>

          <div className="divider" />

          <form className="form-grid" onSubmit={handleImport}>
            <div className="form-head">
              <p className="eyebrow">Import asset</p>
              <h4>Copy from disk</h4>
            </div>
            <label>
              Source path
              <input name="source_path" placeholder="/home/user/Desktop/reference.png" required />
            </label>
            <div className="form-grid-two">
              <label>
                Name
                <input name="name" placeholder="Reference plate" />
              </label>
              <label>
                Slug
                <input name="slug" placeholder="reference-plate" />
              </label>
            </div>
            <label>
              Description
              <textarea name="description" rows={3} placeholder="Why this file matters" />
            </label>
            <div className="form-grid-two">
              <label>
                MIME type
                <input name="mime_type" placeholder="image/png" />
              </label>
              <label>
                Tags
                <textarea name="tags_json" rows={3} placeholder="reference\ncover\nscan" />
              </label>
            </div>
              <button className="button button-primary" type="submit">
                Import asset
              </button>
            </form>
        </Card>

        <Card>
          {detail ? (
            <div className="editor-stack">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Selected asset</p>
                  <h4>{detail.name}</h4>
                </div>
                <div className="project-actions">
                  <button className="button button-ghost" type="button" onClick={() => archiveMutation.mutate()}>
                    Archive
                  </button>
                  <button className="button button-ghost" type="button" onClick={() => deleteMutation.mutate()}>
                    Delete
                  </button>
                </div>
              </div>

              <div className="asset-summary-grid">
                <div className="asset-chip">
                  <strong>/{detail.slug}</strong>
                  <span>{detail.status}</span>
                </div>
                <div className="asset-chip">
                  <strong>{detail.original_filename}</strong>
                  <span>{detail.mime_type}</span>
                </div>
                <div className="asset-chip">
                  <strong>{Math.max(1, Math.round(detail.size_bytes / 1024))} KB</strong>
                  <span>{detail.checksum.slice(0, 12)}</span>
                </div>
              </div>

              <form className="form-grid" onSubmit={handleUpdate}>
                <div className="form-grid-two">
                  <label>
                    Name
                    <input name="name" defaultValue={detail.name} />
                  </label>
                  <label>
                    Slug
                    <input name="slug" defaultValue={detail.slug} />
                  </label>
                </div>
                <label>
                  Description
                  <textarea name="description" rows={4} defaultValue={detail.description} />
                </label>
                <label>
                  Tags
                  <textarea name="tags_json" rows={3} defaultValue={detail.tags_json.join("\n")} />
                </label>
                <button className="button button-primary" type="submit">
                  Save metadata
                </button>
              </form>

              <div className="asset-preview">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Storage</p>
                    <h4>Portable file copy</h4>
                  </div>
                </div>
                <p className="muted">{detail.storage_path}</p>
              </div>

              <div className="story-summary-grid">
                <Card>
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Usage</p>
                      <h4>{links.length} links</h4>
                    </div>
                  </div>
                  <div className="reference-list">
                    {links.length ? links.map((link) => <AssetLinkItem key={link.id} link={link} onDelete={(id) => deleteLinkMutation.mutate(id)} />) : <p className="muted">No usage links yet.</p>}
                  </div>
                </Card>

                <Card>
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Link asset</p>
                      <h4>Attach to content</h4>
                    </div>
                  </div>
                  <form className="form-grid" onSubmit={handleLinkCreate}>
                    <div className="form-grid-two">
                      <label>
                        Target kind
                        <select
                          name="target_kind"
                          value={targetKind}
                          onChange={(event) => setTargetKind(event.currentTarget.value as typeof targetKind)}
                        >
                          <option value="character">Character</option>
                          <option value="tome">Tome</option>
                          <option value="chapter">Chapter</option>
                          <option value="scene">Scene</option>
                        </select>
                      </label>
                      <label>
                        Target entity
                        <select name="target_id" value={targetId} onChange={(event) => setTargetId(event.currentTarget.value)} required>
                          <option value="" disabled>
                            Choose {targetKind}
                          </option>
                          {selectedTargetOptions.length ? (
                            selectedTargetOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label} · {option.secondary}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>
                              No {targetKind}s available
                            </option>
                          )}
                        </select>
                      </label>
                    </div>
                    <label>
                      Note
                      <textarea name="note" rows={3} placeholder="Why this asset is linked" />
                    </label>
                    <button className="button" type="submit">
                      Add usage link
                    </button>
                  </form>
                </Card>
              </div>
            </div>
          ) : (
            <p className="muted">Import an asset to inspect its metadata and usage links.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
