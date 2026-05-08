# Plan d'implementation Kuti Studio

## Vue d'ensemble

Ce plan decoupe l'implementation de Kuti Studio en phases sequencables. Chaque phase liste les travaux backend, frontend et integration, avec des checkpoints clairs avant de passer a la suite.

---

## Phase 0 - Fondations et contrat API

Objectif: poser le socle technique, le contrat OpenAPI et les bases de navigation frontend.

### Backend
- [x] Creer la structure `kuti-backend/`
- [x] Initialiser Python 3.12+ avec `uv`
- [x] Configurer FastAPI et Uvicorn
- [x] Mettre en place la resolution de chemins vers `kuti-data`
- [x] Initialiser SQLite, SQLAlchemy ou SQLModel, et Alembic
- [x] Definir les premiers types metier partages
- [x] Exposer `GET /api/health`
- [x] Exposer `GET /api/config`
- [x] Exporter `openapi.json` depuis le backend

### Frontend
- [x] Creer la structure `kuti-frontend/`
- [x] Initialiser React Router v7 avec SSR desactive
- [x] Configurer TypeScript en mode strict
- [x] Poser les bases shadcn/ui et du design system
- [x] Configurer le theme clair et le theme sombre
- [x] Installer et brancher TanStack Query
- [x] Installer et brancher Zustand
- [x] Creer le shell global de l'application
- [x] Creer la sidebar ou rail de navigation
- [x] Creer le header de contexte projet

### Integration
- [x] Configurer la generation du SDK frontend avec `@hey-api/openapi-ts`
- [x] Ajouter le script de synchronisation backend -> OpenAPI -> SDK
- [x] Brancher les wrappers API frontend sur le SDK genere
- [x] Verifier le flux complet backend -> frontend

### Checkpoint de phase
- [x] Le backend demarre et publie un OpenAPI valide
- [x] Le frontend build sans erreur
- [x] Le SDK genere est consommable par l'UI
- [x] Les themes et la navigation de base fonctionnent

---

## Phase 1 - Project Hub et gestion des projets

Objectif: permettre de creer, ouvrir, lister, cloner et archiver des projets locaux.

### Backend
- [x] Creer le modele `Project`
- [x] Creer le modele `ProjectSettings`
- [x] Implementer la creation de projet
- [x] Implementer la liste des projets
- [x] Implementer le detail d'un projet
- [x] Implementer la mise a jour d'un projet
- [x] Implementer l'archivage logique
- [x] Implementer le clonage de projet
- [x] Implementer l'export de base en JSON
- [x] Gerer la creation automatique du dossier projet dans `kuti-data`
- [x] Gerer `project.json` et les metadonnees locales

### Frontend
- [x] Creer la page Project Hub `/`
- [x] Afficher la liste des projets recents et disponibles
- [x] Ajouter la recherche et le filtrage simples
- [x] Ajouter les vues liste et cartes si necessaire
- [x] Creer la carte projet reutilisable
- [x] Creer le dialog de creation de projet
- [x] Creer les actions rapides ouvrir, cloner, archiver, exporter
- [x] Gerer l'etat vide quand aucun projet n'existe
- [x] Creer la page Project Dashboard `/projects/:projectId`
- [x] Afficher resume, activites recentes et etat global
- [x] Creer la page Project Settings `/projects/:projectId/settings`
- [x] Poser les formulaires de configuration projet

### Integration
- [x] Brancher les queries TanStack Query sur les endpoints projets
- [x] Ajouter les mutations create, update, clone et archive
- [x] Gerer les invalidations de cache apres mutation
- [x] Gerer les etats de chargement, erreur et confirmation

### Checkpoint de phase
- [x] Un projet peut etre cree, ouvre et archive localement
- [x] Le dashboard charge les donnees du projet actif
- [x] Les reglages sont persistants
- [x] Le Project Hub est le point d'entree principal

---

## Phase 2 - Chara Design

Objectif: livrer la gestion des personnages et de leurs relations.

### Backend
- [x] Creer le modele `Character`
- [x] Creer le modele `CharacterRelation`
- [x] Creer le modele `VoiceSample`
- [x] Implementer le CRUD complet des personnages
- [x] Implementer le CRUD des relations entre personnages
- [x] Valider les doublons et les relations invalides
- [x] Gerer les tags libres et le statut du personnage
- [x] Preparer les liens avec les assets de reference

