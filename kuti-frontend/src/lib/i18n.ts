import { useMemo } from "react";

import { useUIStore, type Locale } from "@/stores/ui";

type TranslationTable = Record<string, string>;

type ApiErrorLike = { code?: string; status?: number };

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
  loadingProject: "Loading project...",
  fetchingProjectMetadata: "Fetching project metadata from the local API.",
  queryingLocalApi: "Querying the local API...",
  missingProjectId: "Missing project id.",
  backendUnavailable: "Backend not reachable yet. Start kuti-backend on port 8000.",
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
  errorSettingsJsonInvalid: "Project settings must be valid JSON.",
  routeUnavailable: "Route unavailable",
  errorLabel: "Error",
  errorUnknown: "Something went wrong.",
  errorProjectNotFound: "Project not found.",
  errorCharacterNotFound: "Character not found.",
  errorCharacterNameConflict: "A character with that name already exists.",
  errorRelationNotFound: "Relation not found.",
  errorRelationSelfReference: "A character cannot reference itself.",
  errorRelationMissingCharacter: "One of the related characters is missing.",
  errorRelationConflict: "That relation already exists.",
  errorTomeNotFound: "Tome not found.",
  errorChapterNotFound: "Chapter not found.",
  errorChapterMissingTome: "The chapter does not belong to a valid tome.",
  errorSceneNotFound: "Scene not found.",
  errorSceneHierarchyMismatch: "Scene hierarchy does not match the selected tome and chapter.",
  errorAssetNotFound: "Asset not found.",
  errorAssetLinkNotFound: "Asset link not found.",
  errorAssetLinkTargetNotFound: "The linked asset target was not found.",
  errorGenerationProviderFailed: "Generation provider failed.",
  errorGenerationProviderInvalidResponse: "Generation provider returned an invalid response.",
  errorGenerationProviderNotImplemented: "Generation provider is not implemented.",
  errorGenerationSourceNotFound: "Generation source not found.",
  errorGenerationVersionNotFound: "Generation version not found.",
  errorGenerationBoardNotFound: "Generation board not found.",
  errorGenerationPanelNotFound: "Generation panel not found.",
  errorGenerationSourceKindInvalid: "Generation source kind is invalid.",
  errorModelNotConfigured: "Selected model is not configured.",
  errorModelNotFound: "Model not found.",
  errorModelDisabled: "Selected model is disabled.",
  errorModelMissingConfiguration: "Model configuration is missing.",
  errorModelKindMismatch: "Selected model cannot be used for this source.",
  errorModelNotImplemented: "Selected model is not implemented.",
  errorAssetSourceMissing: "Asset source file is missing.",
  errorAssetIdMustMatchRouteAsset: "Asset payload does not match the route asset.",
  errorSourceCharacterIdMustMatchRouteCharacter: "Source character does not match the route character.",
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
  loadingProject: "Chargement du projet...",
  fetchingProjectMetadata: "Recuperation des metadonnees du projet depuis l'API locale.",
  queryingLocalApi: "Interrogation de l'API locale...",
  missingProjectId: "Identifiant de projet manquant.",
  backendUnavailable: "Le backend est encore inaccessible. Demarrez kuti-backend sur le port 8000.",
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
  errorSettingsJsonInvalid: "Les parametres du projet doivent etre du JSON valide.",
  routeUnavailable: "Route indisponible",
  errorLabel: "Erreur",
  errorUnknown: "Une erreur est survenue.",
  errorProjectNotFound: "Projet introuvable.",
  errorCharacterNotFound: "Personnage introuvable.",
  errorCharacterNameConflict: "Un personnage avec ce nom existe deja.",
  errorRelationNotFound: "Relation introuvable.",
  errorRelationSelfReference: "Un personnage ne peut pas se referencer lui-meme.",
  errorRelationMissingCharacter: "Un des personnages relies est introuvable.",
  errorRelationConflict: "Cette relation existe deja.",
  errorTomeNotFound: "Tome introuvable.",
  errorChapterNotFound: "Chapitre introuvable.",
  errorChapterMissingTome: "Le chapitre ne correspond pas a un tome valide.",
  errorSceneNotFound: "Scene introuvable.",
  errorSceneHierarchyMismatch: "La hierarchy de la scene ne correspond pas au tome et au chapitre selectionnes.",
  errorAssetNotFound: "Asset introuvable.",
  errorAssetLinkNotFound: "Lien d'asset introuvable.",
  errorAssetLinkTargetNotFound: "La cible du lien d'asset est introuvable.",
  errorGenerationProviderFailed: "Le fournisseur de generation a echoue.",
  errorGenerationProviderInvalidResponse: "Le fournisseur de generation a renvoye une reponse invalide.",
  errorGenerationProviderNotImplemented: "Le fournisseur de generation n'est pas implante.",
  errorGenerationSourceNotFound: "La source de generation est introuvable.",
  errorGenerationVersionNotFound: "La version de generation est introuvable.",
  errorGenerationBoardNotFound: "Le board de generation est introuvable.",
  errorGenerationPanelNotFound: "Le panel de generation est introuvable.",
  errorGenerationSourceKindInvalid: "Le type de source de generation est invalide.",
  errorModelNotConfigured: "Le modele selectionne n'est pas configure.",
  errorModelNotFound: "Modele introuvable.",
  errorModelDisabled: "Le modele selectionne est desactive.",
  errorModelMissingConfiguration: "La configuration du modele est manquante.",
  errorModelKindMismatch: "Le modele selectionne ne peut pas etre utilise pour cette source.",
  errorModelNotImplemented: "Le modele selectionne n'est pas implemente.",
  errorAssetSourceMissing: "Le fichier source de l'asset est manquant.",
  errorAssetIdMustMatchRouteAsset: "La charge utile de l'asset ne correspond pas a la route.",
  errorSourceCharacterIdMustMatchRouteCharacter: "Le personnage source ne correspond pas a la route.",
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

