# Plan d'implementation Kuti Studio

## Vue d'ensemble

Ce plan decoupe l'implementation de Kuti Studio en phases sequencables. Chaque phase liste les travaux backend, frontend et integration, avec des checkpoints clairs avant de passer a la suite.

---

## Phase 0 - Fondations et contrat API

Objectif: poser le socle technique, le contrat OpenAPI et les bases de navigation frontend.

### Backend
- [ ] Creer la structure `kuti-backend/`
- [ ] Initialiser Python 3.12+ avec `uv`
- [ ] Configurer FastAPI et Uvicorn
- [ ] Mettre en place la resolution de chemins vers `kuti-data`
- [ ] Initialiser SQLite, SQLAlchemy ou SQLModel, et Alembic
- [ ] Definir les premiers types metier partages
- [ ] Exposer `GET /api/health`
- [ ] Exposer `GET /api/config`
- [ ] Exporter `openapi.json` depuis le backend

### Frontend
- [ ] Creer la structure `kuti-frontend/`
- [ ] Initialiser React Router v7 avec SSR desactive
- [ ] Configurer TypeScript en mode strict
- [ ] Poser les bases shadcn/ui et du design system
- [ ] Configurer le theme clair et le theme sombre
- [ ] Installer et brancher TanStack Query
- [ ] Installer et brancher Zustand
- [ ] Creer le shell global de l'application
- [ ] Creer la sidebar ou rail de navigation
- [ ] Creer le header de contexte projet

### Integration
- [ ] Configurer la generation du SDK frontend avec `@hey-api/openapi-ts`
- [ ] Ajouter le script de synchronisation backend -> OpenAPI -> SDK
- [ ] Brancher les wrappers API frontend sur le SDK genere
- [ ] Verifier le flux complet backend -> frontend

### Checkpoint de phase
- [ ] Le backend demarre et publie un OpenAPI valide
- [ ] Le frontend build sans erreur
- [ ] Le SDK genere est consommable par l'UI
- [ ] Les themes et la navigation de base fonctionnent

---

## Phase 1 - Project Hub et gestion des projets

Objectif: permettre de creer, ouvrir, lister, cloner et archiver des projets locaux.

### Backend
- [ ] Creer le modele `Project`
- [ ] Creer le modele `ProjectSettings`
- [ ] Implementer la creation de projet
- [ ] Implementer la liste des projets
- [ ] Implementer le detail d'un projet
- [ ] Implementer la mise a jour d'un projet
- [ ] Implementer l'archivage logique
- [ ] Implementer le clonage de projet
- [ ] Implementer l'export de base en JSON
- [ ] Gerer la creation automatique du dossier projet dans `kuti-data`
- [ ] Gerer `project.json` et les metadonnees locales

### Frontend
- [ ] Creer la page Project Hub `/`
- [ ] Afficher la liste des projets recents et disponibles
- [ ] Ajouter la recherche et le filtrage simples
- [ ] Ajouter les vues liste et cartes si necessaire
- [ ] Creer la carte projet reutilisable
- [ ] Creer le dialog de creation de projet
- [ ] Creer les actions rapides ouvrir, cloner, archiver, exporter
- [ ] Gerer l'etat vide quand aucun projet n'existe
- [ ] Creer la page Project Dashboard `/projects/:projectId`
- [ ] Afficher resume, activites recentes et etat global
- [ ] Creer la page Project Settings `/projects/:projectId/settings`
- [ ] Poser les formulaires de configuration projet

### Integration
- [ ] Brancher les queries TanStack Query sur les endpoints projets
- [ ] Ajouter les mutations create, update, clone et archive
- [ ] Gerer les invalidations de cache apres mutation
- [ ] Gerer les etats de chargement, erreur et confirmation

### Checkpoint de phase
- [ ] Un projet peut etre cree, ouvre et archive localement
- [ ] Le dashboard charge les donnees du projet actif
- [ ] Les reglages sont persistants
- [ ] Le Project Hub est le point d'entree principal

---

## Phase 2 - Chara Design

Objectif: livrer la gestion des personnages et de leurs relations.

### Backend
- [ ] Creer le modele `Character`
- [ ] Creer le modele `CharacterRelation`
- [ ] Creer le modele `VoiceSample`
- [ ] Implementer le CRUD complet des personnages
- [ ] Implementer le CRUD des relations entre personnages
- [ ] Valider les doublons et les relations invalides
- [ ] Gerer les tags libres et le statut du personnage
- [ ] Preparer les liens avec les assets de reference

### Frontend
- [ ] Creer la page `/projects/:projectId/characters`
- [ ] Afficher la liste filtrable et triable des personnages
- [ ] Creer la carte personnage avec approche visuelle type tarot
- [ ] Creer le formulaire d'edition des attributs textuels
- [ ] Ajouter la gestion des tags et du statut
- [ ] Creer le panneau detaille du personnage
- [ ] Creer le panneau des relations
- [ ] Preparer la vue relationnelle graphe
- [ ] Ajouter la galerie des medias associes

