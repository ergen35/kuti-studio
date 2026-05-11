# Kuti Studio - Rapport d'Analyse Technique

**Date d'analyse** : Janvier 2025  
**Phase actuelle** : Phase 10 - Stabilisation, tests et polish  
**Statut MVP** : Fonctionnalités complètes, stabilisation en cours

---

## 1. Vue d'ensemble

Kuti Studio est une plateforme de production narrative local-first pour la création d'œuvres longues (bandes dessinées, manga, univers narratifs multimodaux). Le projet est composé de deux applications distinctes :

- **kuti-backend** : API FastAPI avec persistance SQLite
- **kuti-frontend** : Application React Router v7 avec TanStack Query et Zustand

Les phases 0 à 9 du plan d'implémentation sont complétées. Le projet entre dans la phase finale de stabilisation.

---

## 2. Architecture Backend

### 2.1 Stack Technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Runtime | Python | 3.12+ |
| Framework | FastAPI | ≥0.115 |
| Serveur | Uvicorn | ≥0.30 |
| ORM | SQLAlchemy | ≥2.0 |
| Migrations | Alembic | ≥1.13 |
| Validation | Pydantic | via FastAPI |
| Gestion dépendances | uv | latest |

### 2.2 Structure Modulaire

```
kuti-backend/src/kuti_backend/
├── api/
│   ├── main.py          # Factory FastAPI, CORS, routing
│   ├── routes.py        # Agrégation des routers
│   └── errors.py        # Gestion erreurs HTTP
├── core/
│   ├── database.py      # Connexion SQLite, sessions
│   ├── settings.py      # Configuration Pydantic
│   └── paths.py         # Résolution chemins kuti-data
├── projects/
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   ├── repository.py    # Data access layer
│   └── api.py           # FastAPI router
├── characters/          # Idem structure
├── story/               # Tomes, Chapters, Scenes, References
├── assets/              # Import, archivage, liens
├── versions/            # Branching, snapshots, restauration
├── warnings/            # Détection incohérences
├── exports/             # JSON, ZIP, Tree exports
└── generation/          # Jobs, boards, panels, providers
```

### 2.3 Modèles de Données

#### Tables principales

| Table | Description | Relations |
|-------|-------------|-----------|
| `projects` | Projets racine | → characters, tomes, assets, etc. |
| `characters` | Fiches personnages | → relations, voice_samples |
| `character_relations` | Liens entre personnages | character ↔ character |
| `voice_samples` | Échantillons audio | → character |
| `tomes` | Volumes narratifs | → chapters |
| `chapters` | Chapitres | → tome, scenes |
| `scenes` | Scènes narratives | → chapter, story_references |
| `story_references` | Références @type:slug | → scene |
| `assets` | Fichiers importés | → asset_links |
| `asset_links` | Liens assets ↔ entités | asset → entity |
| `versions` | Snapshots versionnés | → project |
| `warnings` | Alertes cohérence | → project, entity |
| `exports` | Journal exports | → project |
| `generation_jobs` | Jobs génération | → steps, board |
| `generation_job_steps` | Étapes détaillées | → job |
| `boards` | Planches visuelles | → job, panels |
| `board_panels` | Cases individuelles | → board |

#### Statuts métier

```python
# Projet
ProjectStatus = "draft" | "active" | "archived" | "maintenance"

# Écriture
StoryStatus = "active" | "draft" | "archived"

# Assets
AssetStatus = "active" | "archived"

# Jobs
GenerationJobStatus = "pending" | "running" | "ready" | "validated" | "failed"

# Warnings
WarningStatus = "open" | "ignored" | "resolved"
```

### 2.4 Endpoints API

#### Endpoints de base
- `GET /api/health` - Santé du service
- `GET /api/config` - Configuration runtime
- `GET /api/models` - Providers de génération disponibles

#### Projets
- `GET/POST /api/projects` - Liste et création
- `GET/PATCH /api/projects/{id}` - Détail et mise à jour
- `POST /api/projects/{id}/open` - Marquer ouvert
- `POST /api/projects/{id}/archive` - Archiver
- `POST /api/projects/{id}/clone` - Dupliquer
- `GET /api/projects/{id}/export` - Export JSON

