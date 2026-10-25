/**
 * Fiche d'un Pokémon — version de l'étape 2 : en-tête (artwork, noms, catégorie, types,
 * description) et navigation précédent/suivant. Les sections complètes (stats, faiblesses,
 * évolutions, formes, lieux, cris) arrivent à l'étape 3.
 */
import { m } from 'framer-motion';
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError } from '@/api/pokeapi';
import { loadPokemonDetail } from '@/api/queries';
import { ErrorState } from '@/components/Feedback';
import { FavoriteButton } from '@/components/FavoriteButton';
import { PokemonImage } from '@/components/PokemonImage';
import { TypeBadge } from '@/components/TypeBadge';
import { ChevronIcon } from '@/components/ui/Icons';
import { displayName } from '@/domain/filters';
import type { PokemonDetail } from '@/domain/models';
import { TYPE_COLORS } from '@/domain/typeChart';
import { useHotkey } from '@/hooks/useHotkey';
import { useOnline } from '@/hooks/useOnline';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useResource } from '@/hooks/useResource';
import { formatDexNumber, useLang, useT } from '@/i18n';
import { useIndexStore } from '@/store/pokedexIndex';
import NotFoundPage from './NotFoundPage';

export default function DetailPage() {
  const { id: param } = useParams();
  const id = Number(param);
  const t = useT();
  const lang = useLang();
  const online = useOnline();
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const entry = useIndexStore((s) => s.byId.get(id));
  const species = useIndexStore((s) => s.species);
  const detail = useResource<PokemonDetail>(Number.isInteger(id) && id > 0 ? `detail:${id}` : null, (o) => loadPokemonDetail(id, o));

  const { prev, next } = useMemo(() => {
    const speciesId = entry?.speciesId ?? id;
    const i = species.findIndex((e) => e.speciesId === speciesId);
    return { prev: i > 0 ? species[i - 1] : undefined, next: i >= 0 ? species[i + 1] : undefined };
  }, [species, entry, id]);

  useHotkey('ArrowLeft', () => prev && navigate(`/pokemon/${prev.id}`));
  useHotkey('ArrowRight', () => next && navigate(`/pokemon/${next.id}`));

  if (!Number.isInteger(id) || id <= 0) return <NotFoundPage />;
  if (detail.status === 'error') {
    if (detail.error instanceof ApiError && detail.error.kind === 'not-found') return <NotFoundPage />;
    return <ErrorState message={t('app.errorGeneric')} offline={!online} onRetry={detail.retry} />;
  }

  const d = detail.data;
  const name = d ? (d.formNames?.[lang] ?? d.formNames?.en ?? d.names[lang] ?? d.names.en) : entry ? displayName(entry, lang) : '';
  const types = d?.types ?? entry?.types ?? [];
  const color = TYPE_COLORS[types[0] ?? 'normal'];
  const flavor = d?.flavorTexts.filter((f) => f.lang === lang).at(-1) ?? d?.flavorTexts.filter((f) => f.lang === 'en').at(-1);

  return (
    <article className="mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-6">
      <nav className="mb-4 flex items-center justify-between text-sm" aria-label="Pokémon">
        {prev ? (
          <Link to={`/pokemon/${prev.id}`} className="glass flex items-center gap-1 rounded-xl px-3 py-2 font-semibold hover:bg-surface-2">
            <ChevronIcon dir="left" /> {formatDexNumber(prev.speciesId)} {displayName(prev, lang)}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/pokemon/${next.id}`} className="glass flex items-center gap-1 rounded-xl px-3 py-2 font-semibold hover:bg-surface-2">
            {displayName(next, lang)} {formatDexNumber(next.speciesId)} <ChevronIcon />
          </Link>
        )}
      </nav>

      <section
        className="glass relative overflow-hidden rounded-[2rem] p-6 sm:p-10"
        style={{ backgroundImage: `radial-gradient(40rem 25rem at 30% 20%, color-mix(in oklab, ${color.glow} 35%, transparent), transparent 70%)` }}
      >
        <div className="grid items-center gap-6 md:grid-cols-[1fr_1.1fr]">
          <m.div layoutId={reduced ? undefined : `sprite-${id}`} className="mx-auto">
            <PokemonImage id={id} src={d?.sprites.artwork} alt={name} size={360} priority className="size-[min(360px,80vw)] drop-shadow-[0_20px_30px_rgb(0_0_0_/_0.4)]" />
          </m.div>
          <div>
            <p className="font-mono text-sm font-semibold text-muted">{formatDexNumber(entry?.speciesId ?? id)}</p>
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{name}</h1>
              <FavoriteButton id={id} name={name} />
            </div>
            {d ? <p className="mt-1 text-muted">{d.genera[lang] ?? d.genera.en}</p> : <div className="shimmer mt-2 h-4 w-40 rounded" />}
            <div className="mt-4 flex gap-2">
              {types.map((type) => (
                <TypeBadge key={type} type={type} size="md" />
              ))}
            </div>
            {d ? (
              <p className="mt-6 max-w-prose leading-relaxed">{flavor?.text}</p>
            ) : (
              <div className="mt-6 space-y-2" aria-hidden>
                <div className="shimmer h-4 w-full rounded" />
                <div className="shimmer h-4 w-5/6 rounded" />
              </div>
            )}
          </div>
        </div>
      </section>
    </article>
  );
}
