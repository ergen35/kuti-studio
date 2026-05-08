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

export type CharacterStatus = "active" | "draft" | "archived";

export type CharacterRead = {
  id: string;
  project_id: string;
  slug: string;
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
  status: CharacterStatus;
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
  status?: CharacterStatus;
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

export type StoryStatus = "active" | "draft" | "archived";

export type TomeRead = {
  id: string;
  project_id: string;
  title: string;
  slug: string;
  synopsis: string;
  status: StoryStatus;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type TomeCreateInput = {
  title: string;
  slug?: string | null;
  synopsis?: string;
  status?: StoryStatus;
  order_index?: number;
};

export type TomeUpdateInput = Partial<TomeCreateInput>;

export type ChapterRead = {
  id: string;
  project_id: string;
  tome_id: string;
  title: string;
  slug: string;
  synopsis: string;
  status: StoryStatus;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type ChapterCreateInput = {
  tome_id: string;
  title: string;
  slug?: string | null;
  synopsis?: string;
  status?: StoryStatus;
  order_index?: number;
};

export type ChapterUpdateInput = Partial<ChapterCreateInput>;

export type SceneRead = {
  id: string;
  project_id: string;
  tome_id: string;
  chapter_id: string;
  title: string;
  slug: string;
  scene_type: string;
  location: string;
  summary: string;
  content: string;
  notes: string;
  characters_json: string[];
  tags_json: string[];
  status: StoryStatus;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type SceneCreateInput = {
  tome_id: string;
  chapter_id: string;
  title: string;
  slug?: string | null;
  scene_type?: string;
  location?: string;
  summary?: string;
  content?: string;
  notes?: string;
  characters_json?: string[];
  tags_json?: string[];
  status?: StoryStatus;
  order_index?: number;
};

export type SceneUpdateInput = Partial<SceneCreateInput>;

export type StoryReferenceRead = {
  id: string;
  project_id: string;
  scene_id: string;
  reference_kind: string;
  target_slug: string;
  raw_token: string;
  created_at: string;
};

export type StorySuggestionRead = {
  kind: string;
  slug: string;
  title: string;
  label: string;
};

export type StoryOrphanReferenceRead = {
  reference: StoryReferenceRead;
  reason: string;
};

export type StorySummaryResponse = {
  tomes: TomeRead[];
  chapters: ChapterRead[];
  scenes: SceneRead[];
  orphan_references: StoryOrphanReferenceRead[];
};

export type AssetStatus = "active" | "archived";

export type AssetRead = {
  id: string;
  project_id: string;
  slug: string;
  name: string;
  original_filename: string;
  mime_type: string;
  checksum: string;
  size_bytes: number;
  storage_path: string;
  description: string;
  tags_json: string[];
  status: AssetStatus;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type AssetLinkRead = {
  id: string;
  project_id: string;
  asset_id: string;
  target_kind: string;
  target_id: string;
  note: string;
  created_at: string;
};

export type AssetDetail = AssetRead & {
  links: AssetLinkRead[];
};

export type AssetListResponse = {
  items: AssetRead[];
};

export type AssetImportInput = {
  source_path: string;
  name?: string | null;
  slug?: string | null;
  description?: string;
  tags_json?: string[];
  mime_type?: string | null;
};

export type AssetUpdateInput = {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  tags_json?: string[] | null;
  status?: AssetStatus | null;
};

export type AssetLinkCreateInput = {
  asset_id: string;
  target_kind: string;
  target_id: string;
  note?: string;
};

export type VersionRead = {
  id: string;
  project_id: string;
  branch_name: string;
  version_index: number;
  label: string;
  summary: string;
  created_at: string;
};

export type VersionBranchRead = {
  branch_name: string;
  version_count: number;
  latest_version_id: string | null;
  latest_created_at: string | null;
};

export type VersionCompareRequest = {
  left_version_id: string;
  right_version_id: string;
};

export type VersionCompareRead = {
  left: VersionRead;
  right: VersionRead;
  project_changes: string[];
  counts_delta: Record<string, number>;
};

export type VersionCreateInput = {
  branch_name?: string;
  label?: string;
  summary?: string;
};

export type VersionRestoreInput = {
  label?: string | null;
  summary?: string | null;
};

export type ExportKind = "work" | "publication";

export type ExportFormat = "json" | "tree" | "zip";

export type ExportStatus = "pending" | "ready" | "failed";

export type ExportRead = {
  id: string;
  project_id: string;
  kind: ExportKind;
  format: ExportFormat;
  status: ExportStatus;
  label: string;
  summary: string;
  artifact_path: string | null;
  artifact_name: string | null;
  metadata_json: Record<string, unknown>;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
};

export type ExportCreateInput = {
  kind?: ExportKind;
  format?: ExportFormat;
  label?: string | null;
  summary?: string;
};

export type WarningSeverity = "info" | "warning" | "critical";

export type WarningStatus = "open" | "ignored" | "resolved";

export type WarningKind = "missing_character_reference" | "invalid_location" | "timeline_incoherence" | "orphan_reference";

export type WarningRead = {
  id: string;
  project_id: string;
  fingerprint: string;
  kind: WarningKind;
  severity: WarningSeverity;
  status: WarningStatus;
  title: string;
  message: string;
  entity_kind: string;
  entity_id: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type WarningUpdateInput = {
  status: WarningStatus;
  note?: string | null;
};

export type WarningScanResponse = {
  items: WarningRead[];
};

export type GenerationSourceKind = "scene" | "chapter" | "tome" | "panel";

export type GenerationStrategy = "direct" | "intermediate";

export type GenerationMode = "grid" | "separate";

export type GenerationJobStatus = "pending" | "running" | "ready" | "validated" | "failed";

export type GenerationStepStatus = "pending" | "running" | "ready" | "failed";

export type GenerationBoardStatus = "draft" | "validated";

export type GenerationPanelStatus = "draft" | "selected" | "rejected" | "replaced";

export type ModelProviderRead = {
  key: string;
  kind: string;
  display_name: string;
  base_url: string | null;
  enabled: boolean;
  configured: boolean;
  has_api_key: boolean;
};

export type GenerationJobStepRead = {
  id: string;
  job_id: string;
  order_index: number;
  title: string;
  status: GenerationStepStatus;
  prompt: string;
  output_text: string;
  artifact_path: string | null;
  artifact_name: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
};

export type GenerationBoardPanelRead = {
  id: string;
  board_id: string;
  step_id: string | null;
  order_index: number;
  title: string;
  caption: string;
  prompt: string;
  status: GenerationPanelStatus;
  image_path: string;
  image_name: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type GenerationBoardRead = {
  id: string;
  project_id: string;
  job_id: string;
  source_kind: GenerationSourceKind;
  strategy: GenerationStrategy;
  title: string;
  summary: string;
  status: GenerationBoardStatus;
  artifact_path: string | null;
  artifact_name: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  validated_at: string | null;
  panels: GenerationBoardPanelRead[];
};

export type GenerationJobRead = {
  id: string;
  project_id: string;
  source_kind: GenerationSourceKind;
  source_id: string;
  source_label: string;
  source_version_id: string | null;
  strategy: GenerationStrategy;
  model_key: string | null;
  model_name: string | null;
  model_kind: string | null;
  entrypoint: string;
  title: string;
  prompt: string;
  summary: string;
  status: GenerationJobStatus;
  progress: number;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  steps: GenerationJobStepRead[];
  board: GenerationBoardRead | null;
};

export type GenerationJobCreateInput = {
  source_kind: GenerationSourceKind;
  source_id: string;
  source_version_id?: string | null;
  strategy?: GenerationStrategy;
  model_key?: string | null;
  mode?: GenerationMode;
  selection_ids?: string[];
  grid_rows?: number | null;
  grid_cols?: number | null;
  image_count?: number | null;
  title?: string | null;
  summary?: string;
};

export type GenerationBoardValidateInput = {
  note?: string | null;
};

export type GenerationPanelUpdateInput = {
  status?: GenerationPanelStatus | null;
  caption?: string | null;
  title?: string | null;
};

const apiBaseUrl = import.meta.env.VITE_KUTI_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function readApiError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (typeof payload.detail === "string" && payload.detail.trim()) {
      return new ApiError(payload.detail, response.status, payload.detail);
    }
  } catch {
    // fall through to status-based error
  }

  return new ApiError(`http_${response.status}`, response.status, `Request failed: ${response.status}`);
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw await readApiError(response);
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
    throw await readApiError(response);
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
    throw await readApiError(response);
  }
}

export function getConfig() {
  return request<KutiConfig>("/api/config");
}

export function getHealth() {
  return request<KutiHealth>("/api/health");
}

export function listModels() {
  return request<ModelProviderRead[]>("/api/models");
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

export function getStory(projectId: string) {
  return request<StorySummaryResponse>(`/api/projects/${projectId}/story`);
}

export function listStorySuggestions(projectId: string, query?: string) {
  const suffix = query ? `?query=${encodeURIComponent(query)}` : "";
  return request<StorySuggestionRead[]>(`/api/projects/${projectId}/story/suggestions${suffix}`);
}

export function createTome(projectId: string, payload: TomeCreateInput) {
  return requestJson<TomeRead>(`/api/projects/${projectId}/story/tomes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTome(projectId: string, tomeId: string, payload: TomeUpdateInput) {
  return requestJson<TomeRead>(`/api/projects/${projectId}/story/tomes/${tomeId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTome(projectId: string, tomeId: string) {
  return requestVoid(`/api/projects/${projectId}/story/tomes/${tomeId}`, { method: "DELETE" });
}

export function createChapter(projectId: string, payload: ChapterCreateInput) {
  return requestJson<ChapterRead>(`/api/projects/${projectId}/story/chapters`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateChapter(projectId: string, chapterId: string, payload: ChapterUpdateInput) {
  return requestJson<ChapterRead>(`/api/projects/${projectId}/story/chapters/${chapterId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteChapter(projectId: string, chapterId: string) {
  return requestVoid(`/api/projects/${projectId}/story/chapters/${chapterId}`, { method: "DELETE" });
}

export function createScene(projectId: string, payload: SceneCreateInput) {
  return requestJson<SceneRead>(`/api/projects/${projectId}/story/scenes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateScene(projectId: string, sceneId: string, payload: SceneUpdateInput) {
  return requestJson<SceneRead>(`/api/projects/${projectId}/story/scenes/${sceneId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteScene(projectId: string, sceneId: string) {
  return requestVoid(`/api/projects/${projectId}/story/scenes/${sceneId}`, { method: "DELETE" });
}

export function listStoryReferences(projectId: string, sceneId?: string) {
  const suffix = sceneId ? `?scene_id=${encodeURIComponent(sceneId)}` : "";
  return request<StoryReferenceRead[]>(`/api/projects/${projectId}/story/references${suffix}`);
}

export function listAssets(projectId: string) {
  return request<AssetListResponse>(`/api/projects/${projectId}/assets`);
}

export function getAsset(projectId: string, assetId: string) {
  return request<AssetDetail>(`/api/projects/${projectId}/assets/${assetId}`);
}

export function importAsset(projectId: string, payload: AssetImportInput) {
  return requestJson<AssetRead>(`/api/projects/${projectId}/assets/import`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAsset(projectId: string, assetId: string, payload: AssetUpdateInput) {
  return requestJson<AssetRead>(`/api/projects/${projectId}/assets/${assetId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveAsset(projectId: string, assetId: string) {
  return requestJson<AssetRead>(`/api/projects/${projectId}/assets/${assetId}/archive`, {
    method: "POST",
  });
}

export function deleteAsset(projectId: string, assetId: string) {
  return requestVoid(`/api/projects/${projectId}/assets/${assetId}`, { method: "DELETE" });
}

export function listAssetLinks(projectId: string, assetId: string) {
  return request<AssetLinkRead[]>(`/api/projects/${projectId}/assets/${assetId}/links`);
}

export function createAssetLink(projectId: string, assetId: string, payload: AssetLinkCreateInput) {
  return requestJson<AssetLinkRead>(`/api/projects/${projectId}/assets/${assetId}/links`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteAssetLink(projectId: string, assetId: string, linkId: string) {
  return requestVoid(`/api/projects/${projectId}/assets/${assetId}/links/${linkId}`, { method: "DELETE" });
}

export function listVersions(projectId: string) {
  return request<VersionRead[]>(`/api/projects/${projectId}/versions`);
}

export function listVersionBranches(projectId: string) {
  return request<VersionBranchRead[]>(`/api/projects/${projectId}/versions/branches`);
}

export function createVersion(projectId: string, payload: VersionCreateInput) {
  return requestJson<VersionRead>(`/api/projects/${projectId}/versions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function compareVersions(projectId: string, payload: VersionCompareRequest) {
  return requestJson<VersionCompareRead>(`/api/projects/${projectId}/versions/compare`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function restoreVersion(projectId: string, versionId: string, payload?: VersionRestoreInput) {
  return requestJson<VersionRead>(`/api/projects/${projectId}/versions/${versionId}/restore`, {
    method: "POST",
    body: payload ? JSON.stringify(payload) : JSON.stringify({}),
  });
}

export function listExports(projectId: string, params?: { kind?: ExportKind; format?: ExportFormat; status?: ExportStatus }) {
  const query = new URLSearchParams();
  if (params?.kind) query.set("kind", params.kind);
  if (params?.format) query.set("format", params.format);
  if (params?.status) query.set("status", params.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<ExportRead[]>(`/api/projects/${projectId}/exports${suffix}`);
}

export function createExport(projectId: string, payload: ExportCreateInput) {
  return requestJson<ExportRead>(`/api/projects/${projectId}/exports`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getExport(projectId: string, exportId: string) {
  return request<ExportRead>(`/api/projects/${projectId}/exports/${exportId}`);
}

export function exportDownloadUrl(projectId: string, exportId: string) {
  return `${apiBaseUrl}/api/projects/${projectId}/exports/${exportId}/download`;
}

export function listWarnings(
  projectId: string,
  params?: { status?: WarningStatus; kind?: WarningKind; severity?: WarningSeverity },
) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.kind) query.set("kind", params.kind);
  if (params?.severity) query.set("severity", params.severity);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<WarningRead[]>(`/api/projects/${projectId}/warnings${suffix}`);
}

export function scanWarnings(projectId: string) {
  return requestJson<WarningScanResponse>(`/api/projects/${projectId}/warnings/scan`, {
    method: "POST",
  });
}

export function updateWarning(projectId: string, warningId: string, payload: WarningUpdateInput) {
  return requestJson<WarningRead>(`/api/projects/${projectId}/warnings/${warningId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listGenerationJobs(projectId: string) {
  return request<GenerationJobRead[]>(`/api/projects/${projectId}/generation/jobs`);
}

export function createGenerationJob(projectId: string, payload: GenerationJobCreateInput) {
  return requestJson<GenerationJobRead>(`/api/projects/${projectId}/generation/jobs`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getGenerationJob(projectId: string, jobId: string) {
  return request<GenerationJobRead>(`/api/projects/${projectId}/generation/jobs/${jobId}`);
}

export function listGenerationBoards(projectId: string) {
  return request<GenerationBoardRead[]>(`/api/projects/${projectId}/generation/boards`);
}

export function getGenerationBoard(projectId: string, boardId: string) {
  return request<GenerationBoardRead>(`/api/projects/${projectId}/generation/boards/${boardId}`);
}

export function validateGenerationBoard(projectId: string, boardId: string, payload?: GenerationBoardValidateInput) {
  return requestJson<GenerationBoardRead>(`/api/projects/${projectId}/generation/boards/${boardId}/validate`, {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  });
}

export function updateGenerationPanel(projectId: string, boardId: string, panelId: string, payload: GenerationPanelUpdateInput) {
  return requestJson<GenerationBoardPanelRead>(`/api/projects/${projectId}/generation/boards/${boardId}/panels/${panelId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function generationBoardDownloadUrl(projectId: string, boardId: string) {
  return `${apiBaseUrl}/api/projects/${projectId}/generation/boards/${boardId}/download`;
}

export function generationPanelImageUrl(projectId: string, boardId: string, panelId: string) {
  return `${apiBaseUrl}/api/projects/${projectId}/generation/boards/${boardId}/panels/${panelId}/image`;
}
