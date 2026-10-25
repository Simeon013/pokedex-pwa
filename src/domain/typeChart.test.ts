import { describe, expect, it } from 'vitest';
import { TYPE_NAMES } from './models';
import { defensiveMultiplier, defensiveProfile, effectiveness, offensiveCoverage } from './typeChart';

describe('effectiveness', () => {
  it('applique les règles de base', () => {
    expect(effectiveness('fire', 'grass')).toBe(2);
    expect(effectiveness('water', 'water')).toBe(0.5);
    expect(effectiveness('normal', 'ghost')).toBe(0);
    expect(effectiveness('dragon', 'fairy')).toBe(0);
    expect(effectiveness('electric', 'ground')).toBe(0);
    expect(effectiveness('normal', 'normal')).toBe(1);
  });

  it('couvre les 324 combinaisons avec des valeurs valides', () => {
    for (const a of TYPE_NAMES) for (const d of TYPE_NAMES) expect([0, 0.5, 1, 2]).toContain(effectiveness(a, d));
  });
});

describe('defensiveProfile', () => {
  it('Dracaufeu (Feu/Vol) : ×4 Roche, immunisé Sol', () => {
    const p = defensiveProfile(['fire', 'flying']);
    expect(p.weaknesses[0]).toEqual({ type: 'rock', multiplier: 4 });
    expect(p.weaknesses.map((w) => w.type).sort()).toEqual(['electric', 'rock', 'water']);
    expect(p.immunities).toEqual(['ground']);
    expect(p.resistances.find((r) => r.type === 'grass')?.multiplier).toBe(0.25);
    expect(p.resistances.find((r) => r.type === 'bug')?.multiplier).toBe(0.25);
  });

  it('Tarinorme (Roche/Acier) : ×4 Combat et Sol', () => {
    const p = defensiveProfile(['rock', 'steel']);
    expect(p.weaknesses.filter((w) => w.multiplier === 4).map((w) => w.type).sort()).toEqual(['fighting', 'ground']);
    expect(p.immunities).toEqual(['poison']);
  });

  it('Ténéfix (Spectre/Ténèbres) : aucune faiblesse avant les Fées', () => {
    const p = defensiveProfile(['ghost', 'dark']);
    expect(p.weaknesses).toEqual([{ type: 'fairy', multiplier: 2 }]);
    expect(p.immunities.sort()).toEqual(['fighting', 'normal', 'psychic']);
  });

  it('chaque type attaquant est classé une seule fois', () => {
    const p = defensiveProfile(['water', 'ground']);
    const n = p.weaknesses.length + p.resistances.length + p.immunities.length + p.neutral.length;
    expect(n).toBe(18);
    expect(defensiveMultiplier('grass', ['water', 'ground'])).toBe(4);
  });
});

describe('offensiveCoverage', () => {
  it('liste les types touchés super efficacement', () => {
    expect(offensiveCoverage(['ground']).sort()).toEqual(['electric', 'fire', 'poison', 'rock', 'steel']);
  });
});
