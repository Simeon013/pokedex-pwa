/**
 * Calculs sur les statistiques : total, valeurs réelles min/max à un niveau donné
 * (formules des générations 3+), et indicateur approximatif de « potentiel ».
 */
import { STAT_KEYS, type BaseStats, type StatKey } from './models';

export const MAX_BASE_STAT = 255;

export function statTotal(stats: readonly number[]): number {
  return stats.reduce((a, b) => a + b, 0);
}

export interface StatInput {
  base: number;
  level: number;
  iv: number; // 0..31
  ev: number; // 0..252
  nature: 0.9 | 1 | 1.1;
}

/** PV : ⌊(2B + IV + ⌊EV/4⌋) × N / 100⌋ + N + 10 ; Munja (PV de base 1) vaut toujours 1. */
export function computeHp({ base, level, iv, ev }: Omit<StatInput, 'nature'>): number {
  if (base === 1) return 1;
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

/** Autres stats : ⌊(⌊(2B + IV + ⌊EV/4⌋) × N / 100⌋ + 5) × nature⌋. */
export function computeStat({ base, level, iv, ev, nature }: StatInput): number {
  return Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * nature);
}

export interface StatRange {
  key: StatKey;
  base: number;
  min: number;
  max: number;
}

/**
 * Valeurs extrêmes à un niveau donné :
 * min = IV 0, EV 0, nature défavorable ; max = IV 31, EV 252, nature favorable.
 */
export function statRanges(stats: BaseStats, level = 100): StatRange[] {
  return STAT_KEYS.map((key, i) => {
    const base = stats[i] ?? 0;
    if (key === 'hp') {
      return { key, base, min: computeHp({ base, level, iv: 0, ev: 0 }), max: computeHp({ base, level, iv: 31, ev: 252 }) };
    }
    return {
      key,
      base,
      min: computeStat({ base, level, iv: 0, ev: 0, nature: 0.9 }),
      max: computeStat({ base, level, iv: 31, ev: 252, nature: 1.1 }),
    };
  });
}

/** Rang centile (0..100) d'une valeur dans une population. */
export function percentile(value: number, population: readonly number[]): number {
  if (population.length === 0) return 0;
  let below = 0;
  let equal = 0;
  for (const v of population) {
    if (v < value) below++;
    else if (v === value) equal++;
  }
  return Math.round(((below + equal / 2) / population.length) * 100);
}

export type PotentialTier = 'S' | 'A' | 'B' | 'C' | 'D';

export interface Potential {
  total: number;
  percentile: number;
  tier: PotentialTier;
  /** Profil dominant, pour l'affichage (« attaquant physique rapide »…). */
  role: 'physical-sweeper' | 'special-sweeper' | 'physical-wall' | 'special-wall' | 'tank' | 'balanced';
}

/**
 * Potentiel approximatif : centile du total parmi toutes les entrées connues,
 * pondéré par la meilleure stat offensive et la vitesse (une répartition
 * concentrée vaut mieux qu'une répartition plate à total égal).
 */
export function potential(stats: BaseStats, allTotals: readonly number[]): Potential {
  const [hp, atk, def, spa, spd, spe] = stats;
  const total = statTotal(stats);
  const effective = total + 0.25 * (Math.max(atk, spa) - 80) + 0.15 * (spe - 80);
  const p = percentile(effective, allTotals);
  const tier: PotentialTier = p >= 90 ? 'S' : p >= 70 ? 'A' : p >= 45 ? 'B' : p >= 20 ? 'C' : 'D';

  const offense = Math.max(atk, spa);
  const bulk = (hp + def + spd) / 3;
  let role: Potential['role'] = 'balanced';
  if (offense >= 100 && spe >= 90) role = atk >= spa ? 'physical-sweeper' : 'special-sweeper';
  else if (hp >= 100 && bulk >= 90) role = 'tank';
  else if (def >= 100 && def >= spd) role = 'physical-wall';
  else if (spd >= 100) role = 'special-wall';
  return { total, percentile: p, tier, role };
}
