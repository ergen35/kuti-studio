import type { FormEvent } from "react";

import { useEffect, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";

import {
  createScene,
  deleteScene,
  getStory,
  listStoryReferences,
  listStorySuggestions,
  updateScene,
  type SceneRead,
  type StoryReferenceRead,
  type StorySuggestionRead,
} from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";
import { generationSearch, normalizeJsonList, normalizeText, parseOrder, parseStatus, replaceSearchParams, slugHint } from "@/routes/story-shared";

function SceneItem({ scene, selected, onSelect }: { scene: SceneRead; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button type="button" className={`story-item ${selected ? "is-selected" : ""}`} onClick={() => onSelect(scene.id)}>
      <div>
        <p className="eyebrow">Scene</p>
        <h4>{scene.title}</h4>
        <p className="muted">{scene.summary || "No summary yet."}</p>
      </div>
      <div className="story-meta">
        <span>/{scene.slug}</span>
        <span>{scene.scene_type || scene.location || "scene"}</span>
      </div>
    </button>
  );
}

function ReferenceChip({ reference }: { reference: StoryReferenceRead }) {
  return (
    <div className="reference-chip">
      <strong>@{reference.reference_kind}:{reference.target_slug}</strong>
      <span>{reference.raw_token}</span>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: StorySuggestionRead }) {
  return (
    <div className="reference-chip">
      <strong>{suggestion.label}</strong>
      <span>@{suggestion.kind}:{suggestion.slug}</span>
    </div>
  );
}

export function StoryScenesRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTomeId = searchParams.get("tomeId");
  const selectedChapterId = searchParams.get("chapterId");
  const selectedSceneId = searchParams.get("sceneId");
  const searchTerm = searchParams.get("suggest") ?? "";

  const storyQuery = useQuery({
    queryKey: ["story", projectId],
    queryFn: () => getStory(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const tomes = storyQuery.data?.tomes ?? [];
  const chapters = storyQuery.data?.chapters ?? [];
  const scenes = storyQuery.data?.scenes ?? [];

  const selectedTome = useMemo(() => {
    if (!tomes.length) return null;
    return tomes.find((item) => item.id === selectedTomeId) ?? tomes[0];
  }, [selectedTomeId, tomes]);

  const visibleChapters = useMemo(
    () => (selectedTome ? chapters.filter((chapter) => chapter.tome_id === selectedTome.id) : chapters),
    [chapters, selectedTome],
  );

  const selectedChapter = useMemo(() => {
    if (!visibleChapters.length) return null;
    return visibleChapters.find((item) => item.id === selectedChapterId) ?? visibleChapters[0];
  }, [selectedChapterId, visibleChapters]);

  const visibleScenes = useMemo(
    () => (selectedChapter ? scenes.filter((scene) => scene.chapter_id === selectedChapter.id) : scenes),
    [scenes, selectedChapter],
  );

  const selectedScene = useMemo(() => {
    if (!visibleScenes.length) return null;
    return visibleScenes.find((item) => item.id === selectedSceneId) ?? visibleScenes[0];
  }, [selectedSceneId, visibleScenes]);

  useEffect(() => {
    if (!tomes.length) {
      replaceSearchParams(searchParams, (params) => {
        params.delete("tomeId");
        params.delete("chapterId");
        params.delete("sceneId");
      }, setSearchParams);
      return;
    }

    if (!selectedTomeId || !tomes.some((item) => item.id === selectedTomeId)) {
      replaceSearchParams(searchParams, (params) => {
        params.set("tomeId", tomes[0].id);
      }, setSearchParams);
    }
  }, [searchParams, selectedTomeId, setSearchParams, tomes]);

  useEffect(() => {
    if (!selectedTome) return;
    if (!visibleChapters.length) {
      replaceSearchParams(searchParams, (params) => {
        params.delete("chapterId");
        params.delete("sceneId");
      }, setSearchParams);
      return;
    }

    if (!selectedChapterId || !visibleChapters.some((item) => item.id === selectedChapterId)) {
      replaceSearchParams(searchParams, (params) => {
        params.set("chapterId", visibleChapters[0].id);
      }, setSearchParams);
    }
  }, [searchParams, selectedChapterId, selectedTome, setSearchParams, visibleChapters]);

  useEffect(() => {
    if (!selectedChapter) return;
    if (!visibleScenes.length) {
      replaceSearchParams(searchParams, (params) => {
        params.delete("sceneId");
      }, setSearchParams);
      return;
    }

    if (!selectedSceneId || !visibleScenes.some((item) => item.id === selectedSceneId)) {
      replaceSearchParams(searchParams, (params) => {
        params.set("sceneId", visibleScenes[0].id);
      }, setSearchParams);
    }
  }, [searchParams, selectedChapter, selectedSceneId, setSearchParams, visibleScenes]);

  const sceneReferencesQuery = useQuery({
    queryKey: ["story-references", projectId, selectedScene?.id],
    queryFn: () => listStoryReferences(projectId ?? "", selectedScene?.id),
    enabled: Boolean(projectId && selectedScene?.id),
  });

  const suggestionsQuery = useQuery({
    queryKey: ["story-suggestions", projectId, searchTerm],
    queryFn: () => listStorySuggestions(projectId ?? "", searchTerm || undefined),
    enabled: Boolean(projectId),
  });

  const refreshStory = async () => {
    await queryClient.invalidateQueries({ queryKey: ["story", projectId] });
    await queryClient.invalidateQueries({ queryKey: ["story-references", projectId] });
    await queryClient.invalidateQueries({ queryKey: ["story-suggestions", projectId] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createScene>[1]) => createScene(projectId ?? "", payload),
    onSuccess: async (created) => {
      await refreshStory();
      replaceSearchParams(searchParams, (params) => {
        params.set("sceneId", created.id);
      }, setSearchParams);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateScene>[2] }) => updateScene(projectId ?? "", id, payload),
    onSuccess: refreshStory,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteScene(projectId ?? "", id),
    onSuccess: async () => {
      await refreshStory();
      replaceSearchParams(searchParams, (params) => {
        params.delete("sceneId");
      }, setSearchParams);
    },
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTome || !selectedChapter) return;

    const formData = new FormData(event.currentTarget);
    const title = normalizeText(formData.get("title"));
    if (!title) return;

    createMutation.mutate({
      tome_id: selectedTome.id,
      chapter_id: selectedChapter.id,
      title,
      slug: normalizeText(formData.get("slug")) || null,
      scene_type: normalizeText(formData.get("scene_type")),
      location: normalizeText(formData.get("location")),
      summary: normalizeText(formData.get("summary")),
      content: normalizeText(formData.get("content")),
      notes: normalizeText(formData.get("notes")),
      characters_json: normalizeJsonList(normalizeText(formData.get("characters_json"))),
      tags_json: normalizeJsonList(normalizeText(formData.get("tags_json"))),
      status: parseStatus(formData.get("status")),
      order_index: parseOrder(formData.get("order_index")),
    });

    event.currentTarget.reset();
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>, scene: SceneRead) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateMutation.mutate({
      id: scene.id,
      payload: {
        title: normalizeText(formData.get("title")) || undefined,
        slug: normalizeText(formData.get("slug")) || undefined,
        scene_type: normalizeText(formData.get("scene_type")) || undefined,
        location: normalizeText(formData.get("location")) || undefined,
        summary: normalizeText(formData.get("summary")) || undefined,
        content: normalizeText(formData.get("content")) || undefined,
        notes: normalizeText(formData.get("notes")) || undefined,
        characters_json: normalizeJsonList(normalizeText(formData.get("characters_json"))),
        tags_json: normalizeJsonList(normalizeText(formData.get("tags_json"))),
        status: parseStatus(formData.get("status")),
        order_index: parseOrder(formData.get("order_index")),
      },
    });
  };

  if (!projectId) {
    return <p className="muted">{t("missingProjectId")}</p>;
  }

  return (
    <div className="page-stack story-screen story-scenes">
      <div className="hero story-hero">
        <div>
          <p className="eyebrow">{t("storyScenes")}</p>
          <h3>{t("storyScenesIntro")}</h3>
          <p className="muted max-width">Scenes are edited in a focused screen with references and generation links.</p>
        </div>
        <Card className="hero-card">
          <span className="status-dot" />
          <strong>{scenes.length} scenes</strong>
          <p>{visibleScenes.length} scenes in the selected chapter.</p>
        </Card>
      </div>

      <div className="story-toolbar">
        <Link to={`/projects/${projectId}/story`} className="button button-secondary">
          {t("backToStoryHub")}
        </Link>
        <div className="project-actions">
          <Link to={`/projects/${projectId}/story/tomes`} className="button button-secondary">{t("storyTomes")}</Link>
          <Link to={`/projects/${projectId}/story/chapters`} className="button button-secondary">{t("storyChapters")}</Link>
        </div>
      </div>

      <div className="story-layout">
        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">{t("selectTome")}</p>
              <h4>Tome and chapter</h4>
            </div>
          </div>

          <div className="story-list">
            {tomes.length ? (
              tomes.map((tome) => (
                <button key={tome.id} type="button" className={`story-item ${tome.id === selectedTome?.id ? "is-selected" : ""}`} onClick={() => replaceSearchParams(searchParams, (params) => {
                  params.set("tomeId", tome.id);
                  params.delete("chapterId");
                  params.delete("sceneId");
                }, setSearchParams)}>
                  <div>
                    <p className="eyebrow">Tome</p>
                    <h4>{tome.title}</h4>
                    <p className="muted">{tome.synopsis || "No synopsis yet."}</p>
                  </div>
                  <div className="story-meta">
                    <span>/{tome.slug}</span>
                    <span>{chapters.filter((chapter) => chapter.tome_id === tome.id).length} chapters</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="muted">Create a tome first to unlock scene editing.</p>
            )}
          </div>

          <div className="divider" />

          <div className="story-list">
            {visibleChapters.length ? (
              visibleChapters.map((chapter) => (
                <button key={chapter.id} type="button" className={`story-item ${chapter.id === selectedChapter?.id ? "is-selected" : ""}`} onClick={() => replaceSearchParams(searchParams, (params) => {
                  params.set("chapterId", chapter.id);
                  params.delete("sceneId");
                }, setSearchParams)}>
                  <div>
                    <p className="eyebrow">Chapter</p>
                    <h4>{chapter.title}</h4>
                    <p className="muted">{chapter.synopsis || "No synopsis yet."}</p>
                  </div>
                  <div className="story-meta">
                    <span>/{chapter.slug}</span>
                    <span>{visibleScenes.filter((scene) => scene.chapter_id === chapter.id).length} scenes</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="muted">Select a tome with chapters before editing scenes.</p>
            )}
          </div>

          <div className="divider" />

          <div className="story-list">
            {visibleScenes.length ? (
              visibleScenes.map((scene) => (
                <SceneItem key={scene.id} scene={scene} selected={scene.id === selectedScene?.id} onSelect={(id) => replaceSearchParams(searchParams, (params) => params.set("sceneId", id), setSearchParams)} />
              ))
            ) : (
              <p className="muted">No scenes in the selected chapter yet.</p>
            )}
          </div>

          <div className="divider" />

          <form className="form-grid" onSubmit={handleCreate}>
            <div className="form-head">
              <div>
                <p className="eyebrow">{t("createScene")}</p>
                <h4>New scene</h4>
              </div>
            </div>
            <Input name="title" placeholder="The dockside reveal" required />
            <Input name="slug" placeholder={slugHint("The dockside reveal")} />
            <div className="form-grid-two">
              <Input name="scene_type" placeholder="opening" />
              <Input name="location" placeholder="Harbor street" />
            </div>
            <Textarea name="summary" rows={3} placeholder="What happens here" />
            <Textarea name="content" rows={6} placeholder="Scene text with references like @character:jack-vespers" />
            <Textarea name="notes" rows={3} placeholder="Editorial notes" />
            <div className="form-grid-two">
              <Textarea name="characters_json" rows={3} placeholder="Jack Vespers\nMira Sol" />
              <Textarea name="tags_json" rows={3} placeholder="noir\nsetup" />
            </div>
            <div className="form-grid-two">
              <Select name="status" defaultValue="active">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </Select>
              <Input name="order_index" type="number" defaultValue={0} />
            </div>
            <Button variant="primary" type="submit" disabled={!selectedTome || !selectedChapter}>
              {t("createScene")}
            </Button>
          </form>
        </Card>

        <Card>
          {selectedScene ? (
            <div className="editor-stack story-editor">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Selected scene</p>
                  <h4>{selectedScene.title}</h4>
                </div>
                <Badge>{selectedScene.status}</Badge>
              </div>

              <div className="story-summary-grid">
                <div className="story-stat">
                  <strong>{selectedScene.slug}</strong>
                  <span>Slug</span>
                </div>
                <div className="story-stat">
                  <strong>{selectedScene.scene_type || selectedScene.location || "scene"}</strong>
                  <span>Type</span>
                </div>
                <div className="story-stat">
                  <strong>#{selectedScene.order_index}</strong>
                  <span>Order</span>
                </div>
                <div className="story-stat">
                  <strong>{selectedChapter?.title ?? "No chapter"}</strong>
                  <span>Parent chapter</span>
                </div>
              </div>

              <form className="form-grid" onSubmit={(event) => handleUpdate(event, selectedScene)}>
                <Input name="title" defaultValue={selectedScene.title} />
                <Input name="slug" defaultValue={selectedScene.slug} />
                <div className="form-grid-two">
                  <Input name="scene_type" defaultValue={selectedScene.scene_type} />
                  <Input name="location" defaultValue={selectedScene.location} />
                </div>
                <Textarea name="summary" rows={3} defaultValue={selectedScene.summary} />
                <Textarea name="content" rows={8} defaultValue={selectedScene.content} />
                <Textarea name="notes" rows={3} defaultValue={selectedScene.notes} />
                <div className="form-grid-two">
                  <Textarea name="characters_json" rows={3} defaultValue={selectedScene.characters_json.join("\n")} />
                  <Textarea name="tags_json" rows={3} defaultValue={selectedScene.tags_json.join("\n")} />
                </div>
                <div className="form-grid-two">
                  <Select name="status" defaultValue={selectedScene.status}>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </Select>
                  <Input name="order_index" type="number" defaultValue={selectedScene.order_index} />
                </div>
                <div className="project-actions">
                  <Button variant="primary" type="submit">{t("saveScene")}</Button>
                  <Button variant="ghost" type="button" onClick={() => deleteMutation.mutate(selectedScene.id)}>
                    Delete
                  </Button>
                  <Link
                    to={generationSearch(projectId, { sourceKind: "scene", sourceId: selectedScene.id, mode: "separate" })}
                    className="button button-secondary"
                  >
                    {t("generationStudio")}
                  </Link>
                </div>
              </form>

              <div className="story-summary-grid">
                <Card>
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">References</p>
                      <h4>{sceneReferencesQuery.data?.length ?? 0} linked references</h4>
                    </div>
                  </div>
                  <div className="reference-list">
                    {sceneReferencesQuery.data?.length ? sceneReferencesQuery.data.map((reference) => <ReferenceChip key={reference.id} reference={reference} />) : <p className="muted">No references resolved for this scene.</p>}
                  </div>
                </Card>

                <Card>
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Suggestions</p>
                      <h4>Reference palette</h4>
                    </div>
                  </div>
                  <div className="reference-list">
                    {suggestionsQuery.data?.length ? suggestionsQuery.data.map((suggestion) => <SuggestionCard key={`${suggestion.kind}-${suggestion.slug}`} suggestion={suggestion} />) : <p className="muted">Search a reference prefix to populate suggestions.</p>}
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <p className="muted">Select a scene to edit text, metadata, and references.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
