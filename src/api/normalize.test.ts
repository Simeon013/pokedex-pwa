import { describe, expect, it } from 'vitest';
import encounters from '@/test/data/encounters-6.json';
import pokemon from '@/test/data/pokemon-6.json';
import species from '@/test/data/species-6.json';
import { cleanFlavorText, groupEncounters, localizedNames, prettifySlug, toIndexEntry, toPokemonDetail } from './normalize';
import type { LocationAreaEncounter, Pokemon, PokemonForm, PokemonSpecies } from './types';

const p = pokemon as unknown as Pokemon;
const s = species as unknown as PokemonSpecies;

describe('normalize (données réelles de Dracaufeu)', () => {
  it('fiche détaillée', () => {
    const d = toPokemonDetail(p, s);
    expect(d.names.fr).toBe('Dracaufeu');
    expect(d.names.ja).toBe('リザードン');
    expect(d.genera.fr).toBe('Pokémon Flamme');
    expect(d.types).toEqual(['fire', 'flying']);
    expect(d.stats).toEqual([78, 84, 78, 109, 85, 100]);
    expect(d.heightM).toBe(1.7);
    expect(d.weightKg).toBe(90.5);
    expect(d.femaleRatio).toBe(0.125);
    expect(d.captureRate).toBe(45);
    expect(d.eggGroups).toEqual(['monster', 'dragon']);
    expect(d.abilities).toEqual([
      { slug: 'blaze', id: 66, hidden: false },
      { slug: 'solar-power', id: 94, hidden: true },
    ]);
    expect(d.evolutionChainId).toBe(2);
    expect(d.forms.map((f) => f.kind)).toEqual(expect.arrayContaining(['default', 'mega', 'gmax']));
    expect(d.sprites.artwork).toMatch(/official-artwork\/6\.png$/);
    expect(d.sprites.animated).toMatch(/showdown\/6\.gif$/);
    expect(d.cries.latest).toMatch(/\.ogg$/);
    expect(d.flavorTexts.find((f) => f.lang === 'fr')?.text).not.toMatch(/\n|\f/);
  });

  it('entrée d’index', () => {
    const e = toIndexEntry(p, s);
    expect(e).toMatchObject({ id: 6, speciesId: 6, generation: 1, rarity: 'normal', isDefault: true, formKind: 'default' });
    expect(e.formNames).toBeUndefined();
  });

  it('noms de forme', () => {
    const mega = { ...p, id: 10034, name: 'charizard-mega-x', is_default: false };
    const form = {
      name: 'charizard-mega-x', form_name: 'mega-x', is_default: true,
      names: [{ name: 'Méga-Dracaufeu X', language: { name: 'fr', url: '' } }, { name: 'Mega Charizard X', language: { name: 'en', url: '' } }],
      form_names: [],
    } as unknown as PokemonForm;
    const e = toIndexEntry(mega, s, form);
    expect(e.formKind).toBe('mega');
    expect(e.formNames).toEqual({ fr: 'Méga-Dracaufeu X', en: 'Mega Charizard X' });
  });

  it('regroupe les rencontres par version', () => {
    const groups = groupEncounters(encounters as LocationAreaEncounter[]);
    expect(groups.length).toBeGreaterThan(0);
    const g = groups[0]!;
    expect(g.locations[0]!.minLevel).toBeLessThanOrEqual(g.locations[0]!.maxLevel);
  });

  it('utilitaires', () => {
    expect(prettifySlug('mr-mime')).toBe('Mr Mime');
    expect(cleanFlavorText('Crache du\nfeu\fbrûlant.')).toBe('Crache du feu brûlant.');
    expect(localizedNames([], 'ho-oh')).toEqual({ en: 'Ho Oh' });
  });
});
