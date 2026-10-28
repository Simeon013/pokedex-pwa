/**
 * Statistiques de base : barres animées, total, valeurs min/max au niveau 50 ou 100,
 * et estimation du potentiel (rang centile parmi tous les Pokémon).
 */
import { m, useInView } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { STAT_KEYS, type BaseStats } from '@/domain/models';
import { MAX_BASE_STAT, potential, statRanges, statTotal } from '@/domain/stats';
import { useLang, formatNumber, useT } from '@/i18n';
import { useIndexStore } from '@/store/pokedexIndex';

/** Couleur d'une barre selon la valeur (du rouge au turquoise). */
export function statColor(value: number): string {
  if (value < 50) return '#ef5350';
  if (value < 70) return '#ff9f43';
  if (value < 90) return '#f9d342';
  if (value < 110) return '#7bd66b';
  if (value < 135) return '#2ecc9a';
  return '#22c4e0';
}

const TIER_STYLE: Record<string, string> = {
  S: 'from-amber-300 to-orange-500 text-black',
  A: 'from-emerald-300 to-teal-500 text-black',
  B: 'from-sky-300 to-indigo-500 text-white',
  C: 'from-slate-300 to-slate-500 text-black',
  D: 'from-zinc-400 to-zinc-600 text-white',
};

export function StatBars({ stats, evs }: { stats: BaseStats; evs?: BaseStats }) {
  const t = useT();
  const lang = useLang();
  const [level, setLevel] = useState<50 | 100>(100);
  // L'observation se fait sur le tableau : une barre à scaleX(0) n'a pas de surface visible.
  const tableRef = useRef<HTMLTableElement>(null);
  const inView = useInView(tableRef, { once: true, margin: '0px 0px -40px 0px' });
  const species = useIndexStore((s) => s.species);
  const allTotals = useMemo(() => species.map((e) => statTotal(e.stats)), [species]);
  const ranges = statRanges(stats, level);
  const total = statTotal(stats);
  const pot = potential(stats, allTotals);

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-2">
        <div className="flex rounded-xl border border-line p-0.5 text-xs" role="group" aria-label={t('detail.rangeHelp')}>
          {([50, 100] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={level === l}
              onClick={() => setLevel(l)}
              className={`rounded-lg px-2.5 py-1 font-semibold ${level === l ? 'bg-surface-2' : 'text-muted'}`}
            >
              {t('detail.level', { n: l })}
            </button>
          ))}
        </div>
      </div>

      <table ref={tableRef} className="w-full border-separate border-spacing-y-1.5 text-sm">
        <caption className="sr-only">{t('detail.stats')}</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{t('detail.stats')}</th>
            <th scope="col">{t('detail.base')}</th>
            <td />
            <th scope="col">Min</th>
            <th scope="col">Max</th>
          </tr>
        </thead>
        <tbody>
          {STAT_KEYS.map((key, i) => {
            const value = stats[i] ?? 0;
            const range = ranges[i];
            const ev = evs?.[i] ?? 0;
            return (
              <tr key={key}>
                <th scope="row" className="w-24 pr-2 text-left font-medium whitespace-nowrap text-muted sm:w-28">
                  {t(`sort.${key}`)}
                  {ev > 0 && (
                    <span className="ml-1 rounded bg-surface-2 px-1 text-[10px] font-bold text-fg" title={t('detail.evYield')}>
                      +{ev}
                    </span>
                  )}
                </th>
                <td className="w-10 pr-3 text-right font-bold tabular-nums">{value}</td>
                <td className="w-full" aria-hidden>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                    <m.div
                      className="h-full origin-left rounded-full"
                      style={{ width: `${Math.min(100, (value / MAX_BASE_STAT) * 100)}%`, backgroundColor: statColor(value) }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: inView ? 1 : 0 }}
                      transition={{ duration: 0.8, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </td>
                <td className="w-12 pl-3 text-right text-xs text-muted tabular-nums">{range?.min}</td>
                <td className="w-12 pl-2 text-right text-xs text-muted tabular-nums">{range?.max}</td>
              </tr>
            );
          })}
          <tr>
            <th scope="row" className="pt-2 pr-2 text-left font-bold">
              {t('detail.total')}
            </th>
            <td className="pt-2 pr-3 text-right text-base font-extrabold tabular-nums">{total}</td>
            <td colSpan={3} className="pt-2 text-right text-xs text-muted">
              {t('detail.level', { n: level })} · min / max
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-1 text-xs text-muted">{t('detail.rangeHelp')}</p>

      <div className="mt-5 flex items-center gap-4 rounded-2xl bg-surface-2 p-4">
        <m.div
          className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl font-black shadow-lg ${TIER_STYLE[pot.tier]}`}
          initial={{ rotate: -12, scale: 0.6, opacity: 0 }}
          whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.5 }}
          aria-hidden
        >
          {pot.tier}
        </m.div>
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">{t('detail.potential')}</p>
          <p className="font-bold">
            <span className="sr-only">{pot.tier} — </span>
            {t(`roles.${pot.role}`)}
          </p>
          <p className="text-sm text-muted">{t('detail.percentile', { p: formatNumber(pot.percentile, lang) })}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">{t('detail.potentialHelp')}</p>
    </div>
  );
}
