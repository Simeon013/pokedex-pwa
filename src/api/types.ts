/**
 * Types des réponses PokeAPI v2 effectivement consommées par l'application.
 * Seuls les champs utilisés sont typés ; les champs absents ici sont ignorés.
 * Référence : https://pokeapi.co/docs/v2
 */

export interface NamedAPIResource {
  name: string;
  url: string;
}

export interface APIResource {
  url: string;
}

export interface NamedAPIResourceList {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
}

export interface APIResourceList {
  count: number;
  next: string | null;
  previous: string | null;
  results: APIResource[];
}

export interface Name {
  name: string;
  language: NamedAPIResource;
}

export interface Genus {
  genus: string;
  language: NamedAPIResource;
}

export interface FlavorText {
  flavor_text: string;
  language: NamedAPIResource;
  version: NamedAPIResource;
}

export interface VerboseEffect {
  effect: string;
  short_effect: string;
  language: NamedAPIResource;
}

export interface AbilityFlavorText {
  flavor_text: string;
  language: NamedAPIResource;
  version_group: NamedAPIResource;
}

/* ---------- /pokemon/{id} ---------- */

export interface PokemonAbility {
  is_hidden: boolean;
  slot: number;
  ability: NamedAPIResource;
}

export interface PokemonType {
  slot: number;
  type: NamedAPIResource;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: NamedAPIResource;
}

export interface VersionGameIndex {
  game_index: number;
  version: NamedAPIResource;
}

export interface PokemonCries {
  latest: string | null;
  legacy: string | null;
}

export interface SpriteSet {
  front_default: string | null;
  front_shiny: string | null;
  front_female: string | null;
  front_shiny_female: string | null;
  back_default?: string | null;
  back_shiny?: string | null;
  back_female?: string | null;
  back_shiny_female?: string | null;
}

export interface PokemonSprites extends SpriteSet {
  back_default: string | null;
  back_shiny: string | null;
  other?: {
    'official-artwork'?: { front_default: string | null; front_shiny: string | null };
    home?: SpriteSet;
    showdown?: SpriteSet;
    dream_world?: { front_default: string | null; front_female: string | null };
  };
  versions?: {
    'generation-v'?: {
      'black-white'?: SpriteSet & { animated?: SpriteSet };
    };
  };
}

export interface Pokemon {
  id: number;
  name: string;
  base_experience: number | null;
  height: number; // décimètres
  weight: number; // hectogrammes
  is_default: boolean;
  order: number;
  abilities: PokemonAbility[];
  forms: NamedAPIResource[];
  game_indices: VersionGameIndex[];
  location_area_encounters: string;
  species: NamedAPIResource;
  sprites: PokemonSprites;
  cries?: PokemonCries;
  stats: PokemonStat[];
  types: PokemonType[];
}

/* ---------- /pokemon-species/{id} ---------- */

export interface PokemonSpeciesVariety {
  is_default: boolean;
  pokemon: NamedAPIResource;
}

export interface PokemonSpeciesDexEntry {
  entry_number: number;
  pokedex: NamedAPIResource;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  order: number;
  gender_rate: number; // -1 = asexué, sinon huitièmes de femelles
  capture_rate: number;
  base_happiness: number | null;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  hatch_counter: number | null;
  has_gender_differences: boolean;
  forms_switchable: boolean;
  growth_rate: NamedAPIResource;
  pokedex_numbers: PokemonSpeciesDexEntry[];
  egg_groups: NamedAPIResource[];
  color: NamedAPIResource;
  shape: NamedAPIResource | null;
  evolves_from_species: NamedAPIResource | null;
  evolution_chain: APIResource | null;
  habitat: NamedAPIResource | null;
  generation: NamedAPIResource;
  names: Name[];
  flavor_text_entries: FlavorText[];
  genera: Genus[];
  varieties: PokemonSpeciesVariety[];
}

/* ---------- /pokemon-form/{id} ---------- */

export interface PokemonForm {
  id: number;
  name: string;
  form_name: string;
  is_default: boolean;
  is_battle_only: boolean;
  is_mega: boolean;
  pokemon: NamedAPIResource;
  names: Name[];
  form_names: Name[];
  version_group: NamedAPIResource;
}

/* ---------- /evolution-chain/{id} ---------- */

export interface EvolutionDetail {
  trigger: NamedAPIResource;
  item: NamedAPIResource | null;
  held_item: NamedAPIResource | null;
  known_move: NamedAPIResource | null;
  known_move_type: NamedAPIResource | null;
  location: NamedAPIResource | null;
  party_species: NamedAPIResource | null;
  party_type: NamedAPIResource | null;
  trade_species: NamedAPIResource | null;
  gender: number | null; // 1 = femelle, 2 = mâle
  min_level: number | null;
  min_happiness: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  needs_overworld_rain: boolean;
  relative_physical_stats: number | null; // 1 Atk>Déf, 0 égal, -1 Atk<Déf
  time_of_day: string; // '', 'day', 'night', 'dusk'
  turn_upside_down: boolean;
}

export interface ChainLink {
  is_baby: boolean;
  species: NamedAPIResource;
  evolution_details: EvolutionDetail[];
  evolves_to: ChainLink[];
}

export interface EvolutionChain {
  id: number;
  baby_trigger_item: NamedAPIResource | null;
  chain: ChainLink;
}

/* ---------- /pokemon/{id}/encounters ---------- */

export interface EncounterDetail {
  min_level: number;
  max_level: number;
  chance: number;
  method: NamedAPIResource;
  condition_values: NamedAPIResource[];
}

export interface VersionEncounterDetail {
  version: NamedAPIResource;
  max_chance: number;
  encounter_details: EncounterDetail[];
}

export interface LocationAreaEncounter {
  location_area: NamedAPIResource;
  version_details: VersionEncounterDetail[];
}

/* ---------- ressources « nommées » (traductions) ---------- */

export interface Ability {
  id: number;
  name: string;
  names: Name[];
  effect_entries: VerboseEffect[];
  flavor_text_entries: AbilityFlavorText[];
}

/** Ressource minimale qui expose des noms traduits (item, version, egg-group, location-area…). */
export interface LocalizedResource {
  id: number;
  name: string;
  names: Name[];
}