### Integration
- [ ] Brancher les queries et mutations personnages
- [ ] Faire naviguer proprement entre liste, fiche et relations
- [ ] Gerer les etats de chargement et de vide
- [ ] Synchroniser les modifications de relations

### Checkpoint de phase
- [ ] CRUD personnage complet
- [ ] Relations visibles et editables
- [ ] Les medias de reference sont rattaches au bon personnage
- [ ] La navigation reste fluide

---

## Phase 3 - Storyline et references `@`

Objectif: construire le coeur editorial du produit avec tomes, chapitres, scenes et references typpees.

### Backend
- [ ] Creer les modeles `Tome`, `Chapter` et `Scene`
- [ ] Creer le modele `StoryReference`
- [ ] Implementer le CRUD des tomes
- [ ] Implementer le CRUD des chapitres
- [ ] Implementer le CRUD des scenes
- [ ] Gerer le reordonnancement via `order_index`
- [ ] Ajouter la validation de la hierarchie tome -> chapitre -> scene
- [ ] Parser les references `@type:identifiant`
- [ ] Valider les references orphelines ou inconnues
- [ ] Exposer un endpoint de suggestions pour l'autocomplete
- [ ] Etendre `Scene` avec les metadonnees editoriales

### Frontend
- [ ] Creer la page `/projects/:projectId/story`
- [ ] Afficher l'arbre narratif tomes / chapitres / scenes
- [ ] Permettre la creation rapide des entites
- [ ] Permettre le reordonnancement par glisser-deposer ou actions explicites
- [ ] Integrer un editeur Markdown structure
- [ ] Afficher les metadonnees de scene dans un panneau lateral
- [ ] Creer le systeme de chips ou badges pour les personnages presents
- [ ] Implementer l'autocomplete des references `@`
- [ ] Creer le composant d'affichage des references typpees
- [ ] Permettre la navigation depuis une reference vers sa cible
- [ ] Ajouter les notes editoriales sans polluer le texte principal

### Integration
- [ ] Brancher l'editor sur les mutations backend
- [ ] Configurer l'autosave non bloquant
- [ ] Brancher les suggestions de reference sur le backend
- [ ] Invalider le cache de facon ciblée apres modification

### Checkpoint de phase
- [ ] On peut creer et reorganiser la storyline
- [ ] Les references `@` sont reconnues et proposees
- [ ] Les metadonnees de scene sont visibles et editables
- [ ] L'edition reste fluide et non bloquante

---

## Phase 4 - Assets Library

Objectif: gerer les imports locaux, l'archivage et les usages des medias.

### Backend
- [ ] Creer les modeles `Asset` et `AssetLink`
- [ ] Implementer l'import de fichiers locaux
- [ ] Copier physiquement les fichiers dans `kuti-data`
- [ ] Calculer les checksums des fichiers importes
- [ ] Gerer la suppression logique par defaut
- [ ] Gerer l'archivage avant purge
- [ ] Gerer la suppression definitive avec confirmation
- [ ] Exposer les usages d'un asset dans le projet
- [ ] Servir les fichiers et apercus necessaires

### Frontend
- [ ] Creer la page `/projects/:projectId/assets`
- [ ] Ajouter le dropzone ou import file picker
- [ ] Afficher une grille ou liste des assets
- [ ] Creer la carte asset avec preview
- [ ] Ajouter les filtres par type et statut
- [ ] Creer le panneau de detail asset
- [ ] Afficher metadonnees, usages et actions
- [ ] Preparer le support audio et image

### Integration
- [ ] Permettre l'association d'assets aux personnages
- [ ] Permettre l'utilisation d'assets dans la storyline via `@file:`
- [ ] Gerer les references croisées entre assets et contenu editorial

### Checkpoint de phase
- [ ] Les fichiers locaux sont importables et portables
- [ ] Les assets sont visibles, filtrables et detachables
- [ ] L'archivage et la suppression sont controles

---

## Phase 5 - Versioning

Objectif: conserver un historique exploitable avec branches et restauration.

### Backend
- [ ] Creer le modele `Version`
- [ ] Implementer la creation de version sur evenements importants
- [ ] Gerer la regle des 3 versions par branche active
- [ ] Gerer les branches alternatives et orphelines
- [ ] Exposer la liste des versions par projet
- [ ] Exposer la comparaison de deux versions
- [ ] Exposer la restauration d'une version precedente
- [ ] Logger les metadonnees de version et auteur local

### Frontend
- [ ] Creer la page `/projects/:projectId/versions`
- [ ] Afficher l'arbre des branches
- [ ] Afficher la liste des versions
- [ ] Ajouter la comparaison cote a cote
- [ ] Ajouter l'action de restauration
- [ ] Signaler les branches orphelines
- [ ] Proposer archivage ou nettoyage

### Integration
- [ ] Brancher les queries et mutations de versioning
- [ ] Rafraichir les vues apres restauration
- [ ] Gérer les conflits et confirmations de restauration

### Checkpoint de phase
- [ ] Les versions sont creees et restaurees correctement
- [ ] Les branches inutilisees sont detectables
- [ ] L'historique est lisible dans l'UI

