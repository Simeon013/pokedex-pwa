/**
 * Table des types (générations 6 et suivantes) et calcul des faiblesses défensives.
 */
import { TYPE_NAMES, type TypeName } from './models';

type Row = { x2?: TypeName[]; half?: TypeName[]; zero?: TypeName[] };

/** Efficacité offensive : pour chaque type attaquant, les types défenseurs touchés ×2, ×½, ×0. */
const OFFENSE: Record<TypeName, Row> = {
  normal: { half: ['rock', 'steel'], zero: ['ghost'] },
  fire: { x2: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'] },
  water: { x2: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'] },
  electric: { x2: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], zero: ['ground'] },
  grass: { x2: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'] },
  ice: { x2: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'] },
  fighting: {
    x2: ['normal', 'ice', 'rock', 'dark', 'steel'],
    half: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    zero: ['ghost'],
  },
  poison: { x2: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], zero: ['steel'] },
  ground: { x2: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], zero: ['flying'] },
  flying: { x2: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'] },
  psychic: { x2: ['fighting', 'poison'], half: ['psychic', 'steel'], zero: ['dark'] },
  bug: { x2: ['grass', 'psychic', 'dark'], half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'] },
  rock: { x2: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'] },
  ghost: { x2: ['psychic', 'ghost'], half: ['dark'], zero: ['normal'] },
  dragon: { x2: ['dragon'], half: ['steel'], zero: ['fairy'] },
  dark: { x2: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'] },
  steel: { x2: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'] },
  fairy: { x2: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'] },
};

export function isTypeName(value: string): value is TypeName {
  return (TYPE_NAMES as readonly string[]).includes(value);
}

/** Multiplicateur d'une attaque de type `attacker` contre un défenseur mono-type. */
export function effectiveness(attacker: TypeName, defender: TypeName): number {
  const row = OFFENSE[attacker];
  if (row.zero?.includes(defender)) return 0;
  if (row.x2?.includes(defender)) return 2;
  if (row.half?.includes(defender)) return 0.5;
  return 1;
}

/** Multiplicateur contre un défenseur à un ou deux types. */
export function defensiveMultiplier(attacker: TypeName, defenders: readonly TypeName[]): number {
  return defenders.reduce((acc, d) => acc * effectiveness(attacker, d), 1);
}

export interface DefensiveProfile {
  /** Tous les multiplicateurs, par type attaquant. */
  multipliers: Record<TypeName, number>;
  /** ×4 et ×2, triés par multiplicateur décroissant. */
  weaknesses: Array<{ type: TypeName; multiplier: number }>;
  /** ×½ et ×¼, triés par multiplicateur croissant. */
  resistances: Array<{ type: TypeName; multiplier: number }>;
  immunities: TypeName[];
  neutral: TypeName[];
}

export function defensiveProfile(defenders: readonly TypeName[]): DefensiveProfile {
  const multipliers = {} as Record<TypeName, number>;
  const weaknesses: DefensiveProfile['weaknesses'] = [];
  const resistances: DefensiveProfile['resistances'] = [];
  const immunities: TypeName[] = [];
  const neutral: TypeName[] = [];
  for (const attacker of TYPE_NAMES) {
    const m = defensiveMultiplier(attacker, defenders);
    multipliers[attacker] = m;
    if (m === 0) immunities.push(attacker);
    else if (m > 1) weaknesses.push({ type: attacker, multiplier: m });
    else if (m < 1) resistances.push({ type: attacker, multiplier: m });
    else neutral.push(attacker);
  }
  weaknesses.sort((a, b) => b.multiplier - a.multiplier);
  resistances.sort((a, b) => a.multiplier - b.multiplier);
  return { multipliers, weaknesses, resistances, immunities, neutral };
}

/** Types défenseurs contre lesquels un type attaquant est super efficace (pour la couverture). */
export function offensiveCoverage(attackers: readonly TypeName[]): TypeName[] {
  return TYPE_NAMES.filter((d) => attackers.some((a) => effectiveness(a, d) > 1));
}

/** Couleurs des types : fond de badge et texte avec contraste ≥ 4,5:1 (WCAG AA), halo décoratif. */
export const TYPE_COLORS: Record<TypeName, { bg: string; fg: string; glow: string }> = {
  normal: { bg: '#9fa19f', fg: '#111', glow: '#c6c6a7' },
  fire: { bg: '#dd2222', fg: '#fff', glow: '#ff7b3d' },
  water: { bg: '#1f6fd6', fg: '#fff', glow: '#5fb0ff' },
  electric: { bg: '#fac000', fg: '#111', glow: '#ffe45c' },
  grass: { bg: '#327f22', fg: '#fff', glow: '#7ee05e' },
  ice: { bg: '#3dcef3', fg: '#111', glow: '#a5f1ff' },
  fighting: { bg: '#c03028', fg: '#fff', glow: '#ff8a4d' },
  poison: { bg: '#9141cb', fg: '#fff', glow: '#cf7bff' },
  ground: { bg: '#915121', fg: '#fff', glow: '#e0b46a' },
  flying: { bg: '#81b9ef', fg: '#111', glow: '#c4e0ff' },
  psychic: { bg: '#d92f68', fg: '#fff', glow: '#ff86ad' },
  bug: { bg: '#91a119', fg: '#111', glow: '#c9e04a' },
  rock: { bg: '#afa981', fg: '#111', glow: '#d9cf98' },
  ghost: { bg: '#704170', fg: '#fff', glow: '#a77bd8' },
  dragon: { bg: '#5060e1', fg: '#fff', glow: '#8f8cff' },
  dark: { bg: '#50413f', fg: '#fff', glow: '#9a7d6e' },
  steel: { bg: '#60a1b8', fg: '#111', glow: '#b4d7e3' },
  fairy: { bg: '#ef70ef', fg: '#111', glow: '#ffb6f2' },
};
