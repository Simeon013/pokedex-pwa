/**
 * Collection personnelle persistante : favoris, vus, capturés, shiny trouvés.
 * Stockée sous forme de listes d'identifiants /pokemon/{id} (sérialisables),
 * exposée sous forme d'ensembles pour les filtres.
 */
import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CollectionSets } from '@/domain/filters';
import { persistentStorage } from './storage';

export type CollectionList = 'favorites' | 'seen' | 'caught' | 'shinyFound';

export interface CollectionState {
  favorites: number[];
  seen: number[];
  caught: number[];
  shinyFound: number[];
  toggle: (list: CollectionList, id: number) => boolean;
  set: (list: CollectionList, id: number, value: boolean) => void;
  importData: (data: unknown) => boolean;
  clear: () => void;
}

const LISTS: CollectionList[] = ['favorites', 'seen', 'caught', 'shinyFound'];

function withValue(list: number[], id: number, value: boolean): number[] {
  const has = list.includes(id);
  if (value === has) return list;
  return value ? [...list, id] : list.filter((x) => x !== id);
}

export const useCollection = create<CollectionState>()(
  persist(
    (set, get) => ({
      favorites: [],
      seen: [],
      caught: [],
      shinyFound: [],
      toggle: (list, id) => {
        const next = !get()[list].includes(id);
        get().set(list, id, next);
        return next;
      },
      set: (list, id, value) =>
        set((s) => {
          const patch: Partial<CollectionState> = { [list]: withValue(s[list], id, value) };
          // Capturé ⇒ vu ; shiny trouvé ⇒ vu.
          if (value && (list === 'caught' || list === 'shinyFound')) patch.seen = withValue(s.seen, id, true);
          return patch;
        }),
      importData: (data) => {
        if (typeof data !== 'object' || data === null) return false;
        const patch: Partial<CollectionState> = {};
        for (const key of LISTS) {
          const v = (data as Record<string, unknown>)[key];
          if (Array.isArray(v) && v.every((x) => Number.isInteger(x))) patch[key] = [...new Set(v as number[])];
        }
        if (Object.keys(patch).length === 0) return false;
        set(patch);
        return true;
      },
      clear: () => set({ favorites: [], seen: [], caught: [], shinyFound: [] }),
    }),
    { name: 'collection', storage: persistentStorage, version: 1 },
  ),
);

export function useCollectionSets(): CollectionSets {
  const favorites = useCollection((s) => s.favorites);
  const seen = useCollection((s) => s.seen);
  const caught = useCollection((s) => s.caught);
  const shinyFound = useCollection((s) => s.shinyFound);
  return useMemo(
    () => ({ favorites: new Set(favorites), seen: new Set(seen), caught: new Set(caught), shinyFound: new Set(shinyFound) }),
    [favorites, seen, caught, shinyFound],
  );
}

export function exportCollection(s: Pick<CollectionState, CollectionList>): string {
  return JSON.stringify({ app: 'pokedex-pwa', version: 1, exportedAt: new Date().toISOString(), favorites: s.favorites, seen: s.seen, caught: s.caught, shinyFound: s.shinyFound }, null, 2);
}
