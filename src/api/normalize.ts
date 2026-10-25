/**
 * Transformation des réponses brutes PokeAPI en modèles de l'application.
 * Utilisé à la fois par l'app (fiches) et par `scripts/build-index.ts` (index).
 */
import { idFromUrl } from './pokeapi';
import type { LocationAreaEncounter, Name, Pokemon, PokemonForm, PokemonSpecies } from './types';
import { classifyForm, generationFromRoman } from '../domain/generations';
import { isTypeName } from '../domain/typeChart';
import {
  LANGS,
  STAT_KEYS,
  type BaseStats,
  type EncounterGroup,
  type IndexEntry,
  type Lang,
  type LocalizedNames,
  type PokemonDetail,
  type Rarity,
  type SpriteUrls,
  type TypeName,
} from '../domain/models';

const LANG_SET: ReadonlySet<string> = new Set(LANGS);

/** Convertit une liste de noms PokeAPI en dictionnaire par langue (repli `en` sur le slug). */
export function localizedNames(names: readonly Name[], fallback: string): LocalizedNames {
  const out: Partial<Record<Lang, string>> = {};
  for (const n of names) {
    const code = n.language.name;
    if (LANG_SET.has(code) && n.name) out[code as Lang] = n.name;
  }
  // Le japonais en kanji/kana est parfois absent alors que la version kana (« ja-hrkt ») existe.
  const kana = names.find((n) => n.language.name === 'ja-hrkt')?.name;
  if (!out.ja && kana) out.ja = kana;
  return { ...out, en: out.en ?? prettifySlug(fallback) };
}

export function prettifySlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Nettoie les entrées du Pokédex (sauts de ligne, caractères de contrôle des jeux). */
export function cleanFlavorText(text: string): string {
  return text
    .replace(/[\f\n\r­]/g, ' ')
    .replace(/\u000c/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/POKéMON/g, 'Pokémon')
    .trim();
}

export function baseStats(p: Pokemon): BaseStats {
  return STAT_KEYS.map((k) => p.stats.find((s) => s.stat.name === k)?.base_stat ?? 0) as BaseStats;
}

export function effortValues(p: Pokemon): BaseStats {
  return STAT_KEYS.map((k) => p.stats.find((s) => s.stat.name === k)?.effort ?? 0) as BaseStats;
}

export function pokemonTypes(p: Pokemon): TypeName[] {
  return [...p.types]
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name)
    .filter(isTypeName);
}

export function rarityOf(s: PokemonSpecies): Rarity {
  if (s.is_mythical) return 'mythical';
  if (s.is_legendary) return 'legendary';
  if (s.is_baby) return 'baby';
  return 'normal';
}

/** Nom localisé d'une forme : `names` du pokemon-form (« Méga-Dracaufeu X »), sinon `form_names`. */
export function formDisplayNames(form: PokemonForm | undefined, speciesNames: LocalizedNames): LocalizedNames | undefined {
  // Le pokemon-form d'une forme alternative est « par défaut » pour ce pokemon : seul l'appelant sait
  // s'il s'agit d'une variante, il ne passe `form` que pour les Pokémon non par défaut.
  if (!form) return undefined;
  if (form.names.length > 0) return localizedNames(form.names, form.name);
  const suffix = localizedNames(form.form_names, form.form_name);
  const out: Partial<Record<Lang, string>> = {};
  for (const lang of LANGS) {
    const base = speciesNames[lang];
    const sfx = suffix[lang] ?? suffix.en;
    if (base && sfx) out[lang] = `${base} (${sfx})`;
  }
  return { ...out, en: out.en ?? `${speciesNames.en} (${prettifySlug(form.form_name)})` };
}

export function toIndexEntry(p: Pokemon, s: PokemonSpecies, form?: PokemonForm): IndexEntry {
  const names = localizedNames(s.names, s.name);
  const { kind, region } = classifyForm(p.name, p.is_default);
  const entry: IndexEntry = {
    id: p.id,
    speciesId: s.id,
    slug: p.name,
    names,
    types: pokemonTypes(p),
    stats: baseStats(p),
    generation: generationFromRoman(s.generation.name),
    rarity: rarityOf(s),
    isDefault: p.is_default,
    formKind: kind,
  };
  const formNames = formDisplayNames(form, names);
  if (formNames) entry.formNames = formNames;
  if (region) entry.formRegion = region;
  return entry;
}

