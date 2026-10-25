import { describe, expect, it } from 'vitest';
import { SAMPLE } from '@/test/fixtures';
import {
  activeFilterCount, applyFilters, DEFAULT_FILTERS, EMPTY_COLLECTION, matchScore, normalizeText, parseNumberQuery, suggest,
  type FilterState,
} from './filters';

const run = (f: Partial<FilterState>, c = EMPTY_COLLECTION) =>
  applyFilters(SAMPLE, { ...DEFAULT_FILTERS, ...f }, c, 'fr').map((e) => e.slug);

describe('normalisation et numéros', () => {
  it('retire accents et ponctuation', () => {
    expect(normalizeText('Méga-Dracaufeu X')).toBe('mega dracaufeu x');
    expect(normalizeText('Nidoran♀')).toBe('nidoran f');
  });
  it('reconnaît les numéros', () => {
    expect(parseNumberQuery('#025')).toBe(25);
    expect(parseNumberQuery('n°6')).toBe(6);
    expect(parseNumberQuery('pika')).toBeNull();
  });
});

describe('applyFilters', () => {
  it('masque les formes alternatives par défaut, trie par numéro', () => {
    expect(run({})).toEqual(['bulbasaur', 'charizard', 'pikachu', 'mewtwo', 'mew', 'pichu', 'garchomp', 'basculegion']);
  });
  it('inclut les formes sur demande', () => {
    expect(run({ includeForms: true })).toContain('charizard-mega-x');
    expect(run({ includeForms: true }).indexOf('charizard-mega-x')).toBe(2);
  });
  it('filtre par types (tous / au moins un)', () => {
    expect(run({ types: ['fire', 'flying'] })).toEqual(['charizard']);
    expect(run({ types: ['fire', 'electric'], typeMode: 'any' })).toEqual(['charizard', 'pikachu', 'pichu']);
  });
  it('filtre par génération, région et rareté', () => {
    expect(run({ generations: [2, 4] })).toEqual(['pichu', 'garchomp']);
    expect(run({ regions: ['alola'], includeForms: true })).toEqual(['vulpix-alola']);
    expect(run({ regions: ['hisui'] })).toEqual(['basculegion']);
    expect(run({ rarity: 'legendary-or-mythical' })).toEqual(['mewtwo', 'mew']);
    expect(run({ rarity: 'baby' })).toEqual(['pichu']);
  });
  it('filtre par collection', () => {
    const c = { ...EMPTY_COLLECTION, favorites: new Set([25, 151]), caught: new Set([25]) };
    expect(run({ onlyFavorites: true }, c)).toEqual(['pikachu', 'mew']);
    expect(run({ onlyFavorites: true, onlyCaught: true }, c)).toEqual(['pikachu']);
  });
  it('trie par nom, total et stat', () => {
    expect(run({ sort: 'name' })[0]).toBe('bulbasaur');
    expect(run({ sort: 'total', dir: 'desc' })[0]).toBe('mewtwo');
    expect(run({ sort: 'speed', dir: 'desc' })[0]).toBe('mewtwo');
    expect(run({ sort: 'speed', dir: 'asc' })[0]).toBe('bulbasaur');
  });
  it('recherche multilingue, sans accents, et formes trouvées par leur nom', () => {
    expect(run({ query: 'dracau' })).toEqual(['charizard', 'charizard-mega-x']);
    expect(run({ query: 'charizard' })).toEqual(['charizard', 'charizard-mega-x']);
    expect(run({ query: 'mega dracaufeu' })).toEqual(['charizard-mega-x']);
    expect(run({ query: '#151' })).toEqual(['mew']);
    expect(run({ query: 'mew' })).toEqual(['mew', 'mewtwo']);
  });
});

describe('suggest et score', () => {
  it('classe le nom exact avant les préfixes', () => {
    expect(matchScore(SAMPLE[5]!, 'mewtwo', 'fr')).toBe(1);
    expect(suggest(SAMPLE, 'pi', 'fr').map((e) => e.slug)).toEqual(['pikachu', 'pichu', 'vulpix-alola']);
    expect(suggest(SAMPLE, '', 'fr')).toEqual([]);
  });
  it('compte les filtres actifs', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...DEFAULT_FILTERS, types: ['fire'], onlyFavorites: true, rarity: 'baby' })).toBe(3);
  });
});
