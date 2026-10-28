/**
 * Fiche complète d'un Pokémon : en-tête (artwork, noms, catégorie, types, cri), navigation
 * précédent/suivant (flèches du clavier, balayage sur mobile), puis les sections :
 * statistiques, faiblesses, talents, caractéristiques, évolutions, formes,
 * entrées du Pokédex, lieux de rencontre et jeux.
 */
import { m } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError } from '@/api/pokeapi';
import { loadEvolution, loadPokemonDetail, prefetchDetails } from '@/api/queries';
import { Abilities } from '@/components/detail/Abilities';
import { CryPlayer } from '@/components/detail/CryPlayer';
import { Encounters, GamesList } from '@/components/detail/Encounters';
import { EvolutionTree } from '@/components/detail/EvolutionTree';
import { FlavorTexts } from '@/components/detail/FlavorTexts';
import { FormsList } from '@/components/detail/FormsList';
import { InfoGrid } from '@/components/detail/InfoGrid';
import { Section, SectionSkeleton } from '@/components/detail/Section';
import { StatBars } from '@/components/detail/StatBars';
import { TypeMatchups } from '@/components/detail/TypeMatchups';
import { ErrorState } from '@/components/Feedback';
import { FavoriteButton } from '@/components/FavoriteButton';
import { PokemonImage } from '@/components/PokemonImage';
import { TypeBadge } from '@/components/TypeBadge';
import { ChevronIcon } from '@/components/ui/Icons';
import { displayName } from '@/domain/filters';
import type { EvolutionNode, IndexEntry, PokemonDetail } from '@/domain/models';
import { TYPE_COLORS } from '@/domain/typeChart';
import { useHotkey } from '@/hooks/useHotkey';
import { useOnline } from '@/hooks/useOnline';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useResource } from '@/hooks/useResource';
import { useSwipe } from '@/hooks/useSwipe';
import { formatDexNumber, useLang, useT, type MessageKey } from '@/i18n';
import { useIndexStore } from '@/store/pokedexIndex';
import { useSettings } from '@/store/settings';
import NotFoundPage from './NotFoundPage';

const SECTIONS: Array<{ id: string; key: MessageKey }> = [
  { id: 'stats', key: 'detail.stats' },
  { id: 'matchups', key: 'detail.matchups' },
  { id: 'abilities', key: 'detail.abilities' },
  { id: 'evolution', key: 'detail.evolution' },
  { id: 'forms', key: 'detail.forms' },
  { id: 'entries', key: 'detail.entries' },
  { id: 'locations', key: 'detail.locations' },
];

function NeighborLink({ entry, dir }: { entry: IndexEntry | undefined; dir: 'left' | 'right' }) {
  const t = useT();
  const lang = useLang();
  if (!entry) return <span />;
  const name = displayName(entry, lang);
  return (
    <Link
      to={`/pokemon/${entry.id}`}
      aria-label={t(dir === 'left' ? 'detail.previous' : 'detail.next', { name })}
      className="glass flex min-w-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold hover:bg-surface-2"
    >
      {dir === 'left' && <ChevronIcon dir="left" />}
      <PokemonImage id={entry.id} alt="" size={28} className="size-7 shrink-0" />
      <span className="hidden font-mono text-xs text-muted sm:inline">{formatDexNumber(entry.speciesId)}</span>
      <span className="truncate">{name}</span>
      {dir === 'right' && <ChevronIcon />}
    </Link>
  );
}

function EvolutionSection({ chainId, speciesId }: { chainId: number | null; speciesId: number }) {
  const t = useT();
  const evo = useResource<EvolutionNode>(chainId ? `evolution:${chainId}` : null, (o) => loadEvolution(chainId ?? 0, o));
  return (
    <Section id="evolution" title={t('detail.evolution')}>
      {!chainId ? (
        <p className="text-sm text-muted">{t('detail.noEvolution')}</p>
      ) : evo.status === 'loading' ? (
        <SectionSkeleton lines={3} />
      ) : evo.status === 'error' ? (
        <p className="text-sm text-muted">
          {t('detail.sectionError')}{' '}
          <button type="button" onClick={evo.retry} className="font-semibold text-fg underline">
            {t('app.retry')}
          </button>
        </p>
      ) : (
        <EvolutionTree root={evo.data} currentSpeciesId={speciesId} />
      )}
    </Section>
  );
}

