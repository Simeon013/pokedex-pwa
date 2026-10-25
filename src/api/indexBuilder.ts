/**
 * Construction de l'index léger à partir de PokeAPI.
 * Partagé entre `scripts/build-index.ts` (au build) et l'app (repli si l'index statique manque).
 */
import { idFromUrl, pokeapi } from './pokeapi';
import { toIndexEntry } from './normalize';
import type { Pokemon, PokemonForm, PokemonSpecies } from './types';
import type { IndexEntry, PokedexIndex } from '../domain/models';

export const INDEX_VERSION = 1;

export interface BuildProgress {
  done: number;
  total: number;
}

/** Exécute des tâches avec une concurrence bornée, en conservant l'ordre des résultats. */
export async function mapPool<I, O>(items: readonly I[], concurrency: number, fn: (item: I, i: number) => Promise<O>): Promise<O[]> {
  const out = new Array<O>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i] as I, i);
    }
  });
  await Promise.all(workers);
  return out;
}

export interface BuildIndexOptions {
  concurrency?: number;
  onProgress?: (p: BuildProgress) => void;
  signal?: AbortSignal;
}

export async function buildIndex(opts: BuildIndexOptions = {}): Promise<PokedexIndex> {
  const concurrency = opts.concurrency ?? 12;
  const fetchOpts = opts.signal ? { signal: opts.signal } : {};
  const list = await pokeapi.list('pokemon', fetchOpts);
  const ids = list.results.map((r) => idFromUrl(r.url));

  const total = ids.length;
  let done = 0;
  const speciesCache = new Map<number, Promise<PokemonSpecies>>();
  const species = (id: number) => {
    let p = speciesCache.get(id);
    if (!p) {
      p = pokeapi.species(id, fetchOpts);
      speciesCache.set(id, p);
    }
    return p;
  };

  const entries = await mapPool(ids, concurrency, async (id): Promise<IndexEntry | null> => {
    try {
      const p: Pokemon = await pokeapi.pokemon(id, fetchOpts);
      const s = await species(idFromUrl(p.species.url));
      let form: PokemonForm | undefined;
      const formRef = p.forms[0];
      if (!p.is_default && formRef) form = await pokeapi.form(idFromUrl(formRef.url), fetchOpts).catch(() => undefined);
      return toIndexEntry(p, s, form);
    } catch (err) {
      if (opts.signal?.aborted) throw err;
      return null;
    } finally {
      done++;
      opts.onProgress?.({ done, total });
    }
  });

  const valid = entries.filter((e): e is IndexEntry => e !== null);
  valid.sort((a, b) => a.speciesId - b.speciesId || Number(b.isDefault) - Number(a.isDefault) || a.id - b.id);
  return { version: INDEX_VERSION, generatedAt: new Date().toISOString(), entries: valid };
}