#### Personnages
- `GET/POST /api/projects/{id}/characters` - Liste et création
- `GET/PATCH/DELETE /api/projects/{id}/characters/{cid}` - CRUD
- `POST /api/projects/{id}/characters/{cid}/duplicate` - Duplication
- `POST /api/projects/{id}/characters/{cid}/archive` - Archivage
- `POST/PATCH/DELETE .../characters/{cid}/relations/{rid}` - Relations
- `POST .../characters/{cid}/voice-samples` - Échantillons voix

#### Story
- `GET /api/projects/{id}/story` - Résumé complet
- `GET /api/projects/{id}/story/suggestions` - Autocomplete @références
- `POST/PATCH/DELETE .../story/tomes/{tid}` - Tomes
- `POST/PATCH/DELETE .../story/chapters/{cid}` - Chapitres
- `POST/PATCH/DELETE .../story/scenes/{sid}` - Scènes
- `GET .../story/references` - Références extraites

#### Assets
- `GET /api/projects/{id}/assets` - Liste
- `POST /api/projects/{id}/assets/import` - Import fichier
- `GET/PATCH/DELETE .../assets/{aid}` - CRUD
- `POST .../assets/{aid}/archive` - Archivage
- `POST/DELETE .../assets/{aid}/links/{lid}` - Liens

#### Versions
- `GET/POST /api/projects/{id}/versions` - Liste et création
- `GET /api/projects/{id}/versions/branches` - Branches
- `POST /api/projects/{id}/versions/compare` - Comparaison
- `POST /api/projects/{id}/versions/{vid}/restore` - Restauration

#### Warnings
- `GET /api/projects/{id}/warnings` - Liste filtrée
- `POST /api/projects/{id}/warnings/scan` - Scan manuel
- `PATCH /api/projects/{id}/warnings/{wid}` - Mise à jour statut

#### Exports
- `GET/POST /api/projects/{id}/exports` - Liste et création
- `GET /api/projects/{id}/exports/{eid}` - Détail
- `GET /api/projects/{id}/exports/{eid}/download` - Téléchargement

#### Generation
- `GET/POST /api/projects/{id}/generation/jobs` - Jobs
- `GET /api/projects/{id}/generation/jobs/{jid}` - Détail job
- `GET /api/projects/{id}/generation/boards` - Boards
- `GET /api/projects/{id}/generation/boards/{bid}` - Détail board
- `POST .../boards/{bid}/validate` - Validation
- `PATCH .../boards/{bid}/panels/{pid}` - Update panel
- `GET .../boards/{bid}/download` - Export board
- `GET .../boards/{bid}/panels/{pid}/image` - Image panel

### 2.5 Providers de Génération

| Provider | Type | Configuration |
|----------|------|---------------|
| `gpt_images_2` | image | KUTI_GPT_IMAGES_2_BASE_URL, _API_KEY |
| `gpt_images_1_5` | image | KUTI_GPT_IMAGES_1_5_BASE_URL, _API_KEY |
| `sora_2` | image | KUTI_SORA_2_BASE_URL, _API_KEY |
| `seedance_2` | video | KUTI_SEEDANCE_2_BASE_URL, _API_KEY |
| `eleven_labs` | audio | KUTI_ELEVEN_LABS_BASE_URL, _API_KEY |

### 2.6 Tests Backend

**Couverture actuelle : Tests d'intégration complets**

