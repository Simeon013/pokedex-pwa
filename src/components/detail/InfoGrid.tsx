/** Caractéristiques : taille, poids, sexes, capture, bonheur, œufs, croissance, expérience, habitat. */
import type { ReactNode } from 'react';
import type { PokemonDetail } from '@/domain/models';
import { catchProbability } from '@/domain/stats';
import { ResourceName } from '@/hooks/useLocalizedName';
import { formatNumber, useLang, useT, type MessageKey } from '@/i18n';

function Item({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`rounded-2xl bg-surface-2 p-3 ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-[11px] font-bold tracking-wider text-muted uppercase">{label}</dt>
      <dd className="mt-1 font-semibold">{children}</dd>
    </div>
  );
}

function GenderBar({ ratio }: { ratio: number | null }) {
  const t = useT();
  const lang = useLang();
  if (ratio === null) return <span>{t('detail.genderless')}</span>;
  const female = ratio * 100;
  const male = 100 - female;
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface" aria-hidden>
        <div className="bg-sky-500" style={{ width: `${male}%` }} />
        <div className="bg-pink-500" style={{ width: `${female}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-xs">
        <span className="text-sky-700 dark:text-sky-300">
          ♂ {t('detail.male')} {formatNumber(male, lang, { maximumFractionDigits: 1 })} %
        </span>
        <span className="text-pink-700 dark:text-pink-300">
          ♀ {t('detail.female')} {formatNumber(female, lang, { maximumFractionDigits: 1 })} %
        </span>
      </div>
    </div>
  );
}

export function InfoGrid({ d }: { d: PokemonDetail }) {
  const t = useT();
  const lang = useLang();
  const num = (n: number, o?: Intl.NumberFormatOptions) => formatNumber(n, lang, o);
  const growthKey = `growth.${d.growthRate}` as MessageKey;
  const growth = t(growthKey);

  return (
    <dl className="grid grid-cols-2 gap-2.5">
      <Item label={t('detail.height')}>{num(d.heightM, { style: 'unit', unit: 'meter', maximumFractionDigits: 1 })}</Item>
      <Item label={t('detail.weight')}>{num(d.weightKg, { style: 'unit', unit: 'kilogram', maximumFractionDigits: 1 })}</Item>
      <Item label={t('detail.gender')} wide>
        <GenderBar ratio={d.femaleRatio} />
      </Item>
      <Item label={t('detail.captureRate')}>
        {d.captureRate}
        <span className="block text-xs font-normal text-muted">
          {t('detail.captureChance', { p: num(catchProbability(d.captureRate) * 100, { maximumFractionDigits: 1 }) })}
        </span>
      </Item>
      <Item label={t('detail.baseHappiness')}>{d.baseHappiness ?? '—'}</Item>
      <Item label={t('detail.eggGroups')}>
        {d.eggGroups.length
          ? d.eggGroups.map((g, i) => (
              <span key={g}>
                {i > 0 && ', '}
                <ResourceName kind="egg-group" slug={g} />
              </span>
            ))
          : '—'}
      </Item>
      <Item label={t('detail.hatchSteps')}>
        {d.hatchCounter !== null ? t('detail.steps', { n: num((d.hatchCounter + 1) * 255) }) : '—'}
      </Item>
      <Item label={t('detail.growthRate')}>{growth === growthKey ? d.growthRate : growth}</Item>
      <Item label={t('detail.baseExp')}>{d.baseExperience ?? '—'}</Item>
      {d.habitat && (
        <Item label={t('detail.habitat')} wide>
          <ResourceName kind="pokemon-habitat" slug={d.habitat} />
        </Item>
      )}
    </dl>
  );
}
