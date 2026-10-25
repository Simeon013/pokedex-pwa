/**
 * Cache à deux niveaux (mémoire LRU + IndexedDB) avec stratégie stale-while-revalidate :
 *
 * - valeur fraîche en cache → renvoyée immédiatement ;
 * - valeur périmée → renvoyée immédiatement, puis rafraîchie en arrière-plan
 *   (le rappel `onUpdate` reçoit la nouvelle valeur) ;
 * - absente → récupérée sur le réseau puis stockée ;
 * - réseau en échec mais valeur périmée disponible → la valeur périmée est renvoyée.
 */
import { db, type CacheRecord } from './dexie';

export const SCHEMA_VERSION = 1;
const DAY = 24 * 60 * 60 * 1000;
/** Les données PokeAPI changent rarement : 30 jours avant revalidation. */
export const DEFAULT_MAX_AGE = 30 * DAY;

export interface CacheOptions<T> {
  maxAge?: number;
  /** Appelé si une revalidation en arrière-plan produit une nouvelle valeur. */
  onUpdate?: (value: T) => void;
  /** Ignore la valeur en cache et force le réseau (bouton « réessayer »/rafraîchir). */
  force?: boolean;
}

class LRU<V> {
  private map = new Map<string, V>();
  constructor(private readonly max: number) {}
  get(key: string): V | undefined {
    const v = this.map.get(key);
    if (v !== undefined) {
      this.map.delete(key);
      this.map.set(key, v);
    }
    return v;
  }
  set(key: string, value: V): void {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }
  delete(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

const memory = new LRU<CacheRecord>(400);
const revalidating = new Set<string>();

async function readRecord(key: string): Promise<CacheRecord | undefined> {
  const mem = memory.get(key);
  if (mem) return mem;
  try {
    const rec = await db.cache.get(key);
    if (rec && rec.schema === SCHEMA_VERSION) {
      memory.set(key, rec);
      return rec;
    }
  } catch {
    // IndexedDB indisponible (navigation privée stricte…) : on se contente du réseau.
  }
  return undefined;
}

async function writeRecord(key: string, value: unknown): Promise<CacheRecord> {
  const rec: CacheRecord = { key, value, updatedAt: Date.now(), schema: SCHEMA_VERSION };
  memory.set(key, rec);
  try {
    await db.cache.put(rec);
  } catch {
    // Quota dépassé ou IndexedDB indisponible : la valeur reste en mémoire.
  }
  return rec;
}

export async function getCached<T>(key: string): Promise<T | undefined> {
  return (await readRecord(key))?.value as T | undefined;
}

export async function setCached<T>(key: string, value: T): Promise<void> {
  await writeRecord(key, value);
}

/** Lecture synchrone depuis la mémoire uniquement (rendu initial sans flash de skeleton). */
export function peekMemory<T>(key: string): T | undefined {
  return memory.get(key)?.value as T | undefined;
}

export async function getOrFetch<T>(key: string, fetcher: () => Promise<T>, opts: CacheOptions<T> = {}): Promise<T> {
  const maxAge = opts.maxAge ?? DEFAULT_MAX_AGE;
  const rec = opts.force ? undefined : await readRecord(key);

  if (rec) {
    const stale = Date.now() - rec.updatedAt > maxAge;
    if (stale && !revalidating.has(key)) {
      revalidating.add(key);
      fetcher()
        .then(async (fresh) => {
          await writeRecord(key, fresh);
          opts.onUpdate?.(fresh);
        })
        .catch(() => undefined)
        .finally(() => revalidating.delete(key));
    }
    return rec.value as T;
  }

  try {
    const value = await fetcher();
    await writeRecord(key, value);
    return value;
  } catch (err) {
    if (opts.force) {
      const fallback = await readRecord(key);
      if (fallback) return fallback.value as T;
    }
    throw err;
  }
}

export async function invalidate(key: string): Promise<void> {
  memory.delete(key);
  try {
    await db.cache.delete(key);
  } catch {
    // ignoré
  }
}

/** Vide le cache mémoire (tests). */
export function resetMemoryCache(): void {
  memory.clear();
  revalidating.clear();
}