| Test | Scénario |
|------|----------|
| `test_health_and_config_endpoints` | Endpoints de base |
| `test_openapi_documentation_is_available` | Schema OpenAPI |
| `test_project_crud_and_portable_files` | CRUD projets complet |
| `test_character_profiles_and_relations` | Personnages et relations |
| `test_story_references_use_stable_slugs` | Références @ stables |
| `test_story_slugs_are_project_unique` | Unicité slugs |
| `test_asset_import_and_usage_links` | Import et liens assets |
| `test_versioning_checkpoints_compare_and_restore` | Versioning complet |
| `test_warning_generation_update_and_rebuild` | Warnings cohérence |
| `test_export_workflow_generates_artifacts` | Exports JSON/ZIP/Tree |
| `test_generation_studio_creates_board_and_panels` | Génération GPT Images |
| `test_generation_studio_uses_sora_2_with_source_image` | Génération Sora |
| `test_generation_studio_uses_seedance_2` | Génération Seedance |
| `test_generation_studio_supports_panel_follow_up` | Follow-up panels |
| `test_generation_studio_propagates_provider_failure` | Gestion erreurs provider |
| `test_generation_job_requires_configured_image_model` | Validation config modèle |
| `test_generation_studio_supports_chapter_and_tome_grid_planches` | Grilles multi-sources |
| `test_character_routes_require_existing_project` | Validation projet existant |

---

## 3. Architecture Frontend

### 3.1 Stack Technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | React | 19.0 |
| Routing | React Router | 7.0 |
| State Server | TanStack Query | 5.59 |
| State UI | Zustand | 5.0 |
| Styling | Tailwind CSS | 4.3 |
| Build | Vite | 6.0 |
| Types | TypeScript | 5.8 |

### 3.2 Structure

```
kuti-frontend/src/
├── api/
│   ├── client.ts        # Types et fonctions API manuelles
│   └── generated/       # Placeholder SDK généré
├── components/
│   ├── layout/
│   │   └── app-shell.tsx  # Shell avec sidebar
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── textarea.tsx
│       ├── theme-toggle.tsx
│       └── locale-toggle.tsx
├── i18n/                # (via lib/i18n.ts)
├── lib/
│   ├── cn.ts            # Utility classnames
│   └── i18n.ts          # Traductions en/fr
├── routes/
│   ├── home.tsx         # Project Hub
│   ├── project.tsx      # Dashboard projet
│   ├── characters.tsx   # Gestion personnages
│   ├── story-hub.tsx    # Hub storyline
│   ├── story-tomes.tsx  # Tomes
│   ├── story-chapters.tsx # Chapitres
│   ├── story-scenes.tsx # Scènes
│   ├── assets.tsx       # Bibliothèque assets
│   ├── generation.tsx   # Studio génération
│   ├── exports.tsx      # Exports
│   ├── versions.tsx     # Historique versions
│   ├── warnings.tsx     # Centre warnings
│   ├── settings.tsx     # Paramètres projet
│   └── error.tsx        # Page erreur
├── stores/
│   └── ui.ts            # Zustand: theme, locale
├── styles/
│   └── global.css       # Styles globaux + Tailwind
├── main.tsx             # Point d'entrée React
└── router.tsx           # Configuration routes
```

### 3.3 Routes Implémentées

| Route | Composant | Fonctionnalité |
|-------|-----------|----------------|
| `/` | HomeRoute | Project Hub - liste, création, actions |
| `/projects/:id` | ProjectRoute | Dashboard projet |
| `/projects/:id/characters` | CharactersRoute | Gestion personnages |
| `/projects/:id/story` | StoryHubRoute | Hub narratif |
| `/projects/:id/story/tomes` | StoryTomesRoute | Gestion tomes |
| `/projects/:id/story/chapters` | StoryChaptersRoute | Gestion chapitres |
| `/projects/:id/story/scenes` | StoryScenesRoute | Gestion scènes |
| `/projects/:id/assets` | AssetsRoute | Bibliothèque médias |
| `/projects/:id/generation` | GenerationRoute | Studio génération |
| `/projects/:id/exports` | ExportsRoute | Gestion exports |
| `/projects/:id/versions` | VersionsRoute | Historique versions |
| `/projects/:id/warnings` | WarningsRoute | Centre alertes |
| `/projects/:id/settings` | SettingsRoute | Paramètres |

### 3.4 Client API

Le client API (`src/api/client.ts`) est implémenté manuellement avec :

