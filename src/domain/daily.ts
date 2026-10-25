/**
 * Pokémon du jour : choix déterministe à partir de la date locale,
 * identique pour tous les utilisateurs d'un même jour.
 */

/** Hash 32 bits FNV-1a. */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Renvoie un numéro d'espèce entre 1 et `speciesCount`. */
export function dailySpeciesId(date: Date, speciesCount: number): number {
  return (fnv1a(`pokedex:${dayKey(date)}`) % speciesCount) + 1;
}
