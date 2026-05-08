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

const apiBaseUrl = import.meta.env.VITE_KUTI_API_URL ?? "http://localhost:8000";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Accept: "application/json",
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
