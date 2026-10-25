/** État des filtres de la liste (gardé en mémoire pendant la session). */
import { create } from 'zustand';
import { DEFAULT_FILTERS, type FilterState, type SortDir, type SortKey } from '@/domain/filters';
import type { Region } from '@/domain/generations';
import type { TypeName } from '@/domain/models';

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export interface FiltersStore extends FilterState {
  setQuery: (q: string) => void;
  toggleType: (t: TypeName) => void;
  setTypeMode: (m: FilterState['typeMode']) => void;
  toggleGeneration: (g: number) => void;
  toggleRegion: (r: Region) => void;
  setRarity: (r: FilterState['rarity']) => void;
  setFlag: (key: 'onlyFavorites' | 'onlyShinyFound' | 'onlyCaught' | 'onlySeen' | 'includeForms', value: boolean) => void;
  setSort: (sort: SortKey, dir?: SortDir) => void;
  setDir: (dir: SortDir) => void;
  reset: () => void;
}

export const useFilters = create<FiltersStore>()((set) => ({
  ...DEFAULT_FILTERS,
  setQuery: (query) => set({ query }),
  toggleType: (t) => set((s) => ({ types: toggle(s.types, t) })),
  setTypeMode: (typeMode) => set({ typeMode }),
  toggleGeneration: (g) => set((s) => ({ generations: toggle(s.generations, g).sort((a, b) => a - b) })),
  toggleRegion: (r) => set((s) => ({ regions: toggle(s.regions, r) })),
  setRarity: (rarity) => set({ rarity }),
  setFlag: (key, value) => set({ [key]: value }),
  setSort: (sort, dir) => set((s) => ({ sort, dir: dir ?? (sort === 'id' || sort === 'name' ? 'asc' : s.sort === sort ? s.dir : 'desc') })),
  setDir: (dir) => set({ dir }),
  reset: () => set({ ...DEFAULT_FILTERS }),
}));

/** Extrait l'état pur (sans les actions) pour `applyFilters`. */
export function selectFilterState(s: FiltersStore): FilterState {
  const { query, types, typeMode, generations, regions, rarity, onlyFavorites, onlyShinyFound, onlyCaught, onlySeen, includeForms, sort, dir } = s;
  return { query, types, typeMode, generations, regions, rarity, onlyFavorites, onlyShinyFound, onlyCaught, onlySeen, includeForms, sort, dir };
}