- **Types complets** pour toutes les entités (Project, Character, Tome, Scene, etc.)
- **Fonctions fetch typées** pour tous les endpoints
- **Gestion d'erreurs** avec classe `ApiError` et codes métier
- **URL configurable** via `VITE_KUTI_API_URL`

### 3.5 Internationalisation

**Langues supportées** : Anglais (défaut), Français

**Implémentation** : Dictionnaires statiques dans `lib/i18n.ts`

**Couverture** :
- Labels UI complets
- Messages d'erreur API localisés
- Navigation et actions

### 3.6 State Management

#### Zustand Store (UI)
```typescript
{
  theme: "light" | "dark",
  locale: "en" | "fr",
  setTheme, toggleTheme, setLocale
}
// Persisté dans localStorage sous "kuti-ui"
```

#### TanStack Query (Server State)
- Queries pour toutes les lectures
- Mutations avec invalidation de cache
- Intégré dans les composants de route

---

## 4. Fonctionnalités Complètes (Phases 0-9)

### ✅ Phase 0 - Fondations
- [x] Structure backend FastAPI
- [x] Configuration SQLite et Alembic
- [x] OpenAPI exposé
- [x] Structure frontend React Router v7
- [x] Shell avec navigation
- [x] Thèmes clair/sombre
- [x] TanStack Query + Zustand intégrés

### ✅ Phase 1 - Gestion Projets
- [x] CRUD complet projets
- [x] Clonage, archivage
- [x] Export JSON de base
- [x] Création dossier kuti-data automatique
- [x] Project Hub fonctionnel
- [x] Dashboard projet

### ✅ Phase 2 - Chara Design
- [x] CRUD personnages complet
- [x] Attributs étendus (physical_description, color_palette, etc.)
- [x] Relations entre personnages
- [x] Voice samples
- [x] Tags et statuts
- [x] Duplication personnages

### ✅ Phase 3 - Storyline
- [x] Hiérarchie Tomes → Chapitres → Scènes
- [x] CRUD complet pour chaque niveau
- [x] Références `@character:`, `@environment:`, `@file:`
- [x] Suggestions autocomplete
- [x] Détection références orphelines
- [x] Slugs uniques par projet
- [x] Reordonnancement via order_index

### ✅ Phase 4 - Assets Library
- [x] Import fichiers locaux
- [x] Copie dans kuti-data/projects/{slug}/assets
- [x] Calcul checksum
- [x] Liens assets ↔ entités
- [x] Archivage et suppression
- [x] Validation cible des liens

### ✅ Phase 5 - Versioning
- [x] Création snapshots
- [x] Branches (max 3 versions par branche active)
- [x] Comparaison entre versions
- [x] Restauration avec nouveau snapshot
- [x] Détection branches orphelines

### ✅ Phase 6 - Warnings
- [x] Types : missing_character, invalid_location, timeline_incoherence, orphan_reference
- [x] Scan automatique et manuel
- [x] Statuts : open, ignored, resolved
- [x] Résolution automatique quand entité créée
- [x] Filtrage par type/sévérité/statut

### ✅ Phase 7 - Exports
- [x] Export JSON (work)
- [x] Export Tree (publication)
- [x] Export ZIP (publication)
- [x] Téléchargement artifacts
- [x] Historique exports
- [x] Filtrage par kind/format/status

### ✅ Phase 8 - Generation Studio
- [x] Jobs de génération (scene, chapter, tome, panel)
- [x] Stratégies : direct, intermediate
- [x] Modes : grid, separate
- [x] Providers : gpt_images_2, sora_2, seedance_2
- [x] Boards et panels
- [x] Validation boards
- [x] Follow-up sur panels existants
- [x] Gestion erreurs providers

### ✅ Phase 9 - Internationalisation
- [x] Dictionnaires en/fr complets
- [x] Switch de langue persisté
- [x] Formatage erreurs API localisé
- [x] Labels, titres, messages traduits

---

## 5. Phase 10 - Tâches Restantes

### 5.1 Backend

#### 🔴 Optimisation SQL
**Statut** : Non commencé

