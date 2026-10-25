import { describe, expect, it } from 'vitest';
import { dailySpeciesId, dayKey } from './daily';
import { classifyForm, generationFromRoman, generationOfSpecies } from './generations';

describe('daily', () => {
  it('est stable pour une même date et varie selon le jour', () => {
    const a = dailySpeciesId(new Date(2026, 9, 25, 8), 1025);
    expect(dailySpeciesId(new Date(2026, 9, 25, 22), 1025)).toBe(a);
    const week = new Set(Array.from({ length: 7 }, (_, i) => dailySpeciesId(new Date(2026, 9, 25 + i), 1025)));
    expect(week.size).toBeGreaterThan(4);
    for (const id of week) expect(id).toBeGreaterThanOrEqual(1);
  });
  it('dayKey', () => expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05'));
});

describe('generations', () => {
  it('convertit les noms PokeAPI', () => {
    expect(generationFromRoman('generation-i')).toBe(1);
    expect(generationFromRoman('generation-ix')).toBe(9);
    expect(() => generationFromRoman('generation-x')).toThrow();
  });
  it('génération par numéro', () => {
    expect(generationOfSpecies(151)).toBe(1);
    expect(generationOfSpecies(152)).toBe(2);
    expect(generationOfSpecies(1025)).toBe(9);
  });
  it('classe les formes', () => {
    expect(classifyForm('charizard', true).kind).toBe('default');
    expect(classifyForm('charizard-mega-x', false).kind).toBe('mega');
    expect(classifyForm('venusaur-mega', false).kind).toBe('mega');
    expect(classifyForm('charizard-gmax', false).kind).toBe('gmax');
    expect(classifyForm('vulpix-alola', false)).toEqual({ kind: 'regional', region: 'alola' });
    expect(classifyForm('tauros-paldea-aqua-breed', false)).toEqual({ kind: 'regional', region: 'paldea' });
    expect(classifyForm('pikachu-rock-star', false).kind).toBe('other');
  });
});
