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
