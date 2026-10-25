/**
 * Générations, régions et classification des formes alternatives.
 */
import type { FormKind } from './models';

export interface GenerationInfo {
  id: number;
  roman: string;
  region: string;
  /** Plage de numéros nationaux [début, fin] inclusifs. */
  range: [number, number];
}

export const GENERATIONS: GenerationInfo[] = [
  { id: 1, roman: 'I', region: 'kanto', range: [1, 151] },
  { id: 2, roman: 'II', region: 'johto', range: [152, 251] },
  { id: 3, roman: 'III', region: 'hoenn', range: [252, 386] },
  { id: 4, roman: 'IV', region: 'sinnoh', range: [387, 493] },
  { id: 5, roman: 'V', region: 'unova', range: [494, 649] },
  { id: 6, roman: 'VI', region: 'kalos', range: [650, 721] },
  { id: 7, roman: 'VII', region: 'alola', range: [722, 809] },
  { id: 8, roman: 'VIII', region: 'galar', range: [810, 905] },
  { id: 9, roman: 'IX', region: 'paldea', range: [906, 1025] },
];

/** Régions filtrables : celles des générations, plus Hisui (formes et espèces de Légendes Arceus). */
export const REGIONS = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'] as const;
export type Region = (typeof REGIONS)[number];

/** Espèces introduites par Légendes Pokémon : Arceus (rattachées à la génération 8). */
export const HISUI_SPECIES: ReadonlySet<number> = new Set([899, 900, 901, 902, 903, 904, 905]);

export function generationFromRoman(name: string): number {
  // "generation-iv" → 4
  const roman = name.replace('generation-', '').toUpperCase();
  const g = GENERATIONS.find((x) => x.roman === roman);
  if (!g) throw new Error(`Génération inconnue : ${name}`);
  return g.id;
}

export function generationOfSpecies(speciesId: number): number {
  const g = GENERATIONS.find((x) => speciesId >= x.range[0] && speciesId <= x.range[1]);
  return g?.id ?? 0;
}

export function regionOfGeneration(gen: number): Region | undefined {
  return GENERATIONS.find((g) => g.id === gen)?.region as Region | undefined;
}

const REGIONAL_SUFFIXES: Array<[string, Region]> = [
  ['-alola', 'alola'],
  ['-galar', 'galar'],
  ['-hisui', 'hisui'],
  ['-paldea', 'paldea'],
];

/** Classe une forme d'après son slug PokeAPI. */
export function classifyForm(slug: string, isDefault: boolean): { kind: FormKind; region?: Region } {
  if (isDefault) return { kind: 'default' };
  if (/-mega(-[xyz])?$/.test(slug) || slug.includes('-mega-')) return { kind: 'mega' };
  if (slug.endsWith('-gmax')) return { kind: 'gmax' };
  for (const [suffix, region] of REGIONAL_SUFFIXES) {
    if (slug.includes(suffix)) return { kind: 'regional', region };
  }
  return { kind: 'other' };
}
