/** Lieux de rencontre à l'état sauvage, groupés par version, et liste des jeux où le Pokémon apparaît. */
import { useState } from 'react';
import { loadEncounters } from '@/api/queries';
import type { EncounterGroup } from '@/domain/models';
import { ResourceName } from '@/hooks/useLocalizedName';
import { useResource } from '@/hooks/useResource';
import { useT } from '@/i18n';
import { SectionSkeleton } from './Section';

const INITIAL_VERSIONS = 4;

function VersionBlock({ group }: { group: EncounterGroup }) {
  const t = useT();
  return (
    <details className="group rounded-2xl bg-surface-2 open:pb-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 font-semibold">
        <span>
          <ResourceName kind="version" slug={group.version} />
        </span>
        <span className="flex items-center gap-2 text-xs text-muted">
          {group.locations.length}
          <svg viewBox="0 0 24 24" className="size-4 transition-transform group-open:rotate-180" aria-hidden>
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
        </span>
      </summary>
      <ul className="grid gap-1 px-3.5 text-sm">
        {group.locations.map((l, i) => (
          <li key={`${l.area}-${i}`} className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-line py-1.5 first:border-t-0">
            <span className="font-medium">
              <ResourceName kind="location-area" slug={l.area} />
            </span>
            <span className="text-xs text-muted">
              {l.methods.map((method, j) => (
                <span key={method}>
                  {j > 0 && ', '}
                  <ResourceName kind="encounter-method" slug={method} />
                </span>
              ))}
              {' · '}
              {l.minLevel === l.maxLevel ? t('detail.levelSingle', { n: l.minLevel }) : t('detail.levels', { min: l.minLevel, max: l.maxLevel })}
              {' · '}
              {t('detail.chance', { p: l.chance })}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function Encounters({ pokemonId }: { pokemonId: number }) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const res = useResource<EncounterGroup[]>(`encounters:${pokemonId}`, (o) => loadEncounters(pokemonId, o));

  if (res.status === 'loading') return <SectionSkeleton lines={3} />;
  if (res.status === 'error')
    return (
      <p className="text-sm text-muted">
        {t('detail.sectionError')}{' '}
        <button type="button" onClick={res.retry} className="font-semibold text-fg underline">
          {t('app.retry')}
        </button>
      </p>
    );
  const groups = [...res.data].reverse();
  if (groups.length === 0) return <p className="text-sm text-muted">{t('detail.noLocations')}</p>;
  const shown = expanded ? groups : groups.slice(0, INITIAL_VERSIONS);
  return (
    <div className="grid gap-2">
      {shown.map((g) => (
        <VersionBlock key={g.version} group={g} />
      ))}
      {groups.length > INITIAL_VERSIONS && (
        <button type="button" onClick={() => setExpanded((e) => !e)} className="justify-self-start text-sm font-semibold text-muted hover:text-fg">
          {expanded ? t('detail.showLess') : t('detail.showMore', { n: groups.length - INITIAL_VERSIONS })}
        </button>
      )}
    </div>
  );
}

export function GamesList({ games }: { games: string[] }) {
  const t = useT();
  if (games.length === 0) return <p className="text-sm text-muted">{t('detail.none')}</p>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {games.map((g) => (
        <li key={g} className="rounded-full border border-line px-2.5 py-1 text-xs font-medium">
          <ResourceName kind="version" slug={g} />
        </li>
      ))}
    </ul>
  );
}
