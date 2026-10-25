/**
 * Panneau de filtres et de tri : tiroir latéral (bureau) ou feuille du bas (mobile).
 * Dialogue modal accessible : focus initial, piège de focus, Échap pour fermer,
 * restitution du focus au bouton d'ouverture.
 */
import { AnimatePresence, m } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { RarityFilter, SortKey } from '@/domain/filters';
import { GENERATIONS, REGIONS } from '@/domain/generations';
import { TYPE_NAMES } from '@/domain/models';
import { TYPE_COLORS } from '@/domain/typeChart';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useT } from '@/i18n';
import { useFilters } from '@/store/filters';
import { TypeIcon } from './TypeIcon';
import { Chip } from './ui/Chip';
import { CloseIcon } from './ui/Icons';

interface Props {
  open: boolean;
  onClose: () => void;
  resultCount: number;
}

export const SORT_KEYS: SortKey[] = ['id', 'name', 'total', 'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
const RARITIES: RarityFilter[] = ['all', 'legendary', 'mythical', 'legendary-or-mythical', 'baby', 'regular'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <legend className="mb-2.5 float-left w-full text-xs font-bold tracking-wider text-muted uppercase">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5 text-sm">
      <span>{label}</span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className="relative h-6 w-10 shrink-0 rounded-full bg-surface-2 ring-1 ring-line transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
      />
    </label>
  );
}

export function FiltersPanel({ open, onClose, resultCount }: Props) {
  const t = useT();
  const f = useFilters();
  const desktop = useMediaQuery('(min-width: 768px)');
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    requestAnimationFrame(() => panel?.querySelector<HTMLElement>('button, input, select')?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab' && panel) {
        const focusables = [...panel.querySelectorAll<HTMLElement>('button, input, select, [tabindex]:not([tabindex="-1"])')].filter(
          (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  const variants = desktop ? { hidden: { x: '100%' }, shown: { x: 0 } } : { hidden: { y: '100%' }, shown: { y: 0 } };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <m.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-title"
            variants={variants}
            initial={reduced ? false : 'hidden'}
            animate="shown"
            exit={reduced ? { opacity: 0 } : 'hidden'}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className={`absolute flex flex-col border-line bg-bg shadow-2xl ${
              desktop ? 'inset-y-0 right-0 w-[400px] border-l' : 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl border-t'
            }`}
          >
            {!desktop && <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-surface-2" aria-hidden />}
            <header className="flex items-center justify-between px-5 pt-4 pb-3">
              <h2 id="filters-title" className="text-lg font-bold">
                {t('filters.title')}
              </h2>
              <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-surface-2" aria-label={t('filters.close')}>
                <CloseIcon />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
              <Section title={t('filters.sort')}>
                <div className="flex gap-2">
                  <select
                    aria-label={t('filters.sort')}
                    value={f.sort}
                    onChange={(e) => f.setSort(e.target.value as SortKey)}
                    className="h-10 flex-1 rounded-xl border border-line bg-surface px-3 text-sm"
                  >
                    {SORT_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {t(`sort.${k}`)}
                      </option>
                    ))}
                  </select>
                  <div className="flex rounded-xl border border-line p-0.5" role="group" aria-label={t('filters.sort')}>
                    {(['asc', 'desc'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={f.dir === d}
                        onClick={() => f.setDir(d)}
                        className={`rounded-lg px-3 text-sm ${f.dir === d ? 'bg-surface-2 font-semibold' : 'text-muted'}`}
                      >
                        {t(`filters.${d}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </Section>

              <Section title={t('filters.types')}>
                <div className="grid grid-cols-3 gap-1.5">
                  {TYPE_NAMES.map((type) => {
                    const c = TYPE_COLORS[type];
                    return (
                      <Chip
                        key={type}
                        selected={f.types.includes(type)}
                        onClick={() => f.toggleType(type)}
                        activeStyle={{ backgroundColor: c.bg, color: c.fg }}
                        className="justify-start px-2.5"
                      >
                        <TypeIcon type={type} className="size-3.5" />
                        <span className="truncate">{t(`types.${type}`)}</span>
                      </Chip>
                    );
                  })}
                </div>
                {f.types.length > 1 && (
                  <div className="mt-2 flex gap-1.5">
                    <Chip selected={f.typeMode === 'all'} onClick={() => f.setTypeMode('all')}>
                      {t('filters.typeModeAll')}
                    </Chip>
                    <Chip selected={f.typeMode === 'any'} onClick={() => f.setTypeMode('any')}>
                      {t('filters.typeModeAny')}
                    </Chip>
                  </div>
                )}
              </Section>

              <Section title={t('filters.generations')}>
                <div className="flex flex-wrap gap-1.5">
                  {GENERATIONS.map((g) => (
                    <Chip
                      key={g.id}
                      selected={f.generations.includes(g.id)}
                      onClick={() => f.toggleGeneration(g.id)}
                      aria-label={t('filters.generation', { n: g.id })}
                      className="min-w-11 justify-center font-mono"
                    >
                      {g.roman}
                    </Chip>
                  ))}
                </div>
              </Section>

              <Section title={t('filters.regions')}>
                <div className="flex flex-wrap gap-1.5">
                  {REGIONS.map((r) => (
                    <Chip key={r} selected={f.regions.includes(r)} onClick={() => f.toggleRegion(r)}>
                      {t(`regions.${r}`)}
                    </Chip>
                  ))}
                </div>
              </Section>

              <Section title={t('filters.rarity')}>
                <div className="flex flex-wrap gap-1.5">
                  {RARITIES.map((r) => (
                    <Chip key={r} selected={f.rarity === r} onClick={() => f.setRarity(r)}>
                      {t(`rarity.${r}`)}
                    </Chip>
                  ))}
                </div>
              </Section>

              <Section title={t('filters.collection')}>
                <Toggle checked={f.onlyFavorites} onChange={(v) => f.setFlag('onlyFavorites', v)} label={t('filters.onlyFavorites')} />
                <Toggle checked={f.onlySeen} onChange={(v) => f.setFlag('onlySeen', v)} label={t('filters.onlySeen')} />
                <Toggle checked={f.onlyCaught} onChange={(v) => f.setFlag('onlyCaught', v)} label={t('filters.onlyCaught')} />
                <Toggle checked={f.onlyShinyFound} onChange={(v) => f.setFlag('onlyShinyFound', v)} label={t('filters.onlyShinyFound')} />
                <div className="mt-2 border-t border-line pt-2">
                  <Toggle checked={f.includeForms} onChange={(v) => f.setFlag('includeForms', v)} label={t('filters.includeForms')} />
                </div>
              </Section>
            </div>

            <footer className="flex gap-2 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={f.reset} className="h-11 rounded-2xl border border-line px-4 text-sm font-semibold hover:bg-surface-2">
                {t('filters.reset')}
              </button>
              <button type="button" onClick={onClose} className="h-11 flex-1 rounded-2xl bg-accent text-sm font-bold text-accent-fg hover:brightness-110" aria-live="polite">
                {t('filters.showResults', { count: resultCount })}
              </button>
            </footer>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
