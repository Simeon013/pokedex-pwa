/**
 * Client d'accès à PokeAPI v2.
 *
 * - Deux sources interchangeables : l'API officielle et son miroir statique
 *   (dépôt PokeAPI/api-data servi par raw.githubusercontent.com, mêmes JSON).
 *   Si l'API est injoignable, le client bascule sur le miroir et y reste
 *   quelques minutes avant de retenter l'API.
 * - Retry avec backoff exponentiel sur les erreurs réseau et 5xx/429.
 * - Déduplication des requêtes identiques en cours.
 * - Support d'AbortSignal et timeout.
 *
 * Ce module ne gère pas la persistance : voir `src/db/cache.ts` et `src/api/queries.ts`.
 */
import type {
  Ability,
  EvolutionChain,
  LocalizedResource,
  LocationAreaEncounter,
  NamedAPIResourceList,
  Pokemon,
  PokemonForm,
  PokemonSpecies,
} from './types';

export const API_BASE = 'https://pokeapi.co/api/v2';
export const MIRROR_BASE = 'https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2';

const MIRROR_STICKY_MS = 5 * 60_000;
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_RETRIES = 2;

export type ApiErrorKind = 'offline' | 'not-found' | 'network' | 'http' | 'timeout' | 'aborted';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  readonly path: string;

  constructor(kind: ApiErrorKind, path: string, status?: number, message?: string) {
    super(message ?? `PokeAPI ${kind}${status ? ` (${status})` : ''} : ${path}`);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.path = path;
  }

  get retryable(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'offline' ||
      (this.kind === 'http' && (this.status === undefined || this.status >= 500 || this.status === 429));
  }
}

export interface FetchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
}

/** Fonction fetch injectable (tests, script Node). */
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

let fetchImpl: FetchLike = (input, init) => globalThis.fetch(input, init);
let mirrorUntil = 0;
const inflight = new Map<string, Promise<unknown>>();

export function setFetchImplementation(fn: FetchLike): void {
  fetchImpl = fn;
}

/** Réinitialise l'état interne (tests). */
export function resetClientState(): void {
  mirrorUntil = 0;
  inflight.clear();
}

/**
 * Normalise une référence de ressource en chemin relatif sans slash final :
 * "https://pokeapi.co/api/v2/pokemon/1/" | "/api/v2/pokemon/1/" | "pokemon/1" → "pokemon/1".
 * Une éventuelle query string est conservée ("pokemon?limit=20").
 */
export function toPath(ref: string): string {
  let p = ref.trim();
  const apiIdx = p.indexOf('/api/v2/');
  if (apiIdx >= 0) p = p.slice(apiIdx + '/api/v2/'.length);
  const [pathname = '', query] = p.split('?');
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  return query ? `${clean}?${query}` : clean;
}

/** Extrait l'identifiant numérique final d'une URL PokeAPI ("…/pokemon-species/25/" → 25). */
export function idFromUrl(url: string): number {
  const m = /\/(\d+)\/?$/.exec(url.trim());
  if (!m?.[1]) throw new Error(`URL PokeAPI sans identifiant : ${url}`);
  return Number(m[1]);
}

/** Le miroir statique ignore la pagination : il renvoie toujours la liste complète. */
export function urlFor(base: 'api' | 'mirror', path: string): string {
  const [pathname = '', query] = path.split('?');
  if (base === 'mirror') return `${MIRROR_BASE}/${pathname}/index.json`;
  return `${API_BASE}/${pathname}/${query ? `?${query}` : ''}`;
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new ApiError('aborted', ''));
    }, { once: true });
  });

async function fetchOnce<T>(url: string, path: string, opts: FetchOptions): Promise<T> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  opts.signal?.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => controller.abort('timeout'), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (res.status === 404) throw new ApiError('not-found', path, 404);
    if (!res.ok) throw new ApiError('http', path, res.status);
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (opts.signal?.aborted) throw new ApiError('aborted', path);
    if (controller.signal.aborted) throw new ApiError('timeout', path);
    throw new ApiError(isOffline() ? 'offline' : 'network', path, undefined, String(err));
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onAbort);
  }
}

/** Essaie la source préférée puis l'autre ; une 404 sur les deux est définitive. */
async function fetchFromSources<T>(path: string, opts: FetchOptions): Promise<T> {
  const order: Array<'api' | 'mirror'> = Date.now() < mirrorUntil ? ['mirror', 'api'] : ['api', 'mirror'];
  let lastError: ApiError | undefined;
  for (const source of order) {
    try {
      const data = await fetchOnce<T>(urlFor(source, path), path, opts);
      if (source === 'mirror' && order[0] === 'api') mirrorUntil = Date.now() + MIRROR_STICKY_MS;
      if (source === 'api') mirrorUntil = 0;
      return data;
    } catch (err) {
      const e = err as ApiError;
      if (e.kind === 'aborted') throw e;
      lastError = e;
    }
  }
  throw lastError ?? new ApiError('network', path);
}

/** Requête JSON typée avec retry, backoff et déduplication. */
export function fetchJson<T>(ref: string, opts: FetchOptions = {}): Promise<T> {
  const path = toPath(ref);
  const existing = inflight.get(path);
  if (existing && !opts.signal) return existing as Promise<T>;

  const run = async (): Promise<T> => {
    if (isOffline()) throw new ApiError('offline', path);
    const retries = opts.retries ?? DEFAULT_RETRIES;
    for (let attempt = 0; ; attempt++) {
      try {
        return await fetchFromSources<T>(path, opts);
      } catch (err) {
        const e = err as ApiError;
        if (!e.retryable || attempt >= retries) throw e;
        await sleep(400 * 2 ** attempt + Math.random() * 200, opts.signal);
      }
    }
  };

  const p = run().finally(() => inflight.delete(path));
  if (!opts.signal) inflight.set(path, p);
  return p;
}

/* ---------- Endpoints typés ---------- */

type Ref = number | string;

export const pokeapi = {
  pokemon: (id: Ref, o?: FetchOptions) => fetchJson<Pokemon>(`pokemon/${id}`, o),
  species: (id: Ref, o?: FetchOptions) => fetchJson<PokemonSpecies>(`pokemon-species/${id}`, o),
  form: (id: Ref, o?: FetchOptions) => fetchJson<PokemonForm>(`pokemon-form/${id}`, o),
  evolutionChain: (id: Ref, o?: FetchOptions) => fetchJson<EvolutionChain>(`evolution-chain/${id}`, o),
  encounters: (id: Ref, o?: FetchOptions) => fetchJson<LocationAreaEncounter[]>(`pokemon/${id}/encounters`, o),
  ability: (id: Ref, o?: FetchOptions) => fetchJson<Ability>(`ability/${id}`, o),
  /** Ressource exposant des `names` traduits : item, version, egg-group, location-area, location… */
  localized: (kind: LocalizedKind, id: Ref, o?: FetchOptions) => fetchJson<LocalizedResource>(`${kind}/${id}`, o),
  /** Liste complète d'un endpoint (une seule requête, limit élevé ; le miroir renvoie tout). */
  list: (kind: string, o?: FetchOptions) => fetchJson<NamedAPIResourceList>(`${kind}?limit=100000`, o),
};

export type LocalizedKind =
  | 'item'
  | 'version'
  | 'version-group'
  | 'egg-group'
  | 'location'
  | 'location-area'
  | 'move'
  | 'pokemon-habitat'
  | 'encounter-method'
  | 'evolution-trigger';
