import { describe, expect, it } from 'vitest';
import type { BaseStats } from './models';
import { computeHp, computeStat, percentile, potential, statRanges, statTotal } from './stats';

const garchomp: BaseStats = [108, 130, 95, 80, 85, 102];

describe('stats', () => {
  it('total', () => expect(statTotal(garchomp)).toBe(600));

  it('PV au niveau 100 (valeurs connues de Carchacrok)', () => {
    expect(computeHp({ base: 108, level: 100, iv: 31, ev: 252 })).toBe(420);
    expect(computeHp({ base: 108, level: 100, iv: 0, ev: 0 })).toBe(326);
  });

  it('Munja a toujours 1 PV', () => expect(computeHp({ base: 1, level: 100, iv: 31, ev: 252 })).toBe(1));

  it('Attaque au niveau 100 et nature', () => {
    expect(computeStat({ base: 130, level: 100, iv: 31, ev: 252, nature: 1.1 })).toBe(394);
    expect(computeStat({ base: 130, level: 100, iv: 0, ev: 0, nature: 0.9 })).toBe(238);
  });

  it('statRanges au niveau 50', () => {
    const r = statRanges(garchomp, 50);
    expect(r).toHaveLength(6);
    expect(r[0]).toMatchObject({ key: 'hp', min: 168, max: 215 });
    expect(r[5]).toMatchObject({ key: 'speed', min: 96, max: 169 });
  });

  it('percentile', () => {
    expect(percentile(5, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe(45);
    expect(percentile(100, [1, 2])).toBe(100);
    expect(percentile(1, [])).toBe(0);
  });

  it('potentiel : Carchacrok est S et attaquant physique', () => {
    const totals = Array.from({ length: 100 }, (_, i) => 200 + i * 4);
    const p = potential(garchomp, totals);
    expect(p.tier).toBe('S');
    expect(p.role).toBe('physical-sweeper');
    expect(potential([20, 10, 55, 15, 20, 80], totals).tier).toBe('D');
  });
});