---

## Phase 6 - Warnings et coherence

Objectif: detecter les incoherences sans bloquer l'ecriture.

### Backend
- [ ] Creer le modele `Warning`
- [ ] Definir les types de warnings et leur gravite
- [ ] Verifier les personnages referencés mais absents
- [ ] Verifier les lieux ou environnements invalides
- [ ] Verifier les incoherences de timeline
- [ ] Verifier les references orphelines
- [ ] Exposer la verification manuelle
- [ ] Exposer la verification automatique apres certains events
- [ ] Exposer la liste et la mise a jour des warnings

### Frontend
- [ ] Creer la page `/projects/:projectId/warnings`
- [ ] Ajouter la liste filtrable des warnings
- [ ] Filtrer par gravite, statut, origine et entite
- [ ] Creer le panneau de detail contextuel
- [ ] Ajouter les actions traiter, ignorer, revalider
- [ ] Ajouter les badges inline dans les fiches et l'editor
- [ ] Ajouter un centre de warnings global visible mais non intrusif

### Integration
- [ ] Rendre les settings projet capables d'activer ou desactiver des regles
- [ ] Brancher les checks automatiques sur les sauvegardes
- [ ] Ajouter les notifications utiles sans surcharger l'interface

### Checkpoint de phase
- [ ] Les incoherences sont detectees et affichees
- [ ] Les warnings ne bloquent pas l'edition
- [ ] Les actions de traitement sont fonctionnelles

---

## Phase 7 - Exports

Objectif: produire des exports de travail et des exports de publication.

### Backend
- [ ] Creer le modele `Export`
- [ ] Implementer l'export travail en JSON
- [ ] Implementer l'export arborescence de fichiers
- [ ] Implementer l'export ZIP portable
- [ ] Implementer l'export publication en images paginees
- [ ] Implementer l'export PDF
- [ ] Preparer l'export CBZ et EPUB
- [ ] Orchestrer les exports comme jobs locaux
- [ ] Journaliser les exports et leurs statuts

### Frontend
- [ ] Creer la page `/projects/:projectId/exports`
- [ ] Ajouter les formulaires export travail et export publication
- [ ] Ajouter le selecteur de formats
- [ ] Afficher la preview du contenu exporte
- [ ] Lister les exports precedents
- [ ] Afficher le statut en cours, termine ou erreur
- [ ] Permettre le telechargement et la localisation de l'export

### Integration
- [ ] Brancher les endpoints d'export
- [ ] Suivre la progression des jobs d'export
- [ ] Gerer les erreurs d'export proprement

### Checkpoint de phase
- [ ] Un export travail complet est possible
- [ ] Un export publication est possible
- [ ] L'historique des exports est consultable

---

## Phase 8 - Generation Studio

Objectif: mettre en place les jobs de generation et le suivi des sorties.

### Backend
- [ ] Creer les modeles `GenerationJob` et `GenerationJobStep`
- [ ] Creer les modeles `Board` et `BoardPanel`
- [ ] Brancher `gpt-2-images` comme point d'entree
- [ ] Decouper les generations en sous-jobs explicites
- [ ] Gerer les strategies images intermediaires et planches directes
- [ ] Persister prompts, sorties et artefacts intermediaires
- [ ] Exposer le suivi de progression
- [ ] Exposer la validation humaine des sorties

### Frontend
- [ ] Creer la page `/projects/:projectId/generation`
- [ ] Ajouter le lancement par scene, chapitre ou tome
- [ ] Ajouter le selecteur de strategie
- [ ] Afficher la file d'attente et les etapes
- [ ] Afficher les sorties intermediaires
- [ ] Creer la page de preview des images generees
- [ ] Permettre selection, rejet et remplacement d'images
- [ ] Creer l'assemblage visuel de la planche
- [ ] Permettre le reordonnancement des cases
- [ ] Ajouter le bouton de validation finale

### Integration
- [ ] Brancher le polling ou un canal temps reel pour la progression
- [ ] Relier les sorties aux scenes sources
- [ ] Relier les generations a la version source

### Checkpoint de phase
- [ ] Une generation peut etre lancee et suivie
- [ ] Les sorties intermediaires sont visibles
- [ ] Une planche peut etre composee et validee

---

## Phase 9 - Internationalisation

Objectif: livrer l'UI en anglais par defaut et en francais.

### Backend
- [ ] Structurer les messages d'erreur localisables
- [ ] Preparer les cles de traduction backend si necessaire

### Frontend
- [ ] Configurer i18n frontend
- [ ] Ajouter `en` et `fr`
- [ ] Centraliser les cles de traduction
- [ ] Localiser les labels, aides, titres et erreurs
- [ ] Ajouter le switch de langue
- [ ] Persister la preference utilisateur localement

### Integration
- [ ] Verifier que le changement de langue ne casse pas la navigation
- [ ] Verifier que le contenu utilisateur n'est pas traduit

### Checkpoint de phase
- [ ] L'interface fonctionne en anglais
- [ ] L'interface fonctionne en francais
- [ ] Le switch de langue est fluide

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
