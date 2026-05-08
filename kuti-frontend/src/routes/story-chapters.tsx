import type { FormEvent } from "react";

import { useEffect, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { createChapter, deleteChapter, getStory, updateChapter, type ChapterRead } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";
import { normalizeText, parseOrder, parseStatus, replaceSearchParams, slugHint } from "@/routes/story-shared";

function ChapterItem({ chapter, selected, onSelect }: { chapter: ChapterRead; selected: boolean; onSelect: (id: string) => void }) {
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

export function StoryChaptersRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTomeId = searchParams.get("tomeId");
  const selectedChapterId = searchParams.get("chapterId");

  const storyQuery = useQuery({
    queryKey: ["story", projectId],
    queryFn: () => getStory(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const tomes = storyQuery.data?.tomes ?? [];
  const chapters = storyQuery.data?.chapters ?? [];

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

  useEffect(() => {
    if (!tomes.length) {
      replaceSearchParams(searchParams, (params) => {
        params.delete("tomeId");
        params.delete("chapterId");
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
      }, setSearchParams);
      return;
    }

    if (!selectedChapterId || !visibleChapters.some((item) => item.id === selectedChapterId)) {
      replaceSearchParams(searchParams, (params) => {
        params.set("chapterId", visibleChapters[0].id);
      }, setSearchParams);
    }
  }, [searchParams, selectedChapterId, selectedTome, setSearchParams, visibleChapters]);

  const refreshStory = async () => {
    await queryClient.invalidateQueries({ queryKey: ["story", projectId] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createChapter>[1]) => createChapter(projectId ?? "", payload),
    onSuccess: async (created) => {
      await refreshStory();
      replaceSearchParams(searchParams, (params) => {
        params.set("chapterId", created.id);
      }, setSearchParams);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateChapter>[2] }) => updateChapter(projectId ?? "", id, payload),
    onSuccess: refreshStory,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteChapter(projectId ?? "", id),
    onSuccess: async () => {
      await refreshStory();
      replaceSearchParams(searchParams, (params) => {
        params.delete("chapterId");
      }, setSearchParams);
    },
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTome) return;
    const formData = new FormData(event.currentTarget);
    const title = normalizeText(formData.get("title"));
    if (!title) return;

    createMutation.mutate({
      tome_id: selectedTome.id,
      title,
      slug: normalizeText(formData.get("slug")) || null,
      synopsis: normalizeText(formData.get("synopsis")),
      status: parseStatus(formData.get("status")),
      order_index: parseOrder(formData.get("order_index")),
    });
    event.currentTarget.reset();
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>, chapter: ChapterRead) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateMutation.mutate({
      id: chapter.id,
      payload: {
        title: normalizeText(formData.get("title")) || undefined,
        slug: normalizeText(formData.get("slug")) || undefined,
        synopsis: normalizeText(formData.get("synopsis")) || undefined,
        status: parseStatus(formData.get("status")),
        order_index: parseOrder(formData.get("order_index")),
      },
    });
  };

  if (!projectId) {
    return <p className="muted">{t("missingProjectId")}</p>;
  }

  return (
    <div className="page-stack story-screen story-chapters">
      <div className="hero story-hero">
        <div>
          <p className="eyebrow">{t("storyChapters")}</p>
          <h3>{t("storyChaptersIntro")}</h3>
          <p className="muted max-width">Chapters are edited in their own layer so tome context stays visible.</p>
        </div>
        <Card className="hero-card">
          <span className="status-dot" />
          <strong>{chapters.length} chapters</strong>
          <p>{tomes.length} tomes provide the parent structure.</p>
        </Card>
      </div>

      <div className="story-toolbar">
        <Link to={`/projects/${projectId}/story`} className="button button-secondary">
          {t("backToStoryHub")}
        </Link>
        <div className="project-actions">
          <Link to={`/projects/${projectId}/story/tomes`} className="button button-secondary">
            {t("storyTomes")}
          </Link>
          <Link to={`/projects/${projectId}/story/scenes`} className="button button-secondary">
            {t("storyScenes")}
          </Link>
        </div>
      </div>

      <div className="story-layout">
        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">{t("selectTome")}</p>
              <h4>Tome filter</h4>
            </div>
          </div>

          <div className="story-list">
            {tomes.length ? (
              tomes.map((tome) => (
                <button key={tome.id} type="button" className={`story-item ${tome.id === selectedTome?.id ? "is-selected" : ""}`} onClick={() => replaceSearchParams(searchParams, (params) => params.set("tomeId", tome.id), setSearchParams)}>
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
              <p className="muted">Create a tome first to unlock chapter editing.</p>
            )}
          </div>

          <div className="divider" />

          <div className="story-list">
            {visibleChapters.length ? (
              visibleChapters.map((chapter) => (
                <ChapterItem key={chapter.id} chapter={chapter} selected={chapter.id === selectedChapter?.id} onSelect={(id) => replaceSearchParams(searchParams, (params) => params.set("chapterId", id), setSearchParams)} />
              ))
            ) : (
              <p className="muted">No chapters in the selected tome yet.</p>
            )}
          </div>

          <div className="divider" />

          <form className="form-grid" onSubmit={handleCreate}>
            <div className="form-head">
              <div>
                <p className="eyebrow">{t("createChapter")}</p>
                <h4>New chapter</h4>
              </div>
            </div>
            <Input name="title" placeholder="Chapter One" required />
            <Input name="slug" placeholder={slugHint("Chapter One")} />
            <Textarea name="synopsis" rows={4} placeholder="Chapter summary" />
            <div className="form-grid-two">
              <Select name="status" defaultValue="active">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </Select>
              <Input name="order_index" type="number" defaultValue={0} />
            </div>
            <Button variant="primary" type="submit" disabled={!selectedTome}>
              {t("createChapter")}
            </Button>
          </form>
        </Card>

        <Card>
          {selectedChapter ? (
            <div className="editor-stack">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Selected chapter</p>
                  <h4>{selectedChapter.title}</h4>
                </div>
                <Badge>{selectedChapter.status}</Badge>
              </div>

              <div className="story-summary-grid">
                <div className="story-stat">
                  <strong>{selectedChapter.slug}</strong>
                  <span>Slug</span>
                </div>
                <div className="story-stat">
                  <strong>#{selectedChapter.order_index}</strong>
                  <span>Order</span>
                </div>
                <div className="story-stat">
                  <strong>{selectedTome?.title ?? "No tome"}</strong>
                  <span>Parent tome</span>
                </div>
                <div className="story-stat">
                  <strong>{selectedChapter.synopsis ? "Filled" : "Empty"}</strong>
                  <span>Synopsis</span>
                </div>
              </div>

              <form className="form-grid" onSubmit={(event) => handleUpdate(event, selectedChapter)}>
                <Input name="title" defaultValue={selectedChapter.title} />
                <Input name="slug" defaultValue={selectedChapter.slug} />
                <Textarea name="synopsis" rows={4} defaultValue={selectedChapter.synopsis} />
                <div className="form-grid-two">
                  <Select name="status" defaultValue={selectedChapter.status}>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </Select>
                  <Input name="order_index" type="number" defaultValue={selectedChapter.order_index} />
                </div>
                <div className="project-actions">
                  <Button variant="primary" type="submit">{t("saveChapter")}</Button>
                  <Button variant="ghost" type="button" onClick={() => deleteMutation.mutate(selectedChapter.id)}>
                    Delete
                  </Button>
                  <Link to={`/projects/${projectId}/story/scenes?tomeId=${selectedChapter.tome_id}&chapterId=${selectedChapter.id}`} className="button button-secondary">
                    {t("storyScenes")}
                  </Link>
                </div>
              </form>
            </div>
          ) : (
            <p className="muted">Select a chapter to edit it.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
