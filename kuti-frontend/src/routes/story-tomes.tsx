import type { FormEvent } from "react";

import { useEffect, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { createTome, deleteTome, getStory, updateTome, type TomeRead } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";
import { normalizeText, parseOrder, parseStatus, replaceSearchParams, slugHint } from "@/routes/story-shared";

function TomeItem({ tome, selected, onSelect }: { tome: TomeRead; selected: boolean; onSelect: (id: string) => void }) {
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

export function StoryTomesRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTomeId = searchParams.get("tomeId");

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

  useEffect(() => {
    if (!tomes.length) {
      replaceSearchParams(searchParams, (params) => {
        params.delete("tomeId");
      }, setSearchParams);
      return;
    }

    if (!selectedTomeId || !tomes.some((item) => item.id === selectedTomeId)) {
      replaceSearchParams(searchParams, (params) => {
        params.set("tomeId", tomes[0].id);
      }, setSearchParams);
    }
  }, [searchParams, selectedTomeId, setSearchParams, tomes]);

  const refreshStory = async () => {
    await queryClient.invalidateQueries({ queryKey: ["story", projectId] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createTome>[1]) => createTome(projectId ?? "", payload),
    onSuccess: async (created) => {
      await refreshStory();
      replaceSearchParams(searchParams, (params) => {
        params.set("tomeId", created.id);
      }, setSearchParams);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateTome>[2] }) => updateTome(projectId ?? "", id, payload),
    onSuccess: refreshStory,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTome(projectId ?? "", id),
    onSuccess: async () => {
      await refreshStory();
      replaceSearchParams(searchParams, (params) => {
        params.delete("tomeId");
      }, setSearchParams);
    },
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = normalizeText(formData.get("title"));
    if (!title) return;

    createMutation.mutate({
      title,
      slug: normalizeText(formData.get("slug")) || null,
      synopsis: normalizeText(formData.get("synopsis")),
      status: parseStatus(formData.get("status")),
      order_index: parseOrder(formData.get("order_index")),
    });
    event.currentTarget.reset();
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>, tome: TomeRead) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateMutation.mutate({
      id: tome.id,
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
    <div className="page-stack story-screen story-tomes">
      <div className="hero story-hero">
        <div>
          <p className="eyebrow">{t("storyTomes")}</p>
          <h3>{t("storyTomesIntro")}</h3>
          <p className="muted max-width">Volumes are edited on their own screen so structure stays readable.</p>
        </div>
        <Card className="hero-card">
          <span className="status-dot" />
          <strong>{tomes.length} tomes</strong>
          <p>{chapters.length} chapters attached across the current story.</p>
        </Card>
      </div>

      <div className="story-toolbar">
        <Link to={`/projects/${projectId}/story`} className="button button-secondary">
          {t("backToStoryHub")}
        </Link>
        <div className="project-actions">
          <Link to={`/projects/${projectId}/story/chapters`} className="button button-secondary">
            {t("storyChapters")}
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
              <p className="eyebrow">{t("storyTomes")}</p>
              <h4>Volume list</h4>
            </div>
          </div>

          <div className="story-list">
            {tomes.length ? (
              tomes.map((tome) => (
                <TomeItem key={tome.id} tome={tome} selected={tome.id === selectedTome?.id} onSelect={(id) => replaceSearchParams(searchParams, (params) => params.set("tomeId", id), setSearchParams)} />
              ))
            ) : (
              <p className="muted">No tomes yet. Create the first one below.</p>
            )}
          </div>

          <div className="divider" />

          <form className="form-grid" onSubmit={handleCreate}>
            <div className="form-head">
              <div>
                <p className="eyebrow">{t("createTome")}</p>
                <h4>New volume</h4>
              </div>
            </div>
            <Input name="title" placeholder="Volume One" required />
            <Input name="slug" placeholder={slugHint("Volume One")} />
            <Textarea name="synopsis" rows={4} placeholder="High-level story arc" />
            <div className="form-grid-two">
              <Select name="status" defaultValue="active">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </Select>
              <Input name="order_index" type="number" defaultValue={0} />
            </div>
            <Button variant="primary" type="submit">
              {t("createTome")}
            </Button>
          </form>
        </Card>

        <Card>
          {selectedTome ? (
            <div className="editor-stack">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Selected tome</p>
                  <h4>{selectedTome.title}</h4>
                </div>
                <Badge>{selectedTome.status}</Badge>
              </div>

              <div className="story-summary-grid">
                <div className="story-stat">
                  <strong>{selectedTome.slug}</strong>
                  <span>Slug</span>
                </div>
                <div className="story-stat">
                  <strong>{chapters.filter((chapter) => chapter.tome_id === selectedTome.id).length}</strong>
                  <span>Chapters</span>
                </div>
                <div className="story-stat">
                  <strong>#{selectedTome.order_index}</strong>
                  <span>Order</span>
                </div>
                <div className="story-stat">
                  <strong>{selectedTome.synopsis ? "Filled" : "Empty"}</strong>
                  <span>Synopsis</span>
                </div>
              </div>

              <form className="form-grid" onSubmit={(event) => handleUpdate(event, selectedTome)}>
                <Input name="title" defaultValue={selectedTome.title} />
                <Input name="slug" defaultValue={selectedTome.slug} />
                <Textarea name="synopsis" rows={4} defaultValue={selectedTome.synopsis} />
                <div className="form-grid-two">
                  <Select name="status" defaultValue={selectedTome.status}>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </Select>
                  <Input name="order_index" type="number" defaultValue={selectedTome.order_index} />
                </div>
                <div className="project-actions">
                  <Button variant="primary" type="submit">{t("saveTome")}</Button>
                  <Button variant="ghost" type="button" onClick={() => deleteMutation.mutate(selectedTome.id)}>
                    Delete
                  </Button>
                  <Link to={`/projects/${projectId}/story/chapters?tomeId=${selectedTome.id}`} className="button button-secondary">
                    {t("storyChapters")}
                  </Link>
                </div>
              </form>
            </div>
          ) : (
            <p className="muted">Select a tome to edit it.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
