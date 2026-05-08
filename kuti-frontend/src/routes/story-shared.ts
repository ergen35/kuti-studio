import type { GenerationMode, GenerationSourceKind } from "@/api/client";

export function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export function normalizeJsonList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseOrder(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseStatus(value: FormDataEntryValue | null) {
  const candidate = String(value ?? "active");
  return candidate === "draft" || candidate === "archived" ? candidate : "active";
}

export function slugHint(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

export function generationSearch(
  projectId: string,
  options: {
    sourceKind: GenerationSourceKind;
    sourceId: string;
    mode?: GenerationMode;
  },
) {
  const params = new URLSearchParams();
  params.set("sourceKind", options.sourceKind);
  params.set("sourceId", options.sourceId);
  params.set("mode", options.mode ?? (options.sourceKind === "scene" ? "separate" : "grid"));
  return `/projects/${projectId}/generation?${params.toString()}`;
}

export function replaceSearchParams(
  params: URLSearchParams,
  mutator: (next: URLSearchParams) => void,
  setSearchParams: (nextInit: URLSearchParams, options?: { replace?: boolean }) => void,
) {
  const next = new URLSearchParams(params);
  mutator(next);
  setSearchParams(next, { replace: true });
}