export function spriteUrls(p: Pokemon): SpriteUrls {
  const sp = p.sprites;
  const showdown = sp.other?.showdown;
  const bw = sp.versions?.['generation-v']?.['black-white']?.animated;
  return {
    artwork: sp.other?.['official-artwork']?.front_default ?? sp.other?.home?.front_default ?? sp.front_default,
    artworkShiny: sp.other?.['official-artwork']?.front_shiny ?? sp.other?.home?.front_shiny ?? sp.front_shiny,
    front: sp.front_default,
    frontShiny: sp.front_shiny,
    back: sp.back_default,
    backShiny: sp.back_shiny,
    animated: showdown?.front_default ?? bw?.front_default ?? null,
    animatedShiny: showdown?.front_shiny ?? bw?.front_shiny ?? null,
    animatedBack: showdown?.back_default ?? bw?.back_default ?? null,
    animatedBackShiny: showdown?.back_shiny ?? bw?.back_shiny ?? null,
    home: sp.other?.home?.front_default ?? null,
    homeShiny: sp.other?.home?.front_shiny ?? null,
  };
}

export function toPokemonDetail(p: Pokemon, s: PokemonSpecies, form?: PokemonForm): PokemonDetail {
  const names = localizedNames(s.names, s.name);
  const genera: Partial<Record<Lang, string>> = {};
  for (const g of s.genera) if (LANG_SET.has(g.language.name)) genera[g.language.name as Lang] = g.genus;

  const seen = new Set<string>();
  const flavorTexts = s.flavor_text_entries
    .map((f) => ({ lang: f.language.name, version: f.version.name, text: cleanFlavorText(f.flavor_text) }))
    .filter((f) => {
      const key = `${f.lang}|${f.version}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const detail: PokemonDetail = {
    id: p.id,
    speciesId: s.id,
    slug: p.name,
    names,
    genera,
    flavorTexts,
    types: pokemonTypes(p),
    stats: baseStats(p),
    evs: effortValues(p),
    heightM: p.height / 10,
    weightKg: p.weight / 10,
    baseExperience: p.base_experience,
    abilities: [...p.abilities]
      .sort((a, b) => a.slot - b.slot)
      .map((a) => ({ slug: a.ability.name, id: idFromUrl(a.ability.url), hidden: a.is_hidden })),
    eggGroups: s.egg_groups.map((e) => e.name),
    captureRate: s.capture_rate,
    baseHappiness: s.base_happiness,
    hatchCounter: s.hatch_counter,
    growthRate: s.growth_rate.name,
    femaleRatio: s.gender_rate < 0 ? null : s.gender_rate / 8,
    hasGenderDifferences: s.has_gender_differences,
    generation: generationFromRoman(s.generation.name),
    rarity: rarityOf(s),
    color: s.color.name,
    habitat: s.habitat?.name ?? null,
    evolutionChainId: s.evolution_chain ? idFromUrl(s.evolution_chain.url) : null,
    forms: s.varieties.map((v) => {
      const id = idFromUrl(v.pokemon.url);
      return { id, slug: v.pokemon.name, isDefault: v.is_default, kind: classifyForm(v.pokemon.name, v.is_default).kind };
    }),
    sprites: spriteUrls(p),
    cries: { latest: p.cries?.latest ?? null, legacy: p.cries?.legacy ?? null },
    games: p.game_indices.map((g) => g.version.name),
    isDefault: p.is_default,
  };
  const formNames = formDisplayNames(form, names);
  if (formNames) detail.formNames = formNames;
  return detail;
}

/** Regroupe les lieux de rencontre par version de jeu. */
export function groupEncounters(raw: readonly LocationAreaEncounter[]): EncounterGroup[] {
  const byVersion = new Map<string, EncounterGroup>();
  for (const area of raw) {
    for (const vd of area.version_details) {
      let group = byVersion.get(vd.version.name);
      if (!group) {
        group = { version: vd.version.name, locations: [] };
        byVersion.set(vd.version.name, group);
      }
      const levels = vd.encounter_details.flatMap((d) => [d.min_level, d.max_level]);
      group.locations.push({
        area: area.location_area.name,
        methods: [...new Set(vd.encounter_details.map((d) => d.method.name))],
        minLevel: levels.length ? Math.min(...levels) : 0,
        maxLevel: levels.length ? Math.max(...levels) : 0,
        chance: vd.max_chance,
      });
    }
  }
  return [...byVersion.values()];
}