### Frontend
- [x] Creer la page `/projects/:projectId/characters`
- [x] Afficher la liste filtrable et triable des personnages
- [x] Creer la carte personnage avec approche visuelle type tarot
- [x] Creer le formulaire d'edition des attributs textuels
- [x] Ajouter la gestion des tags et du statut
- [x] Creer le panneau detaille du personnage
- [x] Creer le panneau des relations
- [x] Preparer la vue relationnelle graphe
- [x] Ajouter la galerie des medias associes

### Integration
- [x] Brancher les queries et mutations personnages
- [x] Faire naviguer proprement entre liste, fiche et relations
- [x] Gerer les etats de chargement et de vide
- [x] Synchroniser les modifications de relations

### Checkpoint de phase
- [x] CRUD personnage complet
- [x] Relations visibles et editables
- [x] Les medias de reference sont rattaches au bon personnage
- [x] La navigation reste fluide

---

## Phase 3 - Storyline et references `@`

Objectif: construire le coeur editorial du produit avec tomes, chapitres, scenes et references typpees.

### Backend
- [x] Creer les modeles `Tome`, `Chapter` et `Scene`
- [x] Creer le modele `StoryReference`
- [x] Implementer le CRUD des tomes
- [x] Implementer le CRUD des chapitres
- [x] Implementer le CRUD des scenes
- [x] Gerer le reordonnancement via `order_index`
- [x] Ajouter la validation de la hierarchie tome -> chapitre -> scene
- [x] Parser les references `@type:identifiant`
- [x] Valider les references orphelines ou inconnues
- [x] Exposer un endpoint de suggestions pour l'autocomplete
- [x] Etendre `Scene` avec les metadonnees editoriales

### Frontend
- [x] Creer la page `/projects/:projectId/story`
- [x] Afficher l'arbre narratif tomes / chapitres / scenes
- [x] Permettre la creation rapide des entites
- [x] Permettre le reordonnancement par glisser-deposer ou actions explicites
- [x] Integrer un editeur Markdown structure
- [x] Afficher les metadonnees de scene dans un panneau lateral
- [x] Creer le systeme de chips ou badges pour les personnages presents
- [x] Implementer l'autocomplete des references `@`
- [x] Creer le composant d'affichage des references typpees
- [x] Permettre la navigation depuis une reference vers sa cible
- [x] Ajouter les notes editoriales sans polluer le texte principal

### Integration
- [x] Brancher l'editor sur les mutations backend
- [x] Configurer l'autosave non bloquant
- [x] Brancher les suggestions de reference sur le backend
- [x] Invalider le cache de facon ciblée apres modification

### Checkpoint de phase
- [x] On peut creer et reorganiser la storyline
- [x] Les references `@` sont reconnues et proposees
- [x] Les metadonnees de scene sont visibles et editables
- [x] L'edition reste fluide et non bloquante

---

## Phase 4 - Assets Library

Objectif: gerer les imports locaux, l'archivage et les usages des medias.

### Backend
- [x] Creer les modeles `Asset` et `AssetLink`
- [x] Implementer l'import de fichiers locaux
- [x] Copier physiquement les fichiers dans `kuti-data`
- [x] Calculer les checksums des fichiers importes
- [x] Gerer la suppression logique par defaut
- [x] Gerer l'archivage avant purge
- [x] Gerer la suppression definitive avec confirmation
- [x] Exposer les usages d'un asset dans le projet
- [x] Servir les fichiers et apercus necessaires

### Frontend
- [x] Creer la page `/projects/:projectId/assets`
- [x] Ajouter le dropzone ou import file picker
- [x] Afficher une grille ou liste des assets
- [x] Creer la carte asset avec preview
- [x] Ajouter les filtres par type et statut
- [x] Creer le panneau de detail asset
- [x] Afficher metadonnees, usages et actions
- [x] Preparer le support audio et image

### Integration
- [x] Permettre l'association d'assets aux personnages
- [x] Permettre l'utilisation d'assets dans la storyline via `@file:`
- [x] Gerer les references croisées entre assets et contenu editorial

### Checkpoint de phase
- [x] Les fichiers locaux sont importables et portables
- [x] Les assets sont visibles, filtrables et detachables
- [x] L'archivage et la suppression sont controles

---

## Phase 5 - Versioning

Objectif: conserver un historique exploitable avec branches et restauration.

