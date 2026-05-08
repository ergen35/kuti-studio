export type KutiConfig = {
  appName: string;
  appVersion: string;
  environment: string;
  locale: string;
  dataDir: string;
  projectDataDir: string;
  exportsDir: string;
  openapiUrl: string;
};

export type KutiHealth = {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  dataDir: string;
};

export type ProjectStatus = "draft" | "active" | "archived" | "maintenance";

export type ProjectRead = {
  id: string;
  name: string;
  slug: string;
  status: ProjectStatus;
  root_path: string;
  settings_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
  archived_at: string | null;
};

export type ProjectListResponse = {
  items: ProjectRead[];
};

export type ProjectCreateInput = {
  name: string;
  settings_json?: Record<string, unknown>;
  status?: ProjectStatus;
};

export type ProjectUpdateInput = {
  name?: string;
  settings_json?: Record<string, unknown>;
  status?: ProjectStatus;
};

export type ProjectCloneInput = {
  name?: string;
};

export type CharacterRead = {
  id: string;
  project_id: string;
  name: string;
  alias: string | null;
  narrative_role: string | null;
  description: string;
  physical_description: string;
  color_palette_json: string[];
  costume_elements_json: string[];
  key_traits_json: string[];
  personality: string;
  narrative_arc: string;
  tags_json: string[];
  status: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type CharacterDetail = CharacterRead & {
  relationships_summary: string | null;
  relations: CharacterRelationRead[];
  voice_samples: VoiceSampleRead[];
};

export type CharacterListResponse = {
  items: CharacterRead[];
};

export type CharacterCreateInput = {
  name: string;
  alias?: string | null;
  narrative_role?: string | null;
  description?: string;
  physical_description?: string;
  color_palette_json?: string[];
  costume_elements_json?: string[];
  key_traits_json?: string[];
  personality?: string;
  narrative_arc?: string;
  tags_json?: string[];
  status?: string;
};

export type CharacterUpdateInput = Partial<CharacterCreateInput>;

export type CharacterDuplicateInput = {
  name?: string;
};

export type CharacterRelationRead = {
  id: string;
  project_id: string;
  source_character_id: string;
  target_character_id: string;
  relation_type: string;
  strength: number;
  narrative_dependency: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type CharacterRelationCreateInput = {
  source_character_id: string;
  target_character_id: string;
  relation_type: string;
  strength?: number;
  narrative_dependency?: string;
  notes?: string;
};

export type CharacterRelationUpdateInput = {
  relation_type?: string;
  strength?: number;
  narrative_dependency?: string;
  notes?: string;
};

export type VoiceSampleRead = {
  id: string;
  project_id: string;
  character_id: string;
  asset_path: string | null;
  label: string;
  voice_notes: string;
  created_at: string;
};

export type VoiceSampleCreateInput = {
  label: string;
  asset_path?: string | null;
  voice_notes?: string;
};

const apiBaseUrl = import.meta.env.VITE_KUTI_API_URL ?? "http://localhost:8000";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function requestVoid(path: string, init: RequestInit): Promise<void> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
}

export function getConfig() {
  return request<KutiConfig>("/api/config");
}

export function getHealth() {
  return request<KutiHealth>("/api/health");
}

export function listProjects() {
  return request<ProjectListResponse>("/api/projects");
}

export function createProject(payload: ProjectCreateInput) {
  return requestJson<ProjectRead>("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getProject(projectId: string) {
  return request<ProjectRead>(`/api/projects/${projectId}`);
}

export function updateProject(projectId: string, payload: ProjectUpdateInput) {
  return requestJson<ProjectRead>(`/api/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveProject(projectId: string) {
  return requestJson<ProjectRead>(`/api/projects/${projectId}/archive`, {
    method: "POST",
  });
}

export function cloneProject(projectId: string, payload: ProjectCloneInput) {
  return requestJson<ProjectRead>(`/api/projects/${projectId}/clone`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function openProject(projectId: string) {
  return requestJson<ProjectRead>(`/api/projects/${projectId}/open`, {
    method: "POST",
  });
}

export function exportProject(projectId: string) {
  return request<Record<string, unknown>>(`/api/projects/${projectId}/export`);
}

export function listCharacters(projectId: string) {
  return request<CharacterListResponse>(`/api/projects/${projectId}/characters`);
}

export function getCharacter(projectId: string, characterId: string) {
  return request<CharacterDetail>(`/api/projects/${projectId}/characters/${characterId}`);
}

export function createCharacter(projectId: string, payload: CharacterCreateInput) {
  return requestJson<CharacterRead>(`/api/projects/${projectId}/characters`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCharacter(projectId: string, characterId: string, payload: CharacterUpdateInput) {
  return requestJson<CharacterRead>(`/api/projects/${projectId}/characters/${characterId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function duplicateCharacter(projectId: string, characterId: string, payload: CharacterDuplicateInput) {
  return requestJson<CharacterRead>(`/api/projects/${projectId}/characters/${characterId}/duplicate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function archiveCharacter(projectId: string, characterId: string) {
  return requestJson<CharacterRead>(`/api/projects/${projectId}/characters/${characterId}/archive`, {
    method: "POST",
  });
}

export function deleteCharacter(projectId: string, characterId: string) {
  return requestVoid(`/api/projects/${projectId}/characters/${characterId}`, {
    method: "DELETE",
  });
}

export function createCharacterRelation(projectId: string, characterId: string, payload: CharacterRelationCreateInput) {
  return requestJson<CharacterRelationRead>(`/api/projects/${projectId}/characters/${characterId}/relations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCharacterRelation(
  projectId: string,
  characterId: string,
  relationId: string,
  payload: CharacterRelationUpdateInput,
) {
  return requestJson<CharacterRelationRead>(
    `/api/projects/${projectId}/characters/${characterId}/relations/${relationId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteCharacterRelation(projectId: string, characterId: string, relationId: string) {
  return requestVoid(`/api/projects/${projectId}/characters/${characterId}/relations/${relationId}`, {
    method: "DELETE",
  });
}

export function createVoiceSample(projectId: string, characterId: string, payload: VoiceSampleCreateInput) {
  return requestJson<VoiceSampleRead>(`/api/projects/${projectId}/characters/${characterId}/voice-samples`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
