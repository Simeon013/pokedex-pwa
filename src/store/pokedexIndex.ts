/** Index léger chargé une fois et partagé par toute l'application. */
import { create } from 'zustand';
import type { BuildProgress } from '@/api/indexBuilder';
import { loadIndex } from '@/api/queries';
import type { IndexEntry, PokedexIndex } from '@/domain/models';

interface IndexStore {
  status: 'idle' | 'loading' | 'ready' | 'error';
  index: PokedexIndex | null;
  /** Accès direct par identifiant /pokemon/{id}. */
  byId: Map<number, IndexEntry>;
  /** Entrées par défaut (une par espèce) triées par numéro, pour la navigation ← →. */
  species: IndexEntry[];
  progress: BuildProgress | null;
  error: string | null;
  load: (force?: boolean) => Promise<void>;
}

function apply(index: PokedexIndex) {
  return {
    status: 'ready' as const,
    index,
    byId: new Map(index.entries.map((e) => [e.id, e])),
    species: index.entries.filter((e) => e.isDefault).sort((a, b) => a.speciesId - b.speciesId),
    error: null,
    progress: null,
  };
}

export const useIndexStore = create<IndexStore>()((set, get) => ({
  status: 'idle',
  index: null,
  byId: new Map(),
  species: [],
  progress: null,
  error: null,
  load: async (force = false) => {
    if (!force && (get().status === 'loading' || get().status === 'ready')) return;
    set({ status: 'loading', error: null });
    try {
      const index = await loadIndex((progress) => set({ progress }), {
        force,
        onUpdate: (fresh) => set(apply(fresh)),
      });
      set(apply(index));
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  },
}));