**Problèmes identifiés** :
- Pas d'index explicites sur foreign keys fréquemment requêtées
- Potentielles requêtes N+1 dans les endpoints de détail
- Pas de lazy/eager loading configuré explicitement

**Actions recommandées** :
```python
# Ajouter index composites
Index("ix_characters_project_status", "project_id", "status")
Index("ix_scenes_chapter_order", "chapter_id", "order_index")

# Configurer eager loading pour relations fréquentes
session.query(Character).options(
    selectinload(Character.relations),
    selectinload(Character.voice_samples)
)
```

#### 🔴 Logging Structuré
**Statut** : Non commencé

**État actuel** : Aucun logging configuré

**Actions recommandées** :
```python
# Intégrer structlog
import structlog
logger = structlog.get_logger()

# Logger events critiques
logger.info("project.created", project_id=project.id, slug=project.slug)
logger.warning("generation.provider_failed", provider=model_key, error=str(e))
```

#### 🟡 Validation Renforcée
**Statut** : Partiel

**Manques identifiés** :
- Pas de limite explicite sur champs texte longs
- Pas de validation regex pour slugs
- Pas de schema pour settings_json
- Pas de limite sur listes JSON

**Actions recommandées** :
```python
from pydantic import Field, constr

class CharacterCreate(BaseModel):
    name: constr(min_length=1, max_length=255)
    description: constr(max_length=10000) = ""
    tags_json: list[str] = Field(default_factory=list, max_length=50)
```

#### 🔴 Tests Unitaires
**Statut** : Non commencé

**Couverture actuelle** :
- Tests intégration : ✅ Excellents (18 tests)
- Tests unitaires : ❌ Absents

**Actions recommandées** :
- Tests unitaires pour repository layer
- Tests fonctions de slug generation
- Tests validation business logic
- Tests helpers path resolution

### 5.2 Frontend

#### 🔴 Error Boundaries
**Statut** : Non commencé

**État actuel** : Pas de error boundary, erreurs non catchées

**Actions recommandées** :
```tsx
// components/error-boundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

#### 🟡 Loading & Empty States
**Statut** : Partiel

**État actuel** : États basiques, pas standardisés

**Actions recommandées** :
- Créer composants `<Skeleton />`, `<EmptyState />`, `<ErrorState />`
- Standardiser pattern dans toutes les routes
- Ajouter illustrations pour empty states

#### 🟡 Accessibilité
**Statut** : Partiel

**Points à vérifier** :
- Navigation clavier complète
- ARIA labels sur actions
- Contraste couleurs (WCAG AA)
- Focus management dans dialogs

**Actions recommandées** :
- Audit avec axe DevTools
- Ajouter `aria-label` manquants
- Tester navigation clavier
- Vérifier ratios de contraste

#### 🔴 Virtualisation Listes
**Statut** : Non commencé

**Risque** : Performance dégradée sur listes longues (50+ projets, 100+ personnages)

**Actions recommandées** :
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// Virtualiser listes principales
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,
});
```

#### 🔴 Tests Unitaires Frontend
**Statut** : Non commencé

**Actions recommandées** :
- Setup Vitest + React Testing Library
- Tester composants UI (Button, Card, Badge)
- Tester hooks custom
- Tester formatters i18n

#### 🔴 Tests E2E
**Statut** : Non commencé

**Workflows critiques à tester** :
1. Création projet → Personnage → Scène → Génération
2. Export complet
3. Versioning et restauration
4. Gestion warnings

**Actions recommandées** :
```typescript
// e2e/project-workflow.spec.ts
test('create project and character', async ({ page }) => {
  await page.goto('/');
  await page.fill('[name="name"]', 'Test Project');
  await page.click('button[type="submit"]');
  await expect(page.locator('.project-row')).toContainText('Test Project');
});
```

### 5.3 Integration

#### 🟡 Flux End-to-End
**Statut** : À vérifier manuellement

**Checklist** :
- [ ] Créer projet
- [ ] Ajouter personnage avec relations
- [ ] Créer storyline complète (tome → chapitre → scène)
- [ ] Lancer génération
- [ ] Valider board
- [ ] Exporter
- [ ] Versionner
- [ ] Restaurer version

