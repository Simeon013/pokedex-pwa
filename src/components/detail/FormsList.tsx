/** Formes alternatives de l'espèce (régionales, Méga, Gigamax, autres), avec lien vers chacune. */
import { m } from 'framer-motion';
import { Link } from 'react-router';
import { prettifySlug } from '@/api/normalize';
import { displayName } from '@/domain/filters';
import type { FormRef } from '@/domain/models';
import { useLang, useT } from '@/i18n';
import { useIndexStore } from '@/store/pokedexIndex';
import { PokemonImage } from '../PokemonImage';
import { TypeBadge } from '../TypeBadge';

export function FormsList({ forms, currentId }: { forms: FormRef[]; currentId: number }) {
  const t = useT();
  const lang = useLang();
  const byId = useIndexStore((s) => s.byId);

  return (
    <ul className="no-scrollbar -mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1">
      {forms.map((f, i) => {
        const entry = byId.get(f.id);
        const name = entry ? displayName(entry, lang) : prettifySlug(f.slug);
        const current = f.id === currentId;
        return (
          <m.li
            key={f.id}
            className="snap-start"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i, 8) * 0.05 }}
          >
            <Link
              to={`/pokemon/${f.id}`}
              aria-current={current ? 'page' : undefined}
              className={`group flex w-36 flex-col items-center rounded-2xl p-3 text-center transition-colors ${
                current ? 'bg-surface-2 ring-2 ring-accent' : 'bg-surface hover:bg-surface-2'
              }`}
            >
              <PokemonImage id={f.id} alt="" size={88} className="size-22 transition-transform group-hover:scale-110" />
              <span className="mt-1 line-clamp-2 text-sm leading-tight font-bold">{name}</span>
              <span className="mt-0.5 text-[10px] font-bold tracking-wider text-muted uppercase">
                {f.kind === 'default' ? (current ? t('detail.currentForm') : '') : t(`forms.${f.kind}`)}
              </span>
              {entry && (
                <span className="mt-1.5 flex flex-wrap justify-center gap-1">
                  {entry.types.map((type) => (
                    <TypeBadge key={type} type={type} />
                  ))}
                </span>
              )}
            </Link>
          </m.li>
        );
      })}
    </ul>
  );
}