### Backend
- [x] Creer le modele `Version`
- [x] Implementer la creation de version sur evenements importants
- [x] Gerer la regle des 3 versions par branche active
- [x] Gerer les branches alternatives et orphelines
- [x] Exposer la liste des versions par projet
- [x] Exposer la comparaison de deux versions
- [x] Exposer la restauration d'une version precedente
- [x] Logger les metadonnees de version et auteur local

### Frontend
- [x] Creer la page `/projects/:projectId/versions`
- [x] Afficher l'arbre des branches
- [x] Afficher la liste des versions
- [x] Ajouter la comparaison cote a cote
- [x] Ajouter l'action de restauration
- [x] Signaler les branches orphelines
- [x] Proposer archivage ou nettoyage

### Integration
- [x] Brancher les queries et mutations de versioning
- [x] Rafraichir les vues apres restauration
- [x] Gérer les conflits et confirmations de restauration

### Checkpoint de phase
- [x] Les versions sont creees et restaurees correctement
- [x] Les branches inutilisees sont detectables
- [x] L'historique est lisible dans l'UI

---

## Phase 6 - Warnings et coherence

Objectif: detecter les incoherences sans bloquer l'ecriture.

### Backend
- [x] Creer le modele `Warning`
- [x] Definir les types de warnings et leur gravite
- [x] Verifier les personnages referencés mais absents
- [x] Verifier les lieux ou environnements invalides
- [x] Verifier les incoherences de timeline
- [x] Verifier les references orphelines
- [x] Exposer la verification manuelle
- [x] Exposer la verification automatique apres certains events
- [x] Exposer la liste et la mise a jour des warnings

### Frontend
- [x] Creer la page `/projects/:projectId/warnings`
- [x] Ajouter la liste filtrable des warnings
- [x] Filtrer par gravite, statut, origine et entite
- [x] Creer le panneau de detail contextuel
- [x] Ajouter les actions traiter, ignorer, revalider
- [x] Ajouter les badges inline dans les fiches et l'editor
- [x] Ajouter un centre de warnings global visible mais non intrusif

### Integration
- [x] Rendre les settings projet capables d'activer ou desactiver des regles
- [x] Brancher les checks automatiques sur les sauvegardes
- [x] Ajouter les notifications utiles sans surcharger l'interface

### Checkpoint de phase
- [x] Les incoherences sont detectees et affichees
- [x] Les warnings ne bloquent pas l'edition
- [x] Les actions de traitement sont fonctionnelles

---

## Phase 7 - Exports

Objectif: produire des exports de travail et des exports de publication.

### Backend
- [x] Creer le modele `Export`
- [x] Implementer l'export travail en JSON
- [x] Implementer l'export arborescence de fichiers
- [x] Implementer l'export ZIP portable
- [x] Implementer l'export publication en images paginees
- [x] Implementer l'export PDF
- [x] Preparer l'export CBZ et EPUB
- [x] Orchestrer les exports comme jobs locaux
- [x] Journaliser les exports et leurs statuts

### Frontend
- [x] Creer la page `/projects/:projectId/exports`
- [x] Ajouter les formulaires export travail et export publication
- [x] Ajouter le selecteur de formats
- [x] Afficher la preview du contenu exporte
- [x] Lister les exports precedents
- [x] Afficher le statut en cours, termine ou erreur
- [x] Permettre le telechargement et la localisation de l'export

### Integration
- [x] Brancher les endpoints d'export
- [x] Suivre la progression des jobs d'export
- [x] Gerer les erreurs d'export proprement

### Checkpoint de phase
- [x] Un export travail complet est possible
- [x] Un export publication est possible
- [x] L'historique des exports est consultable

---

## Phase 8 - Generation Studio

Objectif: mettre en place les jobs de generation et le suivi des sorties.

### Backend
- [x] Creer les modeles `GenerationJob` et `GenerationJobStep`
- [x] Creer les modeles `Board` et `BoardPanel`
- [x] Brancher `gpt-2-images` comme point d'entree
- [x] Decouper les generations en sous-jobs explicites
- [x] Gerer les strategies images intermediaires et planches directes
- [x] Persister prompts, sorties et artefacts intermediaires
- [x] Exposer le suivi de progression
- [x] Exposer la validation humaine des sorties

