import type { BaseStats, IndexEntry, TypeName } from '@/domain/models';

export function entry(p: Partial<IndexEntry> & { id: number; slug: string; fr: string; types: TypeName[] }): IndexEntry {
  const { fr, ...rest } = p;
  return {
    speciesId: p.id,
    names: { fr, en: p.slug[0]!.toUpperCase() + p.slug.slice(1) },
    stats: [50, 50, 50, 50, 50, 50] as BaseStats,
    generation: 1,
    rarity: 'normal',
    isDefault: true,
    formKind: 'default',
    ...rest,
  };
}

export const SAMPLE: IndexEntry[] = [
  entry({ id: 1, slug: 'bulbasaur', fr: 'Bulbizarre', types: ['grass', 'poison'], stats: [45, 49, 49, 65, 65, 45] }),
  entry({ id: 6, slug: 'charizard', fr: 'Dracaufeu', types: ['fire', 'flying'], stats: [78, 84, 78, 109, 85, 100] }),
  entry({
    id: 10034, speciesId: 6, slug: 'charizard-mega-x', fr: 'Dracaufeu', types: ['fire', 'dragon'],
    stats: [78, 130, 111, 130, 85, 100], isDefault: false, formKind: 'mega',
    formNames: { fr: 'Méga-Dracaufeu X', en: 'Mega Charizard X' },
  }),
  entry({ id: 25, slug: 'pikachu', fr: 'Pikachu', types: ['electric'], stats: [35, 55, 40, 50, 50, 90] }),
  entry({
    id: 10103, speciesId: 37, slug: 'vulpix-alola', fr: 'Goupix', types: ['ice'], isDefault: false,
    formKind: 'regional', formRegion: 'alola', formNames: { fr: 'Goupix d’Alola', en: 'Alolan Vulpix' },
  }),
  entry({ id: 150, slug: 'mewtwo', fr: 'Mewtwo', types: ['psychic'], rarity: 'legendary', stats: [106, 110, 90, 154, 90, 130] }),
  entry({ id: 151, slug: 'mew', fr: 'Mew', types: ['psychic'], rarity: 'mythical', stats: [100, 100, 100, 100, 100, 100] }),
  entry({ id: 172, slug: 'pichu', fr: 'Pichu', types: ['electric'], generation: 2, rarity: 'baby' }),
  entry({ id: 445, slug: 'garchomp', fr: 'Carchacrok', types: ['dragon', 'ground'], generation: 4, stats: [108, 130, 95, 80, 85, 102] }),
  entry({ id: 902, slug: 'basculegion', fr: 'Paragruel', types: ['water', 'ghost'], generation: 8 }),
];