function DetailSections({ d }: { d: PokemonDetail }) {
  const t = useT();
  return (
    <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
      <Section id="stats" title={t('detail.stats')}>
        <StatBars stats={d.stats} evs={d.evs} />
      </Section>
      <div className="grid min-w-0 content-start gap-5">
        <Section id="matchups" title={t('detail.matchups')}>
          <TypeMatchups types={d.types} />
        </Section>
        <Section id="abilities" title={t('detail.abilities')}>
          <Abilities abilities={d.abilities} />
        </Section>
      </div>
      <Section id="info" title={t('detail.info')} className="lg:col-span-2">
        <InfoGrid d={d} />
      </Section>
      <div className="min-w-0 lg:col-span-2">
        <EvolutionSection chainId={d.evolutionChainId} speciesId={d.speciesId} />
      </div>
      {d.forms.length > 1 && (
        <Section id="forms" title={t('detail.forms')} className="lg:col-span-2" aside={<span className="text-sm text-muted">{d.forms.length}</span>}>
          <FormsList forms={d.forms} currentId={d.id} />
        </Section>
      )}
      <Section id="entries" title={t('detail.entries')} className="lg:col-span-2">
        <FlavorTexts entries={d.flavorTexts} />
      </Section>
      <Section id="locations" title={t('detail.locations')} className={d.games.length ? '' : 'lg:col-span-2'}>
        <Encounters pokemonId={d.id} />
      </Section>
      {d.games.length > 0 && (
        <Section id="games" title={t('detail.games')}>
          <GamesList games={d.games} />
        </Section>
      )}
    </div>
  );
}

