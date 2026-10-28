/** Faiblesses, résistances et immunités calculées à partir des types du Pokémon. */
import type { TypeName } from '@/domain/models';
import { defensiveProfile, TYPE_COLORS } from '@/domain/typeChart';
import { useT } from '@/i18n';
import { TypeIcon } from '../TypeIcon';

function formatMultiplier(m: number): string {
  if (m === 0.25) return '¼';
  if (m === 0.5) return '½';
  return String(m);
}

function Chip({ type, multiplier }: { type: TypeName; multiplier: number }) {
  const t = useT();
  const c = TYPE_COLORS[type];
  return (
    <li
      className="inline-flex items-center gap-1.5 rounded-full py-1 pr-1 pl-2.5 text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      <TypeIcon type={type} className="size-3.5" />
      {t(`types.${type}`)}
      <span className="rounded-full bg-black/25 px-1.5 py-px font-mono text-[11px] text-white" aria-label={`×${multiplier}`}>
        ×{formatMultiplier(multiplier)}
      </span>
    </li>
  );
}

function Group({ title, items, tone }: { title: string; items: Array<{ type: TypeName; multiplier: number }>; tone: string }) {
  const t = useT();
  return (
    <div>
      <h3 className={`mb-2 text-xs font-bold tracking-wider uppercase ${tone}`}>
        {title} <span className="text-muted">({items.length})</span>
      </h3>
      {items.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((i) => (
            <Chip key={i.type} type={i.type} multiplier={i.multiplier} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{t('detail.none')}</p>
      )}
    </div>
  );
}

export function TypeMatchups({ types }: { types: TypeName[] }) {
  const t = useT();
  const p = defensiveProfile(types);
  return (
    <div className="grid gap-5">
      <Group title={t('detail.weakTo')} items={p.weaknesses} tone="text-rose-600 dark:text-rose-400" />
      <Group title={t('detail.resists')} items={p.resistances} tone="text-emerald-700 dark:text-emerald-400" />
      <Group title={t('detail.immuneTo')} items={p.immunities.map((type) => ({ type, multiplier: 0 }))} tone="text-sky-700 dark:text-sky-400" />
    </div>
  );
}
