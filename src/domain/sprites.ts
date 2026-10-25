/**
 * URLs des sprites à partir d'un identifiant, sans avoir besoin de la fiche détaillée
 * (utile pour la liste : l'index ne stocke pas les URLs).
 */
export const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export function artworkUrl(id: number, shiny = false): string {
  return `${SPRITE_BASE}/other/official-artwork/${shiny ? 'shiny/' : ''}${id}.png`;
}

export function homeUrl(id: number, shiny = false): string {
  return `${SPRITE_BASE}/other/home/${shiny ? 'shiny/' : ''}${id}.png`;
}

export function pixelSpriteUrl(id: number, shiny = false): string {
  return `${SPRITE_BASE}/${shiny ? 'shiny/' : ''}${id}.png`;
}

/** Chaîne de repli : artwork officiel → rendu HOME → sprite pixel. */
export function spriteCandidates(id: number, shiny = false): string[] {
  return [artworkUrl(id, shiny), homeUrl(id, shiny), pixelSpriteUrl(id, shiny)];
}
