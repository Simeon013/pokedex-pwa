/**
 * Entrées du Pokédex par version de jeu, dans la langue choisie (repli anglais).
 * Les textes identiques d'une version à l'autre sont regroupés.
 */
import { AnimatePresence, m } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { FlavorEntry } from '@/domain/models';
import { ResourceName } from '@/hooks/useLocalizedName';
import { useLang, useT } from '@/i18n';

interface Group {
  text: string;
  versions: string[];
}

export function groupFlavorTexts(entries: readonly FlavorEntry[], lang: string): Group[] {
  const own = entries.filter((e) => e.lang === lang);
  const list = own.length ? own : entries.filter((e) => e.lang === 'en');
  const groups = new Map<string, Group>();
  for (const e of list) {
    const key = e.text.toLowerCase().replace(/\s+/g, ' ');
    const g = groups.get(key);
    if (g) g.versions.push(e.version);
    else groups.set(key, { text: e.text, versions: [e.version] });
  }
  // Les plus récents d'abord.
  return [...groups.values()].reverse();
}

export function FlavorTexts({ entries }: { entries: FlavorEntry[] }) {
  const t = useT();
  const lang = useLang();
  const groups = useMemo(() => groupFlavorTexts(entries, lang), [entries, lang]);
  const [selected, setSelected] = useState(0);
  const current = groups[Math.min(selected, groups.length - 1)];

  if (!current) return <p className="text-sm text-muted">{t('detail.noEntries')}</p>;

  return (
    <div>
      <div role="tablist" aria-label={t('detail.versions')} className="no-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {groups.map((g, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            id={`flavor-tab-${i}`}
            aria-selected={i === selected}
            aria-controls="flavor-panel"
            onClick={() => setSelected(i)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${
              i === selected ? 'border-transparent bg-accent text-accent-fg' : 'border-line hover:bg-surface-2'
            }`}
          >
            {g.versions.slice(0, 2).map((v, j) => (
              <span key={v}>
                {j > 0 && ' · '}
                <ResourceName kind="version" slug={v} />
              </span>
            ))}
            {g.versions.length > 2 && ` +${g.versions.length - 2}`}
          </button>
        ))}
      </div>
      <div id="flavor-panel" role="tabpanel" aria-labelledby={`flavor-tab-${selected}`} className="relative min-h-16">
        <AnimatePresence mode="wait">
          <m.blockquote
            key={selected}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-l-4 border-accent pl-4 text-[15px] leading-relaxed"
          >
            <p>{current.text}</p>
            <footer className="mt-2 text-xs text-muted">
              {current.versions.map((v, j) => (
                <span key={v}>
                  {j > 0 && ', '}
                  <ResourceName kind="version" slug={v} />
                </span>
              ))}
            </footer>
          </m.blockquote>
        </AnimatePresence>
      </div>
    </div>
  );
}
