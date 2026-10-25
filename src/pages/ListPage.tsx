/**
 * Page Pokédex : barre de types rapide, tri, compteur, grille virtualisée.
 */
import { m } from 'framer-motion';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { FiltersPanel, SORT_KEYS } from '@/components/FiltersPanel';
import { ErrorState } from '@/components/Feedback';
import { PokemonCard, PokemonCardSkeleton } from '@/components/PokemonCard';
import { TypeIcon } from '@/components/TypeIcon';
import { Chip } from '@/components/ui/Chip';
import { ArrowUpDownIcon, FilterIcon } from '@/components/ui/Icons';
import { IconButton } from '@/components/ui/IconButton';
import { VirtualGrid } from '@/components/VirtualGrid';
import { activeFilterCount, applyFilters, type SortKey } from '@/domain/filters';
import { TYPE_NAMES, type IndexEntry } from '@/domain/models';
import { TYPE_COLORS } from '@/domain/typeChart';
import { useOnline } from '@/hooks/useOnline';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { formatNumber, useLang, useT } from '@/i18n';
import { useCollectionSets } from '@/store/collection';
import { selectFilterState, useFilters } from '@/store/filters';
import { useIndexStore } from '@/store/pokedexIndex';
import { useShallow } from 'zustand/react/shallow';

/** Les cartes montées dans cette fenêtre après l'affichage de la liste apparaissent en cascade. */
const CASCADE_WINDOW_MS = 900;

export default function ListPage() {
  const t = useT();
  const lang = useLang();
  const online = useOnline();
  const reduced = useReducedMotion();
  const { status, index, error, progress, load } = useIndexStore();
  const filters = useFilters(useShallow(selectFilterState));
  const { toggleType, setSort, setDir, reset } = useFilters(useShallow((s) => ({ toggleType: s.toggleType, setSort: s.setSort, setDir: s.setDir, reset: s.reset })));
  const collection = useCollectionSets();
  const [panelOpen, setPanelOpen] = useState(false);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  // Le filtrage (1 351 entrées) est rapide, mais on le rend interruptible pour garder la saisie fluide.
  const deferredFilters = useDeferredValue(filters);
  const results = useMemo(
    () => (index ? applyFilters(index.entries, deferredFilters, collection, lang) : []),
    [index, deferredFilters, collection, lang],
  );

  const shownAt = useRef(0);
  useEffect(() => {
    if (status === 'ready') shownAt.current = performance.now();
  }, [status, deferredFilters]);

  const renderItem = useCallback(
    (entry: IndexEntry, i: number, column: number) => {
      const inCascade = performance.now() - shownAt.current < CASCADE_WINDOW_MS;
      return <PokemonCard entry={entry} lang={lang} reducedMotion={reduced} appearDelay={inCascade ? Math.min(i, 24) * 0.03 : column * 0.03} />;
    },
    [lang, reduced],
  );

  const count = activeFilterCount(filters);

  return (
    <div className="pb-16">
      <h1 className="sr-only">{t('nav.pokedex')}</h1>

      {/* Barre d'outils pleine largeur : types rapides + tri + filtres */}
      <div className="sticky top-[69px] z-30 mb-4 border-b border-line bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 pt-3 pb-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="no-scrollbar -my-1 flex flex-1 gap-1.5 overflow-x-auto py-1" role="group" aria-label={t('filters.types')}>
            {TYPE_NAMES.map((type) => {
              const c = TYPE_COLORS[type];
              return (
                <Chip key={type} selected={filters.types.includes(type)} onClick={() => toggleType(type)} activeStyle={{ backgroundColor: c.bg, color: c.fg }}>
                  <TypeIcon type={type} className="size-3.5" />
                  {t(`types.${type}`)}
                </Chip>
              );
            })}
          </div>
          <label className="glass hidden h-11 items-center gap-2 rounded-2xl pr-2 pl-3 md:flex">
            <ArrowUpDownIcon className="size-4 text-muted" />
            <span className="sr-only">{t('filters.sort')}</span>
            <select
              value={filters.sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-full cursor-pointer appearance-none bg-transparent text-sm font-semibold outline-none"
            >
              {SORT_KEYS.map((k) => (
                <option key={k} value={k} className="bg-bg">
                  {t(`sort.${k}`)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setDir(filters.dir === 'asc' ? 'desc' : 'asc')}
              className="grid size-7 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
              aria-label={t(filters.dir === 'asc' ? 'filters.asc' : 'filters.desc')}
              title={t(filters.dir === 'asc' ? 'filters.asc' : 'filters.desc')}
            >
              <span aria-hidden className={`transition-transform ${filters.dir === 'desc' ? 'rotate-180' : ''}`}>
                ↑
              </span>
            </button>
          </label>
          <IconButton label={t('filters.open')} badge={count} onClick={() => setPanelOpen(true)} aria-haspopup="dialog">
            <FilterIcon />
          </IconButton>
        </div>
        {status === 'ready' && (
          <p className="mt-2 text-xs font-medium text-muted" aria-live="polite">
            {results.length === 1 ? t('list.resultsOne') : t('list.results', { count: formatNumber(results.length, lang) })}
          </p>
        )}
      </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">

      {status === 'error' && <ErrorState message={error ?? t('app.errorIndex')} offline={!online} onRetry={() => void load(true)} />}

      {(status === 'loading' || status === 'idle') && (
        <div aria-busy="true">
          <p role="status" className="mb-3 text-sm text-muted">
            {progress ? t('app.buildingIndex', { done: progress.done, total: progress.total }) : t('app.loadingIndex')}
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-3.5">
            {Array.from({ length: 18 }, (_, i) => (
              <div key={i} className="h-[248px]">
                <PokemonCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'ready' && results.length === 0 && (
        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass mx-auto my-12 max-w-md rounded-3xl p-8 text-center">
          <p className="text-4xl" aria-hidden>
            🔍
          </p>
          <p className="mt-3 font-semibold">{t('list.empty')}</p>
          <button type="button" onClick={reset} className="mt-4 h-10 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-fg">
            {t('list.resetFilters')}
          </button>
        </m.div>
      )}

      {status === 'ready' && results.length > 0 && (
        <VirtualGrid items={results} getKey={(e) => e.id} renderItem={renderItem} label={t('list.gridLabel')} />
      )}

      </div>

      <FiltersPanel open={panelOpen} onClose={closePanel} resultCount={results.length} />
    </div>
  );
}
