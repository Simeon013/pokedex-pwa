/** Talents (normaux et caché) avec nom et description traduits. */
import { useEffect, useState } from 'react';
import { prettifySlug } from '@/api/normalize';
import { loadAbility, type AbilityInfo } from '@/api/queries';
import type { AbilityRef } from '@/domain/models';
import { useLang, useT } from '@/i18n';

function AbilityCard({ ability }: { ability: AbilityRef }) {
  const t = useT();
  const lang = useLang();
  const [info, setInfo] = useState<AbilityInfo | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setInfo(null);
    setFailed(false);
    loadAbility(ability.id)
      .then((i) => !cancelled && setInfo(i))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [ability.id]);

  const name = info ? (info.names[lang] ?? info.names.en) : prettifySlug(ability.slug);
  const description = info ? (info.descriptions[lang] ?? info.descriptions.en) : null;

  return (
    <li className={`rounded-2xl p-3.5 ${ability.hidden ? 'border border-dashed border-line bg-surface' : 'bg-surface-2'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-bold">{name}</h3>
        {ability.hidden && (
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-violet-700 uppercase dark:text-violet-300">
            {t('detail.hiddenAbility')}
          </span>
        )}
      </div>
      {description ? (
        <p className="mt-1 text-sm text-muted">{description}</p>
      ) : !failed ? (
        <div className="shimmer mt-2 h-3.5 w-4/5 rounded" aria-hidden />
      ) : null}
    </li>
  );
}

export function Abilities({ abilities }: { abilities: AbilityRef[] }) {
  return (
    <ul className="grid gap-2.5">
      {abilities.map((a) => (
        <AbilityCard key={`${a.id}-${a.hidden}`} ability={a} />
      ))}
    </ul>
  );
}