#### 🟡 Scripts Build
**Statut** : Partiel

**Manques** :
- Script `generate:sdk` nécessite backend running
- Pas de script orchestré racine

**Actions recommandées** :
```bash
# scripts/build.sh
#!/bin/bash
cd kuti-backend && uv run uvicorn ... &
sleep 3
cd kuti-frontend && yarn generate:sdk && yarn build
```

#### 🔴 CI/CD
**Statut** : Non commencé

**Actions recommandées** :
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd kuti-backend && uv sync && uv run pytest
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd kuti-frontend && yarn install && yarn build
```

---

## 6. Recommandations Prioritaires

### Priorité Haute (Semaine 1)

| Tâche | Impact | Effort |
|-------|--------|--------|
| Error Boundaries frontend | Stabilité UX critique | Faible |
| Logging backend | Debugging production | Moyen |
| CI/CD GitHub Actions | Automatisation tests | Moyen |

### Priorité Moyenne (Semaine 2)

| Tâche | Impact | Effort |
|-------|--------|--------|
| Tests unitaires backend | Confiance code | Moyen |
| Loading/Empty states | UX polish | Faible |
| Validation renforcée | Robustesse données | Moyen |

### Priorité Normale (Semaine 3-4)

| Tâche | Impact | Effort |
|-------|--------|--------|
| Tests E2E | Validation workflows | Élevé |
| Virtualisation listes | Performance | Moyen |
| Accessibilité audit | Conformité | Moyen |
| Optimisation SQL | Performance | Moyen |

---

## 7. Métriques de Qualité

### Backend

| Métrique | Actuel | Cible |
|----------|--------|-------|
| Tests intégration | 18 | 18 |
| Tests unitaires | 0 | 30+ |
| Couverture code | ~60% | 80% |
| Endpoints documentés | 100% | 100% |

### Frontend

| Métrique | Actuel | Cible |
|----------|--------|-------|
| Tests unitaires | 0 | 20+ |
| Tests E2E | 0 | 5+ |
| Lighthouse Perf | Non mesuré | >80 |
| Lighthouse A11y | Non mesuré | >90 |

---

## 8. Conclusion

Kuti Studio a atteint un niveau de maturité fonctionnelle solide avec toutes les features MVP implémentées. La phase de stabilisation nécessite principalement :

1. **Infrastructure de tests** (unitaires et E2E)
2. **Robustesse production** (logging, error handling)
3. **Polish UX** (loading states, accessibilité)
4. **Automatisation** (CI/CD, scripts build)

Le code existant est bien structuré, modulaire et maintenable. Les conventions sont cohérentes entre backend et frontend. Le projet est prêt pour la finalisation MVP avec 2-4 semaines de travail de stabilisation.

---

## Annexes

### A. Commandes de Développement

```bash
# Backend
cd kuti-backend
uv sync                                    # Install dependencies
uv run pytest                              # Run tests
uv run uvicorn kuti_backend.api.main:create_app --factory --reload

# Frontend
cd kuti-frontend
yarn install                               # Install dependencies
yarn dev                                   # Development server
yarn build                                 # Production build
yarn generate:sdk                          # Generate API client (requires backend)
```

### B. Variables d'Environnement

```bash
# Backend (.env)
KUTI_DATA_DIR=/path/to/kuti-data
KUTI_GPT_IMAGES_2_BASE_URL=https://...
KUTI_GPT_IMAGES_2_API_KEY=...
KUTI_SORA_2_BASE_URL=https://...
KUTI_SORA_2_API_KEY=...
KUTI_SEEDANCE_2_BASE_URL=https://...
KUTI_SEEDANCE_2_API_KEY=...

# Frontend (.env)
VITE_KUTI_API_URL=http://localhost:8000
```

### C. Structure kuti-data

```
kuti-data/
├── db/
│   └── kuti.sqlite
├── projects/
│   └── {project-slug}/
│       ├── project.json
│       └── assets/
│           └── {asset-files}
├── exports/
│   └── {export-artifacts}
└── cache/
```