# Pokédex PWA

Pokédex complet, animé et utilisable hors ligne : les 1 025 espèces et leurs formes alternatives
(Méga, Gigamax, régionales…), avec recherche instantanée, filtres, favoris, et bientôt fiches
détaillées, cris, mode shiny et modèles 3D procéduraux.

**Démo :** https://simeon013.github.io/pokedex-pwa/

> Projet en cours de développement, par étapes. Fait : données et cache (1), liste et recherche (2).
> À venir : fiche détaillée et cris (3), sprites animés et shiny (4), 3D procédurale (5),
> collection, comparateur et PWA (6), finitions et accessibilité (7).

## Stack

React 19 · Vite · TypeScript strict · Tailwind CSS 4 · Framer Motion · Zustand · React Router ·
Dexie (IndexedDB) · TanStack Virtual · React Three Fiber (étape 5) · vite-plugin-pwa (étape 6) ·
Vitest · Playwright. Données : [PokeAPI](https://pokeapi.co), avec repli automatique sur son
miroir statique [PokeAPI/api-data](https://github.com/PokeAPI/api-data).

## Lancer en local

Node.js 20 ou plus récent.

```bash
npm install
npm run dev          # http://localhost:5173
npm run test         # tests unitaires (Vitest)
npm run test:e2e     # parcours navigateur (Playwright)
npm run build        # build de production dans dist/
npm run build:index  # régénère public/data/index.json depuis PokeAPI
```

## Déploiement

- **GitHub Pages** : automatique à chaque push sur `main` (`.github/workflows/deploy.yml`).
- **Vercel / Netlify** : importer le dépôt, commande `npm run build`, dossier `dist`
  (configuration détaillée à l'étape 7).

## Données et marque

Projet **non officiel**, réalisé par un fan, sans but commercial. Il n'est ni affilié, ni approuvé,
ni sponsorisé par Nintendo, Game Freak, Creatures Inc. ou The Pokémon Company.
Pokémon et les noms des personnages sont des marques de leurs propriétaires respectifs.
Les données et images proviennent de [PokeAPI](https://pokeapi.co) et de ses dépôts associés ;
les icônes de types et le logo sont des dessins originaux de ce projet.
