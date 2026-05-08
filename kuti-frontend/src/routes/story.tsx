import type { FormEvent } from "react";

import { useEffect, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";

import {
  createChapter,
  createScene,
  createTome,
  deleteChapter,
  deleteScene,
  deleteTome,
  getStory,
  listStoryReferences,
  listStorySuggestions,
  updateChapter,
  updateScene,
  updateTome,
  type ChapterRead,
  type SceneRead,
  type StoryReferenceRead,
  type StorySuggestionRead,
  type TomeRead,
} from "@/api/client";
import { Card } from "@/components/ui/card";

type StoryFormResult = {
  title: string;
  slug: string | null;
  synopsis: string;
  status: "active" | "draft" | "archived";
  order_index: number;
};

function slugHint(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function normalizeJsonList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseOrder(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseStatus(value: FormDataEntryValue | null) {
  const candidate = String(value ?? "active");
  return candidate === "draft" || candidate === "archived" ? candidate : "active";
}

function buildStoryFormResult(formData: FormData): StoryFormResult {
  const title = normalizeText(formData.get("title"));
  return {
    title,
    slug: normalizeText(formData.get("slug")) || null,
    synopsis: normalizeText(formData.get("synopsis")),
    status: parseStatus(formData.get("status")),
    order_index: parseOrder(formData.get("order_index")),
  };
}

function TomeCard({ tome, selected, onSelect }: { tome: TomeRead; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button type="button" className={`story-item ${selected ? "is-selected" : ""}`} onClick={() => onSelect(tome.id)}>
      <div>
        <p className="eyebrow">Tome</p>
        <h4>{tome.title}</h4>
        <p className="muted">{tome.synopsis || "No synopsis yet."}</p>
      </div>
      <div className="story-meta">
        <span>/{tome.slug}</span>
        <span>{tome.status}</span>
      </div>
    </button>
  );
}

function ChapterCard({ chapter, selected, onSelect }: { chapter: ChapterRead; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button type="button" className={`story-item ${selected ? "is-selected" : ""}`} onClick={() => onSelect(chapter.id)}>
      <div>
        <p className="eyebrow">Chapter</p>
        <h4>{chapter.title}</h4>
        <p className="muted">{chapter.synopsis || "No synopsis yet."}</p>
      </div>
      <div className="story-meta">
        <span>/{chapter.slug}</span>
        <span>{chapter.status}</span>
      </div>
    </button>
  );
}

function SceneCard({ scene, selected, onSelect }: { scene: SceneRead; selected: boolean; onSelect: (id: string) => void }) {
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

export function StoryRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const storyQuery = useQuery({
    queryKey: ["story", projectId],
    queryFn: () => getStory(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const suggestionQuery = useQuery({
    queryKey: ["story-suggestions", projectId, searchParams.get("suggest")],
    queryFn: () => listStorySuggestions(projectId ?? "", searchParams.get("suggest") ?? undefined),
    enabled: Boolean(projectId),
  });

  const selectedTomeId = searchParams.get("tomeId");
  const selectedChapterId = searchParams.get("chapterId");
  const selectedSceneId = searchParams.get("sceneId");
  const searchTerm = searchParams.get("suggest") ?? "";

  const replaceSearchParams = (mutator: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams);
    mutator(next);
    setSearchParams(next, { replace: true });
  };

  const tomes = storyQuery.data?.tomes ?? [];
  const chapters = useMemo(
    () => (selectedTomeId ? (storyQuery.data?.chapters ?? []).filter((chapter) => chapter.tome_id === selectedTomeId) : storyQuery.data?.chapters ?? []),
    [selectedTomeId, storyQuery.data?.chapters],
  );
  const scenes = useMemo(
    () => (selectedChapterId ? (storyQuery.data?.scenes ?? []).filter((scene) => scene.chapter_id === selectedChapterId) : storyQuery.data?.scenes ?? []),
    [selectedChapterId, storyQuery.data?.scenes],
  );

  const selectedTome = tomes.find((tome) => tome.id === selectedTomeId) ?? tomes[0] ?? null;
  const visibleChapters = selectedTome ? chapters.filter((chapter) => chapter.tome_id === selectedTome.id) : chapters;
  const selectedChapter = visibleChapters.find((chapter) => chapter.id === selectedChapterId) ?? visibleChapters[0] ?? null;
  const visibleScenes = selectedChapter ? scenes.filter((scene) => scene.chapter_id === selectedChapter.id) : scenes;
  const selectedScene = visibleScenes.find((scene) => scene.id === selectedSceneId) ?? visibleScenes[0] ?? null;

  useEffect(() => {
    if (!tomes.length) {
      replaceSearchParams((params) => {
        params.delete("tomeId");
        params.delete("chapterId");
        params.delete("sceneId");
      });
      return;
    }

    if (!selectedTomeId || !tomes.some((tome) => tome.id === selectedTomeId)) {
      replaceSearchParams((params) => {
        params.set("tomeId", tomes[0].id);
      });
    }
  }, [selectedTomeId, tomes]);

  useEffect(() => {
    if (!selectedTome) return;
    if (!visibleChapters.length) {
      replaceSearchParams((params) => {
        params.delete("chapterId");
        params.delete("sceneId");
      });
      return;
    }

    if (!selectedChapterId || !visibleChapters.some((chapter) => chapter.id === selectedChapterId)) {
      replaceSearchParams((params) => {
        params.set("chapterId", visibleChapters[0].id);
      });
    }
  }, [selectedChapterId, selectedTome?.id, visibleChapters]);

  useEffect(() => {
    if (!selectedChapter) return;
    if (!visibleScenes.length) {
      replaceSearchParams((params) => {
        params.delete("sceneId");
      });
      return;
    }

    if (!selectedSceneId || !visibleScenes.some((scene) => scene.id === selectedSceneId)) {
      replaceSearchParams((params) => {
        params.set("sceneId", visibleScenes[0].id);
      });
    }
  }, [selectedChapter?.id, selectedSceneId, visibleScenes]);

  const invalidateStory = async () => {
    await queryClient.invalidateQueries({ queryKey: ["story", projectId] });
    await queryClient.invalidateQueries({ queryKey: ["story-suggestions", projectId] });
  };

  const tomeCreateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createTome>[1]) => createTome(projectId ?? "", payload),
    onSuccess: async (created) => {
      await invalidateStory();
      replaceSearchParams((params) => {
        params.set("tomeId", created.id);
      });
    },
  });

  const tomeUpdateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateTome>[2] }) => updateTome(projectId ?? "", id, payload),
    onSuccess: invalidateStory,
  });

  const tomeDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteTome(projectId ?? "", id),
    onSuccess: async () => {
      await invalidateStory();
      replaceSearchParams((params) => {
        params.delete("tomeId");
        params.delete("chapterId");
        params.delete("sceneId");
      });
    },
  });

  const chapterCreateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createChapter>[1]) => createChapter(projectId ?? "", payload),
    onSuccess: async (created) => {
      await invalidateStory();
      replaceSearchParams((params) => {
        params.set("chapterId", created.id);
      });
    },
  });

  const chapterUpdateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateChapter>[2] }) => updateChapter(projectId ?? "", id, payload),
    onSuccess: invalidateStory,
  });

  const chapterDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteChapter(projectId ?? "", id),
    onSuccess: async () => {
      await invalidateStory();
      replaceSearchParams((params) => {
        params.delete("chapterId");
        params.delete("sceneId");
      });
    },
  });

  const sceneCreateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createScene>[1]) => createScene(projectId ?? "", payload),
    onSuccess: async (created) => {
      await invalidateStory();
      replaceSearchParams((params) => {
        params.set("sceneId", created.id);
      });
    },
  });

  const sceneUpdateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateScene>[2] }) => updateScene(projectId ?? "", id, payload),
    onSuccess: invalidateStory,
  });

  const sceneDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteScene(projectId ?? "", id),
    onSuccess: async () => {
      await invalidateStory();
      replaceSearchParams((params) => {
        params.delete("sceneId");
      });
    },
  });

  const sceneReferencesQuery = useQuery({
    queryKey: ["story-references", projectId, selectedScene?.id],
    queryFn: () => listStoryReferences(projectId ?? "", selectedScene?.id),
    enabled: Boolean(projectId && selectedScene?.id),
  });

  const summary = storyQuery.data;
  const orphanRefs = summary?.orphan_references ?? [];
  const selectedSceneReferences = sceneReferencesQuery.data ?? [];

  const handleTomeCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = normalizeText(formData.get("title"));
    if (!title) return;

    tomeCreateMutation.mutate({
      title,
      slug: normalizeText(formData.get("slug")) || null,
      synopsis: normalizeText(formData.get("synopsis")),
      status: parseStatus(formData.get("status")),
      order_index: Number.isFinite(Number(formData.get("order_index") ?? 0)) ? Number(formData.get("order_index") ?? 0) : 0,
    });
    event.currentTarget.reset();
  };

  const handleTomeUpdate = (event: FormEvent<HTMLFormElement>, tome: TomeRead) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    tomeUpdateMutation.mutate({
      id: tome.id,
      payload: {
        title: normalizeText(formData.get("title")) || undefined,
        slug: normalizeText(formData.get("slug")) || undefined,
        synopsis: normalizeText(formData.get("synopsis")) || undefined,
        status: parseStatus(formData.get("status")),
        order_index: Number.isFinite(Number(formData.get("order_index") ?? tome.order_index)) ? Number(formData.get("order_index") ?? tome.order_index) : tome.order_index,
      },
    });
  };

  const handleChapterCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTome) return;
    const formData = new FormData(event.currentTarget);
    const title = normalizeText(formData.get("title"));
    if (!title) return;

    chapterCreateMutation.mutate({
      tome_id: selectedTome.id,
      title,
      slug: normalizeText(formData.get("slug")) || null,
      synopsis: normalizeText(formData.get("synopsis")),
      status: parseStatus(formData.get("status")),
      order_index: Number.isFinite(Number(formData.get("order_index") ?? 0)) ? Number(formData.get("order_index") ?? 0) : 0,
    });
    event.currentTarget.reset();
  };

  const handleChapterUpdate = (event: FormEvent<HTMLFormElement>, chapter: ChapterRead) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    chapterUpdateMutation.mutate({
      id: chapter.id,
      payload: {
        title: normalizeText(formData.get("title")) || undefined,
        slug: normalizeText(formData.get("slug")) || undefined,
        synopsis: normalizeText(formData.get("synopsis")) || undefined,
        status: parseStatus(formData.get("status")),
        order_index: Number.isFinite(Number(formData.get("order_index") ?? chapter.order_index)) ? Number(formData.get("order_index") ?? chapter.order_index) : chapter.order_index,
      },
    });
  };

  const handleSceneCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTome || !selectedChapter) return;
    const formData = new FormData(event.currentTarget);
    const title = normalizeText(formData.get("title"));
    if (!title) return;

    sceneCreateMutation.mutate({
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
      order_index: Number.isFinite(Number(formData.get("order_index") ?? 0)) ? Number(formData.get("order_index") ?? 0) : 0,
    });
    event.currentTarget.reset();
  };

  const handleSceneUpdate = (event: FormEvent<HTMLFormElement>, scene: SceneRead) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    sceneUpdateMutation.mutate({
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
        order_index: Number.isFinite(Number(formData.get("order_index") ?? scene.order_index)) ? Number(formData.get("order_index") ?? scene.order_index) : scene.order_index,
      },
    });
  };

  if (!projectId) {
    return <p className="muted">Missing project id.</p>;
  }

  return (
    <div className="page-stack story-page">
      <div className="hero story-hero">
        <div>
          <p className="eyebrow">Phase 3</p>
          <h3>Storyline atlas</h3>
          <p className="muted max-width">
            Build tomes, chapters, and scenes in a structured hierarchy. The editor keeps references visible,
            surfaces orphans, and stays local-first for fast iteration.
          </p>
        </div>
        <div className="hero-card">
          <span className="status-dot" />
          <strong>{tomes.length} tomes / {chapters.length} chapters / {scenes.length} scenes</strong>
          <p>{orphanRefs.length} orphan references detected in the current project.</p>
        </div>
      </div>

      <div className="story-toolbar">
        <Link to={`/projects/${projectId}`} className="button button-secondary">Back to dashboard</Link>
        <form className="inline-form story-search" onSubmit={(event) => event.preventDefault()}>
          <input
            name="suggest"
            placeholder="Find references or entities"
            value={searchTerm}
            onChange={(event) => {
              replaceSearchParams((params) => {
                const value = event.currentTarget.value.trim();
                if (value) params.set("suggest", value);
                else params.delete("suggest");
              });
            }}
          />
          <button
            className="button button-ghost"
            type="button"
            onClick={() =>
              replaceSearchParams((params) => {
                params.delete("suggest");
              })
            }
          >
            Clear
          </button>
        </form>
      </div>

      <div className="story-layout">
        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Tomes</p>
              <h4>Structure</h4>
            </div>
          </div>

          <div className="story-list">
            {tomes.length ? tomes.map((tome) => <TomeCard key={tome.id} tome={tome} selected={tome.id === selectedTome?.id} onSelect={(id) => replaceSearchParams((params) => { params.set("tomeId", id); params.delete("chapterId"); params.delete("sceneId"); })} />) : <p className="muted">No tomes yet.</p>}
          </div>

          <div className="divider" />

          <form className="form-grid" onSubmit={handleTomeCreate}>
            <div className="form-head"><p className="eyebrow">Create tome</p><h4>New volume</h4></div>
            <label>Name<input name="title" placeholder="Volume One" required /></label>
            <label>Slug<input name="slug" placeholder={slugHint("Volume One")} /></label>
            <label>Synopsis<textarea name="synopsis" rows={3} placeholder="High-level story arc" /></label>
            <div className="form-grid-two">
              <label>Status
                <select name="status" defaultValue="active">
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label>Order<input name="order_index" type="number" defaultValue={0} /></label>
            </div>
            <button className="button button-primary" type="submit">Create tome</button>
          </form>
        </Card>

        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Chapters and scenes</p>
              <h4>{selectedTome?.title ?? "Select a tome"}</h4>
            </div>
          </div>

          <div className="story-columns">
            <div>
              <div className="story-list">
                {visibleChapters.length ? visibleChapters.map((chapter) => <ChapterCard key={chapter.id} chapter={chapter} selected={chapter.id === selectedChapter?.id} onSelect={(id) => replaceSearchParams((params) => { params.set("chapterId", id); params.delete("sceneId"); })} />) : <p className="muted">No chapters in this tome yet.</p>}
              </div>

              <form className="form-grid compact-form" onSubmit={handleChapterCreate}>
                <div className="form-head"><p className="eyebrow">Create chapter</p><h4>New chapter</h4></div>
                <label>Title<input name="title" placeholder="Chapter One" required /></label>
                <label>Slug<input name="slug" placeholder={slugHint("Chapter One")} /></label>
                <label>Synopsis<textarea name="synopsis" rows={3} placeholder="Chapter summary" /></label>
                <div className="form-grid-two">
                  <label>Status
                    <select name="status" defaultValue="active">
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <label>Order<input name="order_index" type="number" defaultValue={0} /></label>
                </div>
                <button className="button" type="submit">Create chapter</button>
              </form>
            </div>

            <div>
              <div className="story-list">
                {visibleScenes.length ? visibleScenes.map((scene) => <SceneCard key={scene.id} scene={scene} selected={scene.id === selectedScene?.id} onSelect={(id) => replaceSearchParams((params) => params.set("sceneId", id))} />) : <p className="muted">No scenes in this chapter yet.</p>}
              </div>

              <form className="form-grid compact-form" onSubmit={handleSceneCreate}>
                <div className="form-head"><p className="eyebrow">Create scene</p><h4>New scene</h4></div>
                <label>Title<input name="title" placeholder="The dockside reveal" required /></label>
                <label>Slug<input name="slug" placeholder={slugHint("The dockside reveal")} /></label>
                <div className="form-grid-two">
                  <label>Type<input name="scene_type" placeholder="opening" /></label>
                  <label>Location<input name="location" placeholder="Harbor street" /></label>
                </div>
                <label>Summary<textarea name="summary" rows={2} placeholder="What happens here" /></label>
                <label>Content<textarea name="content" rows={6} placeholder="Scene text with references like @character:jack-vespers" /></label>
                <label>Notes<textarea name="notes" rows={2} placeholder="Editorial notes" /></label>
                <div className="form-grid-two">
                  <label>Characters<textarea name="characters_json" rows={3} placeholder="Jack Vespers&#10;Mira Sol" /></label>
                  <label>Tags<textarea name="tags_json" rows={3} placeholder="noir&#10;setup" /></label>
                </div>
                <div className="form-grid-two">
                  <label>Status
                    <select name="status" defaultValue="active">
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <label>Order<input name="order_index" type="number" defaultValue={0} /></label>
                </div>
                <button className="button button-primary" type="submit">Create scene</button>
              </form>
            </div>
          </div>
        </Card>

        <Card>
          {selectedScene ? (
            <div className="editor-stack story-editor">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Selected scene</p>
                  <h4>{selectedScene.title}</h4>
                </div>
                <div className="project-actions">
                  <button className="button" type="button" onClick={() => sceneDeleteMutation.mutate(selectedScene.id)}>Delete</button>
                </div>
              </div>

              <form key={selectedScene.id} className="form-grid" onSubmit={(event) => handleSceneUpdate(event, selectedScene)}>
                <div className="form-grid-two">
                  <label>Title<input name="title" defaultValue={selectedScene.title} /></label>
                  <label>Slug<input name="slug" defaultValue={selectedScene.slug} /></label>
                </div>
                <div className="form-grid-two">
                  <label>Type<input name="scene_type" defaultValue={selectedScene.scene_type} /></label>
                  <label>Location<input name="location" defaultValue={selectedScene.location} /></label>
                </div>
                <label>Summary<textarea name="summary" rows={3} defaultValue={selectedScene.summary} /></label>
                <label>Content<textarea name="content" rows={8} defaultValue={selectedScene.content} /></label>
                <label>Notes<textarea name="notes" rows={3} defaultValue={selectedScene.notes} /></label>
                <div className="form-grid-two">
                  <label>Characters<textarea name="characters_json" rows={3} defaultValue={selectedScene.characters_json.join("\n")} /></label>
                  <label>Tags<textarea name="tags_json" rows={3} defaultValue={selectedScene.tags_json.join("\n")} /></label>
                </div>
                <div className="form-grid-two">
                  <label>Status
                    <select name="status" defaultValue={selectedScene.status}>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <label>Order<input name="order_index" type="number" defaultValue={selectedScene.order_index} /></label>
                </div>
                <button className="button button-primary" type="submit">Save scene</button>
              </form>

              <div className="story-summary-grid">
                <Card>
                  <div className="section-head">
                    <div><p className="eyebrow">References</p><h4>{selectedSceneReferences.length} linked references</h4></div>
                  </div>
                  <div className="reference-list">
                    {selectedSceneReferences.length ? selectedSceneReferences.map((reference) => <ReferenceChip key={reference.id} reference={reference} />) : <p className="muted">No references resolved for this scene.</p>}
                  </div>
                </Card>

                <Card>
                  <div className="section-head">
                    <div><p className="eyebrow">Suggestions</p><h4>Reference palette</h4></div>
                  </div>
                  <div className="reference-list">
                    {suggestionQuery.data?.length ? suggestionQuery.data.map((suggestion) => <SuggestionCard key={`${suggestion.kind}-${suggestion.slug}`} suggestion={suggestion} />) : <p className="muted">Search a reference prefix to populate suggestions.</p>}
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <p className="muted">Select a scene to edit text, metadata, and references.</p>
          )}
        </Card>
      </div>

      <div className="story-columns">
        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Warnings</p>
              <h4>Orphan references</h4>
            </div>
          </div>
          <div className="reference-list">
            {orphanRefs.length ? orphanRefs.map((item) => <ReferenceChip key={item.reference.id} reference={item.reference} />) : <p className="muted">No orphan references detected.</p>}
          </div>
        </Card>

        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Quick status</p>
              <h4>Story health</h4>
            </div>
          </div>
          <p className="muted">
            References are parsed from scene text using `@type:slug` tokens. Chapter and scene changes stay
            localized to the selected tome and chapter so the editor remains easy to navigate.
          </p>
          <div className="story-summary-grid compact-stats">
            <div className="story-stat"><strong>{tomes.length}</strong><span>Tomes</span></div>
            <div className="story-stat"><strong>{chapters.length}</strong><span>Chapters</span></div>
            <div className="story-stat"><strong>{scenes.length}</strong><span>Scenes</span></div>
            <div className="story-stat"><strong>{orphanRefs.length}</strong><span>Orphans</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