export default function DetailPage() {
  const { id: param } = useParams();
  const id = Number(param);
  const t = useT();
  const lang = useLang();
  const online = useOnline();
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const playCryOnOpen = useSettings((s) => s.playCryOnOpen);
  const entry = useIndexStore((s) => s.byId.get(id));
  const species = useIndexStore((s) => s.species);
  const valid = Number.isInteger(id) && id > 0;
  const detail = useResource<PokemonDetail>(valid ? `detail:${id}` : null, (o) => loadPokemonDetail(id, o));

  const { prev, next } = useMemo(() => {
    const speciesId = entry?.speciesId ?? id;
    const i = species.findIndex((e) => e.speciesId === speciesId);
    return { prev: i > 0 ? species[i - 1] : undefined, next: i >= 0 ? species[i + 1] : undefined };
  }, [species, entry, id]);

  // Précharge les fiches voisines pour une navigation instantanée.
  useEffect(() => {
    if (detail.status !== 'ready') return;
    const timer = setTimeout(() => prefetchDetails([prev, next].filter((e): e is IndexEntry => !!e)), 400);
    return () => clearTimeout(timer);
  }, [detail.status, prev, next]);

  const goPrev = () => prev && navigate(`/pokemon/${prev.id}`);
  const goNext = () => next && navigate(`/pokemon/${next.id}`);
  useHotkey('ArrowLeft', goPrev);
  useHotkey('ArrowRight', goNext);
  const swipeRef = useSwipe<HTMLElement>({ onLeft: goNext, onRight: goPrev });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  if (!valid) return <NotFoundPage />;
  if (detail.status === 'error') {
    if (detail.error instanceof ApiError && detail.error.kind === 'not-found') return <NotFoundPage />;
    return <ErrorState message={t('app.errorGeneric')} offline={!online} onRetry={detail.retry} />;
  }

  const d = detail.data;
  const name = d ? (d.formNames?.[lang] ?? d.formNames?.en ?? d.names[lang] ?? d.names.en) : entry ? displayName(entry, lang) : '';
  const types = d?.types ?? entry?.types ?? [];
  const color = TYPE_COLORS[types[0] ?? 'normal'];
  const accent2 = TYPE_COLORS[types[1] ?? types[0] ?? 'normal'];
  const otherNames = d ? Object.entries(d.names).filter(([l, n]) => l !== lang && n !== name) : [];

  return (
    <article ref={swipeRef} className="mx-auto max-w-6xl px-4 pt-5 pb-20 sm:px-6">
      <nav className="mb-4 grid grid-cols-2 gap-2" aria-label="Pokémon">
        <div className="flex min-w-0">
          <NeighborLink entry={prev} dir="left" />
        </div>
        <div className="flex min-w-0 justify-end">
          <NeighborLink entry={next} dir="right" />
        </div>
      </nav>

      <section
        className="glass relative overflow-hidden rounded-[2rem] p-5 sm:p-8 lg:p-10"
        style={{
          backgroundImage: `radial-gradient(40rem 26rem at 25% 25%, color-mix(in oklab, ${color.glow} 38%, transparent), transparent 70%), radial-gradient(30rem 20rem at 90% 100%, color-mix(in oklab, ${accent2.glow} 22%, transparent), transparent 70%)`,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-6 right-4 font-mono text-[7rem] leading-none font-black text-fg/[0.04] select-none sm:text-[10rem]"
        >
          {formatDexNumber(entry?.speciesId ?? d?.speciesId ?? id).slice(1)}
        </span>
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_1.15fr]">
          <m.div layoutId={reduced ? undefined : `sprite-${id}`} className="mx-auto">
            <PokemonImage
              id={id}
              src={d?.sprites.artwork}
              alt={name}
              size={360}
              priority
              className="size-[min(340px,72vw)] drop-shadow-[0_24px_30px_rgb(0_0_0_/_0.4)]"
            />
          </m.div>
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-muted">{formatDexNumber(entry?.speciesId ?? d?.speciesId ?? id)}</p>
            <div className="flex items-start gap-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">{name}</h1>
              <FavoriteButton id={id} name={name} className="mt-1 shrink-0" />
            </div>
            {d ? <p className="mt-1 text-muted">{d.genera[lang] ?? d.genera.en}</p> : <div className="shimmer mt-2 h-4 w-40 rounded" />}
            <div className="mt-4 flex flex-wrap gap-2">
              {types.map((type) => (
                <TypeBadge key={type} type={type} size="md" />
              ))}
              {d && d.rarity !== 'normal' && (
                <span className="rounded-full border border-line px-3 py-1 text-sm font-semibold">{t(`rarityOne.${d.rarity}`)}</span>
              )}
            </div>
            {otherNames.length > 0 && (
              <p className="mt-3 text-sm text-muted">
                {otherNames.slice(0, 6).map(([l, n], i) => (
                  <span key={l} lang={l === 'zh-hans' ? 'zh-Hans' : l}>
                    {i > 0 && ' · '}
                    {n}
                  </span>
                ))}
              </p>
            )}
            <div className="mt-5">
              {d ? (
                <CryPlayer latest={d.cries.latest} legacy={d.cries.legacy} name={name} color={color.bg} iconColor={color.fg} autoPlay={playCryOnOpen} />
              ) : (
                <div className="shimmer h-12 w-full rounded-full" />
              )}
            </div>
          </div>
        </div>
      </section>

      <nav aria-label={t('detail.sections')} className="no-scrollbar sticky top-[69px] z-20 -mx-4 mt-4 overflow-x-auto bg-bg/70 px-4 py-2 backdrop-blur-xl sm:mx-0 sm:rounded-2xl">
        <ul className="flex gap-1.5">
          {SECTIONS.filter((s) => s.id !== 'forms' || (d?.forms.length ?? 0) > 1).map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="block rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-muted hover:bg-surface-2 hover:text-fg">
                {t(s.key)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {d ? (
        <DetailSections d={d} />
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-3xl p-6">
              <SectionSkeleton />
            </div>
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-muted md:hidden">{t('detail.swipeHint')}</p>
    </article>
  );
}
