/**
 * Recherche, filtrage et tri de l'index. Fonctions pures, sans dépendance UI.
 */
import { HISUI_SPECIES, regionOfGeneration, type Region } from './generations';
import { STAT_KEYS, type IndexEntry, type Lang, type StatKey, type TypeName } from './models';
import { statTotal } from './stats';

export type SortKey = 'id' | 'name' | 'total' | StatKey;
export type SortDir = 'asc' | 'desc';
export type RarityFilter = 'all' | 'legendary' | 'mythical' | 'legendary-or-mythical' | 'baby' | 'regular';

export interface FilterState {
  query: string;
  types: TypeName[];
  /** 'all' : le Pokémon doit avoir tous les types cochés ; 'any' : au moins un. */
  typeMode: 'all' | 'any';
  generations: number[];
  regions: Region[];
  rarity: RarityFilter;
  onlyFavorites: boolean;
  onlyShinyFound: boolean;
  onlyCaught: boolean;
  onlySeen: boolean;
  includeForms: boolean;
  sort: SortKey;
  dir: SortDir;
}

export const DEFAULT_FILTERS: FilterState = {
  query: '',
  types: [],
  typeMode: 'all',
  generations: [],
  regions: [],
  rarity: 'all',
  onlyFavorites: false,
  onlyShinyFound: false,
  onlyCaught: false,
  onlySeen: false,
  includeForms: false,
  sort: 'id',
  dir: 'asc',
};

export interface CollectionSets {
  favorites: ReadonlySet<number>;
  shinyFound: ReadonlySet<number>;
  caught: ReadonlySet<number>;
  seen: ReadonlySet<number>;
}

const EMPTY: ReadonlySet<number> = new Set();
export const EMPTY_COLLECTION: CollectionSets = { favorites: EMPTY, shinyFound: EMPTY, caught: EMPTY, seen: EMPTY };

/** Minuscules, sans accents ni ponctuation : "Méga-Dracaufeu X" → "mega dracaufeu x". */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[♀]/g, ' f')
    .replace(/[♂]/g, ' m')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function displayName(entry: IndexEntry, lang: Lang): string {
  if (entry.formNames) return entry.formNames[lang] ?? entry.formNames.en;
  return entry.names[lang] ?? entry.names.en;
}

/** Texte de recherche pré-calculé (tous noms, toutes langues, slug, numéro). */
const haystackCache = new WeakMap<IndexEntry, string>();
function haystack(e: IndexEntry): string {
  let h = haystackCache.get(e);
  if (h === undefined) {
    const parts = [e.slug, ...Object.values(e.names), ...(e.formNames ? Object.values(e.formNames) : [])];
    h = ` ${parts.map(normalizeText).join(' | ')} `;
    haystackCache.set(e, h);
  }
  return h;
}

