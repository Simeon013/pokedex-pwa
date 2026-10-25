/**
 * Base IndexedDB (Dexie) : cache des données PokeAPI normalisées, géométries 3D
 * et stockage clé/valeur pour l'état persistant (Zustand).
 */
import Dexie, { type EntityTable } from 'dexie';

export interface CacheRecord {
  /** Clé logique : "index", "detail:25", "evolution:10", "name:item/fire-stone"… */
  key: string;
  value: unknown;
  /** Horodatage (ms) de la dernière récupération réseau. */
  updatedAt: number;
  /** Version de schéma de la valeur : une valeur d'une ancienne version est ignorée. */
  schema: number;
}

export interface GeometryRecord {
  key: string;
  positions: ArrayBuffer;
  normals: ArrayBuffer;
  colors: ArrayBuffer;
  index: ArrayBuffer | null;
  /** Données d'instances pour le mode voxels (matrices + couleurs). */
  instances: ArrayBuffer | null;
  instanceColors: ArrayBuffer | null;
  instanceCount: number;
  bounds: [number, number, number];
  createdAt: number;
}

export interface KvRecord {
  key: string;
  value: string;
}

export class PokedexDB extends Dexie {
  cache!: EntityTable<CacheRecord, 'key'>;
  geometry!: EntityTable<GeometryRecord, 'key'>;
  kv!: EntityTable<KvRecord, 'key'>;

  constructor(name = 'pokedex') {
    super(name);
    this.version(1).stores({
      cache: 'key, updatedAt',
      geometry: 'key, createdAt',
      kv: 'key',
    });
  }
}

export const db = new PokedexDB();

/** Taille approximative occupée par l'origine (si l'API Storage est disponible). */
export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}

/** Demande un stockage persistant (évite l'éviction du cache hors ligne). */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}

export async function clearDataCache(): Promise<void> {
  await Promise.all([db.cache.clear(), db.geometry.clear()]);
}
