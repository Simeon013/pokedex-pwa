import { describe, expect, it } from 'vitest';
import { catchProbability } from '@/domain/stats';
import { waveformPeaks } from './CryPlayer';
import { groupFlavorTexts } from './FlavorTexts';

describe('entrées du Pokédex', () => {
  const entries = [
    { lang: 'fr', version: 'x', text: 'Texte A' },
    { lang: 'fr', version: 'y', text: 'Texte  a' },
    { lang: 'fr', version: 'sun', text: 'Texte B' },
    { lang: 'en', version: 'x', text: 'Text A' },
  ];
  it('regroupe les textes identiques, les plus récents d’abord', () => {
    expect(groupFlavorTexts(entries, 'fr')).toEqual([
      { text: 'Texte B', versions: ['sun'] },
      { text: 'Texte A', versions: ['x', 'y'] },
    ]);
  });
  it('se replie sur l’anglais', () => {
    expect(groupFlavorTexts(entries, 'ja')).toEqual([{ text: 'Text A', versions: ['x'] }]);
  });
});

describe('cri et capture', () => {
  it('normalise les pics de la forme d’onde', () => {
    const peaks = waveformPeaks(new Float32Array([0.1, -0.5, 0.25, 0.25]), 2);
    expect(peaks).toEqual([1, 0.5]);
  });
  it('probabilité de capture', () => {
    expect(catchProbability(255)).toBeCloseTo(0.4387, 3);
    expect(catchProbability(3)).toBeCloseTo(0.0157, 3);
    expect(catchProbability(255, 255)).toBe(1);
  });
});
