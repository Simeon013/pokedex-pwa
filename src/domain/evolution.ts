/**
 * Conversion des chaînes d'évolution PokeAPI en arbre de nœuds avec conditions structurées.
 * La mise en texte localisée est faite par `src/i18n/evolutionText.ts`.
 */
import type { ChainLink, EvolutionChain, EvolutionDetail } from '../api/types';
import { idFromUrl } from '../api/pokeapi';
import type { EvolutionCondition, EvolutionMethod, EvolutionNode } from './models';

export function conditionsFromDetail(d: EvolutionDetail): EvolutionCondition[] {
  const c: EvolutionCondition[] = [];
  if (d.min_level != null) c.push({ kind: 'level', value: d.min_level });
  if (d.item) c.push({ kind: 'item', item: d.item.name });
  if (d.held_item) c.push({ kind: 'held-item', item: d.held_item.name });
  if (d.min_happiness != null) c.push({ kind: 'happiness', value: d.min_happiness });
  if (d.min_affection != null) c.push({ kind: 'affection', value: d.min_affection });
  if (d.min_beauty != null) c.push({ kind: 'beauty', value: d.min_beauty });
  if (d.known_move) c.push({ kind: 'known-move', move: d.known_move.name });
  if (d.known_move_type) c.push({ kind: 'known-move-type', type: d.known_move_type.name });
  if (d.location) c.push({ kind: 'location', location: d.location.name });
  if (d.party_species) c.push({ kind: 'party-species', species: d.party_species.name });
  if (d.party_type) c.push({ kind: 'party-type', type: d.party_type.name });
  if (d.trade_species) c.push({ kind: 'trade-species', species: d.trade_species.name });
  if (d.gender === 1) c.push({ kind: 'gender', value: 'female' });
  if (d.gender === 2) c.push({ kind: 'gender', value: 'male' });
  if (d.time_of_day === 'day' || d.time_of_day === 'night' || d.time_of_day === 'dusk') {
    c.push({ kind: 'time', value: d.time_of_day });
  }
  if (d.needs_overworld_rain) c.push({ kind: 'rain' });
  if (d.turn_upside_down) c.push({ kind: 'upside-down' });
  if (d.relative_physical_stats === 1) c.push({ kind: 'physical-stats', value: 'atk>def' });
  if (d.relative_physical_stats === 0) c.push({ kind: 'physical-stats', value: 'atk=def' });
  if (d.relative_physical_stats === -1) c.push({ kind: 'physical-stats', value: 'atk<def' });
  // Déclencheurs sans condition chiffrée (échange simple, mouvement spécial…) : on garde le déclencheur.
  if (c.length === 0 || (d.trigger.name !== 'level-up' && d.trigger.name !== 'use-item')) {
    c.push({ kind: 'trigger', trigger: d.trigger.name });
  }
  return c;
}

/** Supprime les méthodes strictement identiques (PokeAPI duplique parfois par jeu). */
function dedupeMethods(methods: EvolutionMethod[]): EvolutionMethod[] {
  const seen = new Set<string>();
  return methods.filter((m) => {
    const key = JSON.stringify(m);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function linkToNode(link: ChainLink): EvolutionNode {
  return {
    speciesId: idFromUrl(link.species.url),
    slug: link.species.name,
    isBaby: link.is_baby,
    methods: dedupeMethods(link.evolution_details.map((d) => ({ trigger: d.trigger.name, conditions: conditionsFromDetail(d) }))),
    children: link.evolves_to.map(linkToNode),
  };
}

export function buildEvolutionTree(chain: EvolutionChain): EvolutionNode {
  return linkToNode(chain.chain);
}

/** Parcours en largeur : liste des espèces de l'arbre, par stade. */
export function evolutionStages(root: EvolutionNode): EvolutionNode[][] {
  const stages: EvolutionNode[][] = [];
  let level: EvolutionNode[] = [root];
  while (level.length > 0) {
    stages.push(level);
    level = level.flatMap((n) => n.children);
  }
  return stages;
}

export function findNode(root: EvolutionNode, speciesId: number): EvolutionNode | undefined {
  if (root.speciesId === speciesId) return root;
  for (const child of root.children) {
    const found = findNode(child, speciesId);
    if (found) return found;
  }
  return undefined;
}

export function countNodes(root: EvolutionNode): number {
  return 1 + root.children.reduce((n, c) => n + countNodes(c), 0);
}