export function formatApiError(locale: Locale, error: ApiErrorLike) {
  switch (error.code) {
    case "project_not_found":
      return translate(locale, "errorProjectNotFound");
    case "character_not_found":
      return translate(locale, "errorCharacterNotFound");
    case "character_name_conflict":
      return translate(locale, "errorCharacterNameConflict");
    case "relation_not_found":
      return translate(locale, "errorRelationNotFound");
    case "relation_self_reference":
      return translate(locale, "errorRelationSelfReference");
    case "relation_missing_character":
      return translate(locale, "errorRelationMissingCharacter");
    case "relation_conflict":
      return translate(locale, "errorRelationConflict");
    case "tome_not_found":
      return translate(locale, "errorTomeNotFound");
    case "chapter_not_found":
      return translate(locale, "errorChapterNotFound");
    case "chapter_missing_tome":
      return translate(locale, "errorChapterMissingTome");
    case "scene_not_found":
      return translate(locale, "errorSceneNotFound");
    case "scene_hierarchy_mismatch":
      return translate(locale, "errorSceneHierarchyMismatch");
    case "asset_not_found":
      return translate(locale, "errorAssetNotFound");
    case "asset_link_not_found":
      return translate(locale, "errorAssetLinkNotFound");
    case "asset_link_target_not_found":
      return translate(locale, "errorAssetLinkTargetNotFound");
    case "generation_provider_failed":
      return translate(locale, "errorGenerationProviderFailed");
    case "generation_provider_invalid_response":
      return translate(locale, "errorGenerationProviderInvalidResponse");
    case "generation_provider_not_implemented":
      return translate(locale, "errorGenerationProviderNotImplemented");
    case "generation_source_not_found":
      return translate(locale, "errorGenerationSourceNotFound");
    case "generation_version_not_found":
      return translate(locale, "errorGenerationVersionNotFound");
    case "generation_board_not_found":
      return translate(locale, "errorGenerationBoardNotFound");
    case "generation_panel_not_found":
      return translate(locale, "errorGenerationPanelNotFound");
    case "generation_source_kind_invalid":
      return translate(locale, "errorGenerationSourceKindInvalid");
    case "model_not_configured":
      return translate(locale, "errorModelNotConfigured");
    case "model_not_found":
      return translate(locale, "errorModelNotFound");
    case "model_disabled":
      return translate(locale, "errorModelDisabled");
    case "model_missing_configuration":
      return translate(locale, "errorModelMissingConfiguration");
    case "model_kind_mismatch":
      return translate(locale, "errorModelKindMismatch");
    case "model_not_implemented":
      return translate(locale, "errorModelNotImplemented");
    case "asset_source_missing":
      return translate(locale, "errorAssetSourceMissing");
    case "settings_json_invalid":
      return translate(locale, "errorSettingsJsonInvalid");
    case "asset_id_must_match_route_asset":
      return translate(locale, "errorAssetIdMustMatchRouteAsset");
    case "source_character_id_must_match_route_character":
      return translate(locale, "errorSourceCharacterIdMustMatchRouteCharacter");
    default:
      if (typeof error.status === "number") {
        return `${translate(locale, "errorLabel")}: ${error.status}`;
      }
      return translate(locale, "errorUnknown");
  }
}
