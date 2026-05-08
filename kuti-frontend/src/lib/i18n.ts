import { useMemo } from "react";

import { useUIStore, type Locale } from "@/stores/ui";

type TranslationTable = Record<string, string>;

const en: TranslationTable = {
  appTitle: "Kuti Studio",
  appTagline: "Local narrative production",
  appDescription: "Phase 0 scaffold: backend contract, UI shell, and project-wide context.",
  currentWorkspace: "Current workspace",
  workspaceTitle: "Project context pinned across routes",
  backendReady: "Backend contract ready",
  primaryNavigation: "Primary navigation",
  workspaceDescription: "Characters, assets, storyline, version history, and warnings all live inside a project context. Open a project dashboard to access the workspace.",
  projectHub: "Project Hub",
  projectDashboard: "Project Dashboard",
  assetsLibrary: "Assets Library",
  generationStudio: "Generation Studio",
  exports: "Exports",
  versioning: "Versioning",
  warnings: "Warnings",
  storyline: "Storyline",
  settings: "Project Settings",
  locale: "Locale",
  theme: "Theme",
  open: "Open",
  createProject: "Create project",
  backToDashboard: "Back to dashboard",
  loading: "Loading...",
  saving: "Saving...",
  generating: "Generating...",
  scanProject: "Scan project",
  clearFilters: "Clear filters",
  english: "English",
  french: "French",
  localizedUi: "English by default, French available.",
  homeHero: "Open, create, and manage local story projects.",
  homeIntro: "The first phase of Kuti Studio establishes the shell, the contract, and the project entry point. Projects will appear here once the local data model lands.",
  backendStatus: "Backend status",
  runtimeConfig: "Runtime config",
  availableProjects: "Available projects",
  noProjects: "No projects yet. Create the first project to initialize the local workspace.",
  projectOpen: "Open",
  clone: "Clone",
  archive: "Archive",
  markOpen: "Mark open",
  projectSummary: "Open the project for editing and dashboard tracking.",
  storage: "Storage",
  projectSettingsIntro: "Project preferences",
  saveSettings: "Save settings",
};

const fr: TranslationTable = {
  appTitle: "Kuti Studio",
  appTagline: "Production narrative locale",
  appDescription: "Socle de phase 0 : contrat backend, shell UI et contexte global du projet.",
  currentWorkspace: "Espace courant",
  workspaceTitle: "Contexte projet conserve sur toutes les routes",
  backendReady: "Contrat backend pret",
  primaryNavigation: "Navigation principale",
  workspaceDescription: "Les personnages, assets, la storyline, l'historique des versions et les avertissements vivent dans un contexte projet. Ouvrez le tableau de bord d'un projet pour acceder a l'espace de travail.",
  projectHub: "Hub projet",
  projectDashboard: "Tableau de bord projet",
  assetsLibrary: "Bibliotheque d'assets",
  generationStudio: "Studio de generation",
  exports: "Exports",
  versioning: "Versioning",
  warnings: "Avertissements",
  storyline: "Storyline",
  settings: "Parametres projet",
  locale: "Langue",
  theme: "Theme",
  open: "Ouvrir",
  createProject: "Creer le projet",
  backToDashboard: "Retour au tableau de bord",
  loading: "Chargement...",
  saving: "Enregistrement...",
  generating: "Generation...",
  scanProject: "Analyser le projet",
  clearFilters: "Effacer les filtres",
  english: "Anglais",
  french: "Francais",
  localizedUi: "Anglais par defaut, francais disponible.",
  homeHero: "Ouvrir, creer et gerer des projets narratifs locaux.",
  homeIntro: "La phase 0 de Kuti Studio pose le shell, le contrat et le point d'entree projet. Les projets apparaitront ici une fois le modele local en place.",
  backendStatus: "Etat du backend",
  runtimeConfig: "Configuration runtime",
  availableProjects: "Projets disponibles",
  noProjects: "Aucun projet pour le moment. Creez le premier projet pour initialiser l'espace local.",
  projectOpen: "Ouvrir",
  clone: "Dupliquer",
  archive: "Archiver",
  markOpen: "Marquer ouvert",
  projectSummary: "Ouvrez le projet pour l'edition et le suivi du tableau de bord.",
  storage: "Stockage",
  projectSettingsIntro: "Preferences projet",
  saveSettings: "Enregistrer les parametres",
};

const dictionaries: Record<Locale, TranslationTable> = { en, fr };

export function useLocale() {
  return useUIStore((state) => state.locale);
}

export function useT() {
  const locale = useLocale();
  return useMemo(() => {
    const dict = dictionaries[locale] ?? en;
    return (key: string) => dict[key] ?? en[key] ?? key;
  }, [locale]);
}

export function translate(locale: Locale, key: string) {
  return dictionaries[locale]?.[key] ?? en[key] ?? key;
}
