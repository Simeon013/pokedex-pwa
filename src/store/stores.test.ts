import { beforeEach, describe, expect, it } from 'vitest';
import { messagesFor, translate } from '@/i18n';
import { exportCollection, useCollection } from './collection';
import { selectFilterState, useFilters } from './filters';

beforeEach(() => {
  useCollection.getState().clear();
  useFilters.getState().reset();
});

describe('collection', () => {
  it('bascule les favoris', () => {
    expect(useCollection.getState().toggle('favorites', 25)).toBe(true);
    expect(useCollection.getState().favorites).toEqual([25]);
    expect(useCollection.getState().toggle('favorites', 25)).toBe(false);
    expect(useCollection.getState().favorites).toEqual([]);
  });
  it('capturé ou shiny implique vu', () => {
    useCollection.getState().set('caught', 6, true);
    useCollection.getState().set('shinyFound', 150, true);
    expect(useCollection.getState().seen.sort()).toEqual([150, 6].sort());
  });
  it('export puis import', () => {
    useCollection.getState().set('favorites', 1, true);
    const json = exportCollection(useCollection.getState());
    useCollection.getState().clear();
    expect(useCollection.getState().importData(JSON.parse(json))).toBe(true);
    expect(useCollection.getState().favorites).toEqual([1]);
    expect(useCollection.getState().importData({ nope: 1 })).toBe(false);
    expect(useCollection.getState().importData({ favorites: ['x'] })).toBe(false);
  });
});

describe('filtres', () => {
  it('bascule types et générations, tri par défaut descendant pour les stats', () => {
    const f = useFilters.getState();
    f.toggleType('fire');
    f.toggleGeneration(3);
    f.toggleGeneration(1);
    f.setSort('speed');
    const s = selectFilterState(useFilters.getState());
    expect(s.types).toEqual(['fire']);
    expect(s.generations).toEqual([1, 3]);
    expect(s).toMatchObject({ sort: 'speed', dir: 'desc' });
    useFilters.getState().setSort('name');
    expect(useFilters.getState().dir).toBe('asc');
    useFilters.getState().reset();
    expect(useFilters.getState().types).toEqual([]);
  });
});

describe('i18n', () => {
  it('traduit et interpole, repli anglais pour les autres langues', () => {
    expect(translate(messagesFor('fr'), 'types.electric')).toBe('Électrik');
    expect(translate(messagesFor('fr'), 'filters.showResults', { count: 3 })).toBe('Afficher 3 résultats');
    expect(translate(messagesFor('de'), 'types.electric')).toBe('Electric');
  });
});
