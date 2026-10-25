import { describe, expect, it } from 'vitest';
import type { ChainLink, EvolutionChain, EvolutionDetail } from '@/api/types';
import { buildEvolutionTree, conditionsFromDetail, countNodes, evolutionStages, findNode } from './evolution';

const res = (name: string, kind = 'item', id = 1) => ({ name, url: `https://pokeapi.co/api/v2/${kind}/${id}/` });

function detail(p: Partial<EvolutionDetail>): EvolutionDetail {
  return {
    trigger: res('level-up', 'evolution-trigger'), item: null, held_item: null, known_move: null, known_move_type: null,
    location: null, party_species: null, party_type: null, trade_species: null, gender: null, min_level: null,
    min_happiness: null, min_beauty: null, min_affection: null, needs_overworld_rain: false,
    relative_physical_stats: null, time_of_day: '', turn_upside_down: false, ...p,
  };
}

const link = (name: string, id: number, details: EvolutionDetail[], evolves_to: ChainLink[] = [], is_baby = false): ChainLink => ({
  is_baby, species: res(name, 'pokemon-species', id), evolution_details: details, evolves_to,
});

const eevee: EvolutionChain = {
  id: 67,
  baby_trigger_item: null,
  chain: link('eevee', 133, [], [
    link('vaporeon', 134, [detail({ trigger: res('use-item'), item: res('water-stone') })]),
    link('espeon', 196, [detail({ min_happiness: 160, time_of_day: 'day' })]),
    link('umbreon', 197, [detail({ min_happiness: 160, time_of_day: 'night' })]),
    link('sylveon', 700, [
      detail({ known_move_type: res('fairy', 'type') , min_affection: 2 }),
      detail({ known_move_type: res('fairy', 'type'), min_affection: 2 }),
    ]),
  ]),
};

describe('conditions', () => {
  it('niveau simple', () => {
    expect(conditionsFromDetail(detail({ min_level: 16 }))).toEqual([{ kind: 'level', value: 16 }]);
  });
  it('objet', () => {
    expect(conditionsFromDetail(detail({ trigger: res('use-item'), item: res('water-stone') }))).toEqual([
      { kind: 'item', item: 'water-stone' },
    ]);
  });
  it('échange avec objet tenu : garde le déclencheur', () => {
    expect(conditionsFromDetail(detail({ trigger: res('trade'), held_item: res('metal-coat') }))).toEqual([
      { kind: 'held-item', item: 'metal-coat' },
      { kind: 'trigger', trigger: 'trade' },
    ]);
  });
  it('bonheur + moment de la journée', () => {
    expect(conditionsFromDetail(detail({ min_happiness: 160, time_of_day: 'night' }))).toEqual([
      { kind: 'happiness', value: 160 },
      { kind: 'time', value: 'night' },
    ]);
  });
  it('Kapoera : stats physiques', () => {
    expect(conditionsFromDetail(detail({ min_level: 20, relative_physical_stats: 0 }))).toContainEqual({ kind: 'physical-stats', value: 'atk=def' });
  });
});

describe('arbre', () => {
  const tree = buildEvolutionTree(eevee);
  it('construit un arbre ramifié', () => {
    expect(tree.speciesId).toBe(133);
    expect(tree.children.map((c) => c.slug)).toEqual(['vaporeon', 'espeon', 'umbreon', 'sylveon']);
    expect(countNodes(tree)).toBe(5);
  });
  it('déduplique les méthodes identiques', () => {
    expect(findNode(tree, 700)?.methods).toHaveLength(1);
  });
  it('découpe en stades', () => {
    expect(evolutionStages(tree).map((s) => s.length)).toEqual([1, 4]);
  });
});
