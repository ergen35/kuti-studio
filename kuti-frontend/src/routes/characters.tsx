import type { FormEvent } from "react";

import { useEffect, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";

import {
  archiveCharacter,
  createCharacter,
  createCharacterRelation,
  createVoiceSample,
  deleteCharacter,
  deleteCharacterRelation,
  duplicateCharacter,
  getCharacter,
  listCharacters,
  updateCharacter,
  type CharacterRead,
  type CharacterRelationRead,
  type VoiceSampleRead,
} from "@/api/client";
import { Card } from "@/components/ui/card";

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(values: string[]) {
  return values.join("\n");
}

function CharacterListItem({
  character,
  selected,
  onSelect,
}: {
  character: CharacterRead;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={`character-item ${selected ? "is-selected" : ""}`}
      onClick={() => onSelect(character.id)}
    >
      <div>
        <p className="eyebrow">{character.status}</p>
        <h4>{character.name}</h4>
        <p className="muted">{character.narrative_role ?? "No narrative role yet"}</p>
      </div>
      <div className="character-meta">
        <span>{character.alias ?? "No alias"}</span>
        <span>{character.tags_json.slice(0, 3).join(" · ") || "Unlabeled"}</span>
      </div>
    </button>
  );
}

function RelationListItem({ relation }: { relation: CharacterRelationRead }) {
  return (
    <article className="mini-card">
      <div>
        <p className="eyebrow">{relation.relation_type}</p>
        <strong>{relation.strength}/100</strong>
      </div>
      <p className="muted">{relation.narrative_dependency || relation.notes || "No notes yet."}</p>
    </article>
  );
}

function VoiceSampleListItem({ sample }: { sample: VoiceSampleRead }) {
  return (
    <article className="mini-card">
      <div>
        <p className="eyebrow">Voice sample</p>
        <strong>{sample.label}</strong>
      </div>
      <p className="muted">{sample.voice_notes || sample.asset_path || "No notes yet."}</p>
    </article>
  );
}

export function CharactersRoute() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const charactersQuery = useQuery({
    queryKey: ["characters", projectId],
    queryFn: () => listCharacters(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const selectedCharacterId = searchParams.get("characterId");
  const selectedCharacter = useMemo(() => {
    const items = charactersQuery.data?.items ?? [];
    if (!items.length) {
      return null;
    }
    return items.find((character) => character.id === selectedCharacterId) ?? items[0];
  }, [charactersQuery.data?.items, selectedCharacterId]);

  useEffect(() => {
    if (!selectedCharacterId && selectedCharacter?.id) {
      setSearchParams({ characterId: selectedCharacter.id }, { replace: true });
    }
  }, [selectedCharacter?.id, selectedCharacterId, setSearchParams]);

  const detailQuery = useQuery({
    queryKey: ["character", projectId, selectedCharacter?.id],
    queryFn: () => getCharacter(projectId ?? "", selectedCharacter?.id ?? ""),
    enabled: Boolean(projectId && selectedCharacter?.id),
  });

  const refreshCharacters = async () => {
    await queryClient.invalidateQueries({ queryKey: ["characters", projectId] });
    await queryClient.invalidateQueries({ queryKey: ["character", projectId, selectedCharacter?.id] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createCharacter>[1]) => createCharacter(projectId ?? "", payload),
    onSuccess: async (created) => {
      await refreshCharacters();
      setSearchParams({ characterId: created.id });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateCharacter>[2]) =>
      updateCharacter(projectId ?? "", selectedCharacter?.id ?? "", payload),
    onSuccess: refreshCharacters,
  });

  const duplicateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof duplicateCharacter>[2]) =>
      duplicateCharacter(projectId ?? "", selectedCharacter?.id ?? "", payload),
    onSuccess: async (created) => {
      await refreshCharacters();
      setSearchParams({ characterId: created.id });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveCharacter(projectId ?? "", selectedCharacter?.id ?? ""),
    onSuccess: refreshCharacters,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCharacter(projectId ?? "", selectedCharacter?.id ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["characters", projectId] });
      setSearchParams({});
    },
  });

  const relationMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createCharacterRelation>[2]) =>
      createCharacterRelation(projectId ?? "", selectedCharacter?.id ?? "", payload),
    onSuccess: refreshCharacters,
  });

  const deleteRelationMutation = useMutation({
    mutationFn: (relationId: string) => deleteCharacterRelation(projectId ?? "", selectedCharacter?.id ?? "", relationId),
    onSuccess: refreshCharacters,
  });

  const voiceMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createVoiceSample>[2]) =>
      createVoiceSample(projectId ?? "", selectedCharacter?.id ?? "", payload),
    onSuccess: refreshCharacters,
  });

  const selectedCharacterData = detailQuery.data;
  const allCharacters = charactersQuery.data?.items ?? [];
  const relationTargets = allCharacters.filter((character) => character.id !== selectedCharacter?.id);

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    if (!name) {
      return;
    }

    createMutation.mutate({
      name,
      alias: String(formData.get("alias") ?? "").trim() || null,
      narrative_role: String(formData.get("narrative_role") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim(),
      physical_description: String(formData.get("physical_description") ?? "").trim(),
      color_palette_json: splitLines(String(formData.get("color_palette_json") ?? "")),
      costume_elements_json: splitLines(String(formData.get("costume_elements_json") ?? "")),
      key_traits_json: splitLines(String(formData.get("key_traits_json") ?? "")),
      personality: String(formData.get("personality") ?? "").trim(),
      narrative_arc: String(formData.get("narrative_arc") ?? "").trim(),
      tags_json: splitLines(String(formData.get("tags_json") ?? "")),
    });

    event.currentTarget.reset();
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCharacter?.id) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    updateMutation.mutate({
      name: String(formData.get("name") ?? "").trim(),
      alias: String(formData.get("alias") ?? "").trim() || null,
      narrative_role: String(formData.get("narrative_role") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim(),
      physical_description: String(formData.get("physical_description") ?? "").trim(),
      color_palette_json: splitLines(String(formData.get("color_palette_json") ?? "")),
      costume_elements_json: splitLines(String(formData.get("costume_elements_json") ?? "")),
      key_traits_json: splitLines(String(formData.get("key_traits_json") ?? "")),
      personality: String(formData.get("personality") ?? "").trim(),
      narrative_arc: String(formData.get("narrative_arc") ?? "").trim(),
      tags_json: splitLines(String(formData.get("tags_json") ?? "")),
      status: String(formData.get("status") ?? selectedCharacter.status).trim(),
    });
  };

  const handleRelationCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCharacter?.id) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const targetCharacterId = String(formData.get("target_character_id") ?? "").trim();
    const relationType = String(formData.get("relation_type") ?? "").trim();
    if (!targetCharacterId || !relationType) {
      return;
    }

    relationMutation.mutate({
      source_character_id: selectedCharacter.id,
      target_character_id: targetCharacterId,
      relation_type: relationType,
      strength: Number(formData.get("strength") ?? 50),
      narrative_dependency: String(formData.get("narrative_dependency") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
    });

    event.currentTarget.reset();
  };

  const handleVoiceCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCharacter?.id) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const label = String(formData.get("label") ?? "").trim();
    if (!label) {
      return;
    }

    voiceMutation.mutate({
      label,
      asset_path: String(formData.get("asset_path") ?? "").trim() || null,
      voice_notes: String(formData.get("voice_notes") ?? "").trim(),
    });

    event.currentTarget.reset();
  };

  if (!projectId) {
    return <p className="muted">Missing project id.</p>;
  }

  return (
    <div className="page-stack character-page">
      <div className="hero character-hero">
        <div>
          <p className="eyebrow">Phase 2</p>
          <h3>Character design cockpit</h3>
          <p className="muted max-width">
            Shape cast members, define their visual language, and anchor story
            relationships inside the local project workspace.
          </p>
        </div>
        <div className="hero-card">
          <span className="status-dot" />
          <strong>{allCharacters.length} characters</strong>
          <p>{selectedCharacterData?.relations.length ?? 0} relations and {selectedCharacterData?.voice_samples.length ?? 0} voice samples on the current character.</p>
        </div>
      </div>

      <div className="character-layout">
        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Cast</p>
              <h4>Characters</h4>
            </div>
            <Link to={`/projects/${projectId}`} className="button button-secondary">
              Back to dashboard
            </Link>
          </div>

          <div className="character-list">
            {charactersQuery.data?.items.length ? (
              charactersQuery.data.items.map((character) => (
                <CharacterListItem
                  key={character.id}
                  character={character}
                  selected={character.id === selectedCharacter?.id}
                  onSelect={(id) => setSearchParams({ characterId: id })}
                />
              ))
            ) : (
              <p className="muted">No characters yet. Create the first cast member below.</p>
            )}
          </div>

          <div className="divider" />

          <form className="form-grid" onSubmit={handleCreate}>
            <div className="form-head">
              <p className="eyebrow">Create character</p>
              <h4>New cast member</h4>
            </div>
            <label>
              Name
              <input name="name" placeholder="Mara Vale" />
            </label>
            <label>
              Alias
              <input name="alias" placeholder="The Ash Rider" />
            </label>
            <label>
              Narrative role
              <input name="narrative_role" placeholder="antagonist" />
            </label>
            <label>
              Description
              <textarea name="description" rows={3} placeholder="Short character overview" />
            </label>
            <label>
              Physical description
              <textarea name="physical_description" rows={3} placeholder="Visual silhouette and features" />
            </label>
            <div className="form-grid-two">
              <label>
                Color palette
                <textarea name="color_palette_json" rows={3} placeholder="#121212&#10;#c28d52" />
              </label>
              <label>
                Costume elements
                <textarea name="costume_elements_json" rows={3} placeholder="long coat&#10;wide collar" />
              </label>
            </div>
            <div className="form-grid-two">
              <label>
                Key traits
                <textarea name="key_traits_json" rows={3} placeholder="steady&#10;sharp-eyed" />
              </label>
              <label>
                Tags
                <textarea name="tags_json" rows={3} placeholder="noir&#10;lead" />
              </label>
            </div>
            <label>
              Personality
              <textarea name="personality" rows={3} placeholder="How they speak and react" />
            </label>
            <label>
              Narrative arc
              <textarea name="narrative_arc" rows={3} placeholder="Where they begin and where they go" />
            </label>
            <button className="button button-primary" type="submit">
              Create character
            </button>
          </form>
        </Card>

        <Card>
          {selectedCharacterData ? (
            <div className="editor-stack">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Selected character</p>
                  <h4>{selectedCharacterData.name}</h4>
                </div>
                <div className="project-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => duplicateMutation.mutate({ name: `${selectedCharacterData.name} Copy` })}
                  >
                    Duplicate
                  </button>
                  <button className="button button-ghost" type="button" onClick={() => archiveMutation.mutate()}>
                    Archive
                  </button>
                  <button className="button button-ghost" type="button" onClick={() => deleteMutation.mutate()}>
                    Delete
                  </button>
                </div>
              </div>

              <form key={selectedCharacterData.id} className="form-grid" onSubmit={handleUpdate}>
                <div className="form-grid-two">
                  <label>
                    Name
                    <input name="name" defaultValue={selectedCharacterData.name} />
                  </label>
                  <label>
                    Alias
                    <input name="alias" defaultValue={selectedCharacterData.alias ?? ""} />
                  </label>
                </div>
                <div className="form-grid-two">
                  <label>
                    Narrative role
                    <input name="narrative_role" defaultValue={selectedCharacterData.narrative_role ?? ""} />
                  </label>
                  <label>
                    Status
                    <input name="status" defaultValue={selectedCharacterData.status} />
                  </label>
                </div>
                <label>
                  Description
                  <textarea name="description" rows={4} defaultValue={selectedCharacterData.description} />
                </label>
                <label>
                  Physical description
                  <textarea
                    name="physical_description"
                    rows={4}
                    defaultValue={selectedCharacterData.physical_description}
                  />
                </label>
                <div className="form-grid-two">
                  <label>
                    Color palette
                    <textarea
                      name="color_palette_json"
                      rows={4}
                      defaultValue={joinLines(selectedCharacterData.color_palette_json)}
                    />
                  </label>
                  <label>
                    Costume elements
                    <textarea
                      name="costume_elements_json"
                      rows={4}
                      defaultValue={joinLines(selectedCharacterData.costume_elements_json)}
                    />
                  </label>
                </div>
                <div className="form-grid-two">
                  <label>
                    Key traits
                    <textarea
                      name="key_traits_json"
                      rows={4}
                      defaultValue={joinLines(selectedCharacterData.key_traits_json)}
                    />
                  </label>
                  <label>
                    Tags
                    <textarea name="tags_json" rows={4} defaultValue={joinLines(selectedCharacterData.tags_json)} />
                  </label>
                </div>
                <label>
                  Personality
                  <textarea name="personality" rows={4} defaultValue={selectedCharacterData.personality} />
                </label>
                <label>
                  Narrative arc
                  <textarea name="narrative_arc" rows={4} defaultValue={selectedCharacterData.narrative_arc} />
                </label>
                <button className="button button-primary" type="submit">
                  Save character
                </button>
              </form>

              <div className="detail-grid">
                <Card>
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Relations</p>
                      <h4>{selectedCharacterData.relationships_summary ?? "Relationship map"}</h4>
                    </div>
                  </div>

                  <div className="mini-list">
                    {selectedCharacterData.relations.length ? (
                      selectedCharacterData.relations.map((relation) => (
                        <div key={relation.id} className="stacked-card">
                          <RelationListItem relation={relation} />
                          <button
                            className="button button-ghost align-start"
                            type="button"
                            onClick={() => deleteRelationMutation.mutate(relation.id)}
                          >
                            Remove relation
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="muted">No relations yet.</p>
                    )}
                  </div>

                  <form className="form-grid relation-form" onSubmit={handleRelationCreate}>
                    <label>
                      Target character
                      <select name="target_character_id" defaultValue="">
                        <option value="" disabled>
                          Choose a character
                        </option>
                        {relationTargets.map((character) => (
                          <option key={character.id} value={character.id}>
                            {character.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Relation type
                      <input name="relation_type" placeholder="rival" />
                    </label>
                    <label>
                      Strength
                      <input name="strength" type="number" min={0} max={100} defaultValue={50} />
                    </label>
                    <label>
                      Narrative dependency
                      <textarea name="narrative_dependency" rows={3} placeholder="How the relation affects the plot" />
                    </label>
                    <label>
                      Notes
                      <textarea name="notes" rows={3} placeholder="Scene details or reminders" />
                    </label>
                    <button className="button" type="submit">
                      Add relation
                    </button>
                  </form>
                </Card>

                <Card>
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Voice</p>
                      <h4>Samples</h4>
                    </div>
                  </div>

                  <div className="mini-list">
                    {selectedCharacterData.voice_samples.length ? (
                      selectedCharacterData.voice_samples.map((sample) => (
                        <VoiceSampleListItem key={sample.id} sample={sample} />
                      ))
                    ) : (
                      <p className="muted">No voice samples yet.</p>
                    )}
                  </div>

                  <form className="form-grid voice-form" onSubmit={handleVoiceCreate}>
                    <label>
                      Label
                      <input name="label" placeholder="calm low register" />
                    </label>
                    <label>
                      Asset path
                      <input name="asset_path" placeholder="assets/audio/jack-01.wav" />
                    </label>
                    <label>
                      Voice notes
                      <textarea name="voice_notes" rows={4} placeholder="Breathy pacing with a dry edge." />
                    </label>
                    <button className="button" type="submit">
                      Add sample
                    </button>
                  </form>
                </Card>
              </div>
            </div>
          ) : (
            <p className="muted">Select a character to edit its profile, relations, and voice samples.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