### Frontend
- [x] Creer la page `/projects/:projectId/generation`
- [x] Ajouter le lancement par scene, chapitre ou tome
- [x] Ajouter le selecteur de strategie
- [x] Afficher la file d'attente et les etapes
- [x] Afficher les sorties intermediaires
- [x] Creer la page de preview des images generees
- [x] Permettre selection, rejet et remplacement d'images
- [x] Creer l'assemblage visuel de la planche
- [x] Permettre le reordonnancement des cases
- [x] Ajouter le bouton de validation finale

### Integration
- [x] Brancher le polling ou un canal temps reel pour la progression
- [x] Relier les sorties aux scenes sources
- [x] Relier les generations a la version source

### Checkpoint de phase
- [x] Une generation peut etre lancee et suivie
- [x] Les sorties intermediaires sont visibles
- [x] Une planche peut etre composee et validee

---

## Phase 9 - Internationalisation

Objectif: livrer l'UI en anglais par defaut et en francais.

### Backend
- [x] Structurer les messages d'erreur localisables
- [x] Preparer les cles de traduction backend si necessaire

### Frontend
- [x] Configurer i18n frontend
- [x] Ajouter `en` et `fr`
- [x] Centraliser les cles de traduction
- [x] Localiser les labels, aides, titres et erreurs
- [x] Ajouter le switch de langue
- [x] Persister la preference utilisateur localement

### Integration
- [x] Verifier que le changement de langue ne casse pas la navigation
- [x] Verifier que le contenu utilisateur n'est pas traduit

### Checkpoint de phase
- [x] L'interface fonctionne en anglais
- [x] L'interface fonctionne en francais
- [x] Le switch de langue est fluide

---

## Phase 10 - Stabilisation, tests et polish

Objectif: securiser le MVP et preparer la sortie locale.

### Backend
- [ ] Optimiser les requetes et relations SQL
- [ ] Geter les logs structurés
- [ ] Renforcer les validations de payloads
- [ ] Ajouter les tests unitaires critiques
- [ ] Ajouter les tests d'integration API

### Frontend
- [ ] Ajouter les error boundaries
- [ ] Ameliorer les loading states et empty states
- [ ] Verifier l'accessibilite clavier et contrastes
- [ ] Virtualiser les listes longues si necessaire
- [ ] Ajouter les tests unitaires critiques
- [ ] Ajouter les tests E2E principaux

### Integration
- [ ] Verifier le flux complet de bout en bout
- [ ] Stabiliser les scripts de build et de generation SDK
- [ ] Corriger les regressions avant gel de version

### Checkpoint de phase
- [ ] Le MVP est coherent de bout en bout
- [ ] Les performances sont acceptables sur un projet moyen
- [ ] Les fonctionnalites principales sont testees

---

## Ordre de livraison recommande

1. [ ] Phase 0 - Fondations et contrat API
2. [ ] Phase 1 - Project Hub et gestion des projets
3. [ ] Phase 2 - Chara Design
4. [ ] Phase 3 - Storyline et references `@`
5. [ ] Phase 4 - Assets Library
6. [ ] Phase 5 - Versioning
7. [ ] Phase 6 - Warnings et coherence
8. [ ] Phase 7 - Exports
9. [ ] Phase 8 - Generation Studio
10. [ ] Phase 9 - Internationalisation
11. [ ] Phase 10 - Stabilisation, tests et polish

---

## Definition du MVP

Le MVP est considere comme terminee lorsque:
- [ ] un projet local peut etre cree, ouvert et archive
- [ ] les personnages sont geres de bout en bout
- [ ] la storyline supporte tomes, chapitres et scenes
- [ ] les references `@` fonctionnent
- [ ] les metadonnees de scene sont visibles
- [ ] les assets sont importes et lies correctement
- [ ] le versioning minimal est en place
- [ ] les warnings sont affiches sans bloquer l'ecriture
- [ ] les exports de travail existent
- [ ] l'interface est disponible en anglais et francais

---

## Notes d'implementation

- Le backend reste la source de verite du domaine et expose tout via OpenAPI.
- Le frontend consomme exclusivement le SDK genere, avec TanStack Query pour le serveur et Zustand pour l'etat UI.
- Le dossier `kuti-data` reste portable et contient les donnees metier, les assets, les exports et les artefacts locaux.
- Les warnings et la coherence doivent rester non bloquants.
- La generation et les exports sont traites comme des jobs locaux avec progression observable.
