/**
 * Accès aux données pour l'interface : combine le client PokeAPI, la normalisation
 * et le cache persistant. C'est la seule API de données que les composants utilisent.
 */
import { getOrFetch, type CacheOptions } from '@/db/cache';
import { buildEvolutionTree } from '@/domain/evolution';
import type { EncounterGroup, EvolutionNode, IndexEntry, Lang, LocalizedNames, PokedexIndex, PokemonDetail } from '@/domain/models';
import { buildIndex, INDEX_VERSION, type BuildProgress } from './indexBuilder';
import { groupEncounters, localizedNames, toPokemonDetail } from './normalize';
import { ApiError, idFromUrl, pokeapi, type LocalizedKind } from './pokeapi';

/** L'index statique est servi par l'app elle-même (précaché par le Service Worker). */
async function fetchStaticIndex(): Promise<PokedexIndex> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/index.json`);
  if (!res.ok) throw new ApiError('http', 'data/index.json', res.status);
  const data = (await res.json()) as PokedexIndex;
  if (data.version !== INDEX_VERSION || !Array.isArray(data.entries) || data.entries.length === 0) {
    throw new ApiError('http', 'data/index.json', undefined, 'Index statique invalide');
  }
  return data;
}

/**
 * Charge l'index : cache → fichier statique → reconstruction depuis l'API (lente, ~2 400 requêtes,
 * avec progression). La reconstruction n'a lieu que si les deux premières sources échouent.
 */
export async function loadIndex(onProgress?: (p: BuildProgress) => void, opts: CacheOptions<PokedexIndex> = {}): Promise<PokedexIndex> {
  return getOrFetch(
    'index',
    async () => {
      try {
        return await fetchStaticIndex();
      } catch {
        return buildIndex(onProgress ? { onProgress } : {});
      }
    },
    { maxAge: 7 * 24 * 60 * 60 * 1000, ...opts },
  );
}

export function loadPokemonDetail(id: number, opts?: CacheOptions<PokemonDetail>): Promise<PokemonDetail> {
  return getOrFetch(
    `detail:${id}`,
    async () => {
      const p = await pokeapi.pokemon(id);
      const s = await pokeapi.species(idFromUrl(p.species.url));
      const formRef = p.forms[0];
      const form = !p.is_default && formRef ? await pokeapi.form(idFromUrl(formRef.url)).catch(() => undefined) : undefined;
      return toPokemonDetail(p, s, form);
    },
    opts,
  );
}

export function loadEvolution(chainId: number, opts?: CacheOptions<EvolutionNode>): Promise<EvolutionNode> {
  return getOrFetch(`evolution:${chainId}`, async () => buildEvolutionTree(await pokeapi.evolutionChain(chainId)), opts);
}

export function loadEncounters(id: number, opts?: CacheOptions<EncounterGroup[]>): Promise<EncounterGroup[]> {
  return getOrFetch(`encounters:${id}`, async () => groupEncounters(await pokeapi.encounters(id)), opts);
}

export function loadLocalizedNames(kind: LocalizedKind, slug: string): Promise<LocalizedNames> {
  return getOrFetch(`name:${kind}/${slug}`, async () => {
    const r = await pokeapi.localized(kind, slug);
    return localizedNames(r.names, r.name);
  });
}

export interface AbilityInfo {
  id: number;
  slug: string;
  names: LocalizedNames;
  /** Description courte par langue (effet, sinon dernière entrée de jeu). */
  descriptions: Partial<Record<Lang, string>>;
}

export function loadAbility(id: number): Promise<AbilityInfo> {
  return getOrFetch(`ability:${id}`, async () => {
    const a = await pokeapi.ability(id);
    const descriptions: Partial<Record<Lang, string>> = {};
    // Les entrées de jeu les plus récentes sont en fin de liste : on garde la dernière par langue.
    for (const f of a.flavor_text_entries) descriptions[f.language.name as Lang] = f.flavor_text.replace(/\s+/g, ' ').trim();
    for (const e of a.effect_entries) if (e.language.name === 'en' || e.language.name === 'fr') {
      descriptions[e.language.name] ??= e.short_effect.replace(/\s+/g, ' ').trim();
    }
    return { id: a.id, slug: a.name, names: localizedNames(a.names, a.name), descriptions };
  });
}

/** Précharge les fiches voisines (navigation ← →) sans bloquer. */
export function prefetchDetails(entries: readonly IndexEntry[]): void {
  for (const e of entries) void loadPokemonDetail(e.id).catch(() => undefined);
}
