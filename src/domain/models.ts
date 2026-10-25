/**
 * Modèles internes de l'application, indépendants du format brut de PokeAPI.
 * L'index léger (`public/data/index.json`) et les fiches détaillées en dérivent.
 */

export const LANGS = ['fr', 'en', 'de', 'es', 'it', 'ja', 'ko', 'zh-hans'] as const;
export type Lang = (typeof LANGS)[number];

/** Noms par langue. `en` est toujours présent (repli). */
export type LocalizedNames = Partial<Record<Lang, string>> & { en: string };

export const TYPE_NAMES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;
export type TypeName = (typeof TYPE_NAMES)[number];

export const STAT_KEYS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
/** Stats de base dans l'ordre de STAT_KEYS. */
export type BaseStats = [number, number, number, number, number, number];

export type FormKind = 'default' | 'mega' | 'gmax' | 'regional' | 'other';
export type Rarity = 'normal' | 'legendary' | 'mythical' | 'baby';

/** Une entrée de l'index léger : de quoi lister, chercher, filtrer et trier sans réseau. */
export interface IndexEntry {
  /** Identifiant /pokemon/{id} (≥ 10001 pour les formes alternatives). */
  id: number;
  /** Numéro national de l'espèce. */
  speciesId: number;
  /** Slug PokeAPI : "charizard-mega-x". */
  slug: string;
  /** Noms de l'espèce. */
  names: LocalizedNames;
  /** Nom de la forme, si différente de la forme par défaut ("Méga-Dracaufeu X"). */
  formNames?: LocalizedNames;
  types: TypeName[];
  stats: BaseStats;
  generation: number;
  rarity: Rarity;
  isDefault: boolean;
  formKind: FormKind;
  /** Région d'une forme régionale (alola, galar, hisui, paldea). */
  formRegion?: string;
}

export interface PokedexIndex {
  version: number;
  generatedAt: string;
  entries: IndexEntry[];
}

/* ---------- Fiche détaillée ---------- */

export interface SpriteUrls {
  artwork: string | null;
  artworkShiny: string | null;
  front: string | null;
  frontShiny: string | null;
  back: string | null;
  backShiny: string | null;
  animated: string | null;
  animatedShiny: string | null;
  animatedBack: string | null;
  animatedBackShiny: string | null;
  home: string | null;
  homeShiny: string | null;
}

export interface AbilityRef {
  slug: string;
  id: number;
  hidden: boolean;
}

export interface FlavorEntry {
  lang: string;
  version: string;
  text: string;
}

export interface FormRef {
  id: number;
  slug: string;
  isDefault: boolean;
  kind: FormKind;
}

/** Genre : proportion de femelles (0..1), ou null si asexué. */
export type FemaleRatio = number | null;

export interface PokemonDetail {
  id: number;
  speciesId: number;
  slug: string;
  names: LocalizedNames;
  formNames?: LocalizedNames;
  /** Catégorie par langue : "Pokémon Graine". */
  genera: Partial<Record<Lang, string>>;
  flavorTexts: FlavorEntry[];
  types: TypeName[];
  stats: BaseStats;
  evs: BaseStats;
  heightM: number;
  weightKg: number;
  baseExperience: number | null;
  abilities: AbilityRef[];
  eggGroups: string[];
  captureRate: number;
  baseHappiness: number | null;
  hatchCounter: number | null;
  growthRate: string;
  femaleRatio: FemaleRatio;
  hasGenderDifferences: boolean;
  generation: number;
  rarity: Rarity;
  color: string;
  habitat: string | null;
  evolutionChainId: number | null;
  forms: FormRef[];
  sprites: SpriteUrls;
  cries: { latest: string | null; legacy: string | null };
  /** Versions de jeu dans lesquelles le Pokémon a un index (présence dans les jeux). */
  games: string[];
  isDefault: boolean;
}

/* ---------- Évolutions ---------- */

export type EvolutionCondition =
  | { kind: 'level'; value: number }
  | { kind: 'item'; item: string }
  | { kind: 'held-item'; item: string }
  | { kind: 'happiness'; value: number }
  | { kind: 'affection'; value: number }
  | { kind: 'beauty'; value: number }
  | { kind: 'time'; value: 'day' | 'night' | 'dusk' }
  | { kind: 'known-move'; move: string }
  | { kind: 'known-move-type'; type: string }
  | { kind: 'location'; location: string }
  | { kind: 'party-species'; species: string }
  | { kind: 'party-type'; type: string }
  | { kind: 'trade-species'; species: string }
  | { kind: 'gender'; value: 'female' | 'male' }
  | { kind: 'rain' }
  | { kind: 'upside-down' }
  | { kind: 'physical-stats'; value: 'atk>def' | 'atk=def' | 'atk<def' }
  | { kind: 'trigger'; trigger: string };

/** Une manière d'évoluer : toutes les conditions doivent être réunies. */
export interface EvolutionMethod {
  trigger: string;
  conditions: EvolutionCondition[];
}

export interface EvolutionNode {
  speciesId: number;
  slug: string;
  isBaby: boolean;
  /** Méthodes alternatives (OU) pour évoluer depuis le parent. Vide pour la racine. */
  methods: EvolutionMethod[];
  children: EvolutionNode[];
}

/* ---------- Rencontres ---------- */

export interface EncounterGroup {
  version: string;
  locations: Array<{
    area: string;
    methods: string[];
    minLevel: number;
    maxLevel: number;
    chance: number;
  }>;
}