/** Interprète "25", "#25", "025", "n°25" comme un numéro. */
export function parseNumberQuery(q: string): number | null {
  const m = /^(?:#|n[°o]?\s*)?0*(\d{1,5})$/i.exec(q.trim());
  return m?.[1] ? Number(m[1]) : null;
}

/**
 * Score de pertinence (plus petit = meilleur), ou null si pas de correspondance.
 * 0 : numéro exact · 1 : nom exact · 2 : préfixe de nom · 3 : début de mot · 4 : sous-chaîne.
 */
export function matchScore(entry: IndexEntry, query: string, lang: Lang): number | null {
  const num = parseNumberQuery(query);
  if (num !== null) {
    if (entry.speciesId === num || entry.id === num) return 0;
    return String(entry.speciesId).startsWith(String(num)) ? 4 : null;
  }
  const q = normalizeText(query);
  if (!q) return 5;
  const own = normalizeText(displayName(entry, lang));
  if (own === q) return 1;
  if (own.startsWith(q)) return 2;
  const h = haystack(entry);
  if (h.includes(` ${q}`)) return 3;
  if (h.includes(q)) return 4;
  return null;
}

function entryRegions(e: IndexEntry): Region[] {
  const regions: Region[] = [];
  if (e.formRegion) regions.push(e.formRegion as Region);
  else {
    const r = regionOfGeneration(e.generation);
    if (r) regions.push(r);
    if (HISUI_SPECIES.has(e.speciesId)) regions.push('hisui');
  }
  return regions;
}

function matchesRarity(e: IndexEntry, r: RarityFilter): boolean {
  switch (r) {
    case 'all': return true;
    case 'legendary': return e.rarity === 'legendary';
    case 'mythical': return e.rarity === 'mythical';
    case 'legendary-or-mythical': return e.rarity === 'legendary' || e.rarity === 'mythical';
    case 'baby': return e.rarity === 'baby';
    case 'regular': return e.rarity === 'normal' || e.rarity === 'baby';
  }
}

export function matchesFilters(e: IndexEntry, f: FilterState, c: CollectionSets): boolean {
  if (!f.includeForms && !e.isDefault) return false;
  if (f.types.length > 0) {
    const ok = f.typeMode === 'all' ? f.types.every((t) => e.types.includes(t)) : f.types.some((t) => e.types.includes(t));
    if (!ok) return false;
  }
  if (f.generations.length > 0 && !f.generations.includes(e.generation)) return false;
  if (f.regions.length > 0 && !entryRegions(e).some((r) => f.regions.includes(r))) return false;
  if (!matchesRarity(e, f.rarity)) return false;
  if (f.onlyFavorites && !c.favorites.has(e.id)) return false;
  if (f.onlyShinyFound && !c.shinyFound.has(e.id)) return false;
  if (f.onlyCaught && !c.caught.has(e.id)) return false;
  if (f.onlySeen && !c.seen.has(e.id)) return false;
  return true;
}

function sortValue(e: IndexEntry, key: SortKey): number {
  if (key === 'id') return e.speciesId * 100_000 + e.id;
  if (key === 'total') return statTotal(e.stats);
  if (key === 'name') return 0;
  return e.stats[STAT_KEYS.indexOf(key)] ?? 0;
}

export function compareEntries(a: IndexEntry, b: IndexEntry, key: SortKey, dir: SortDir, lang: Lang): number {
  let r: number;
  if (key === 'name') {
    r = displayName(a, lang).localeCompare(displayName(b, lang), lang);
  } else {
    r = sortValue(a, key) - sortValue(b, key);
  }
  if (r === 0) r = a.speciesId - b.speciesId || a.id - b.id;
  return dir === 'asc' ? r : -r;
}

/**
 * Applique recherche + filtres + tri. Avec une recherche, les meilleurs scores
 * passent devant, puis l'ordre demandé départage.
 */
export function applyFilters(entries: readonly IndexEntry[], f: FilterState, c: CollectionSets, lang: Lang): IndexEntry[] {
  const query = f.query.trim();
  const scored: Array<{ e: IndexEntry; s: number }> = [];
  for (const e of entries) {
    // Une recherche inclut les formes alternatives même si elles sont masquées par défaut.
    if (!matchesFilters(e, query ? { ...f, includeForms: true } : f, c)) continue;
    if (query) {
      const s = matchScore(e, query, lang);
      if (s === null) continue;
      // Formes masquées : visibles en recherche seulement si un de leurs noms commence par la requête.
      if (!f.includeForms && !e.isDefault && s > 3) continue;
      scored.push({ e, s });
    } else {
      scored.push({ e, s: 0 });
    }
  }
  scored.sort((x, y) => x.s - y.s || compareEntries(x.e, y.e, f.sort, f.dir, lang));
  return scored.map((x) => x.e);
}

/** Suggestions instantanées pour la barre de recherche. */
export function suggest(entries: readonly IndexEntry[], query: string, lang: Lang, limit = 8): IndexEntry[] {
  if (!query.trim()) return [];
  const scored: Array<{ e: IndexEntry; s: number }> = [];
  for (const e of entries) {
    const s = matchScore(e, query, lang);
    if (s !== null) scored.push({ e, s: s + (e.isDefault ? 0 : 0.5) });
  }
  scored.sort((x, y) => x.s - y.s || x.e.speciesId - y.e.speciesId || x.e.id - y.e.id);
  return scored.slice(0, limit).map((x) => x.e);
}

/** Nombre de filtres actifs (pour le badge du bouton « Filtres »). */
export function activeFilterCount(f: FilterState): number {
  return (
    (f.types.length > 0 ? 1 : 0) +
    (f.generations.length > 0 ? 1 : 0) +
    (f.regions.length > 0 ? 1 : 0) +
    (f.rarity !== 'all' ? 1 : 0) +
    [f.onlyFavorites, f.onlyShinyFound, f.onlyCaught, f.onlySeen, f.includeForms].filter(Boolean).length
  );
}
