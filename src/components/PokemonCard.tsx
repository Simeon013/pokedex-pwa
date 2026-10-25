/**
 * Carte de la grille : numéro, artwork sur halo coloré par type, nom, types, favori.
 * L'artwork porte un `layoutId` pour la transition partagée vers la fiche (étape 4).
 */
import { m } from 'framer-motion';
import { memo, useRef, type PointerEvent } from 'react';
import { Link } from 'react-router';
import { displayName } from '@/domain/filters';
import type { IndexEntry, Lang } from '@/domain/models';
import { TYPE_COLORS } from '@/domain/typeChart';
import { formatDexNumber, useT } from '@/i18n';
import { FavoriteButton } from './FavoriteButton';
import { PokemonImage } from './PokemonImage';
import { TypeBadge } from './TypeBadge';

interface Props {
  entry: IndexEntry;
  lang: Lang;
  /** Délai d'apparition en cascade (s), ou null pour ne pas animer. */
  appearDelay: number | null;
  reducedMotion: boolean;
}

export const PokemonCard = memo(function PokemonCard({ entry, lang, appearDelay, reducedMotion }: Props) {
  const t = useT();
  const name = displayName(entry, lang);
  const primary = TYPE_COLORS[entry.types[0] ?? 'normal'];
  const secondary = TYPE_COLORS[entry.types[1] ?? entry.types[0] ?? 'normal'];
  const cardRef = useRef<HTMLDivElement>(null);

  // Inclinaison légère qui suit le pointeur (désactivée si animations réduites).
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || e.pointerType !== 'mouse' || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cardRef.current.style.transform = `perspective(700px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-2px)`;
  };
  const onLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = '';
  };

  return (
    <m.div
      className="h-full"
      initial={appearDelay === null || reducedMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: appearDelay ?? 0, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Le lien couvre toute la carte via ::after ; le bouton favori reste au-dessus (pas d'élément interactif imbriqué). */}
      <div
        ref={cardRef}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="group glass relative flex h-full flex-col overflow-hidden rounded-3xl p-3 transition-[transform,box-shadow] duration-200 ease-out will-change-transform hover:shadow-[0_18px_50px_-18px_var(--card-glow)] has-[a:focus-visible]:shadow-[0_18px_50px_-18px_var(--card-glow)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent"
        style={{ ['--card-glow' as string]: primary.glow }}
      >
        <div className="flex items-start justify-between">
          <span className="font-mono text-xs font-semibold text-muted tabular-nums">{formatDexNumber(entry.speciesId)}</span>
          <FavoriteButton id={entry.id} name={name} className="z-10 -mt-1.5 -mr-1.5" />
        </div>

        <div className="relative mx-auto -mt-2 grid min-h-0 w-full max-w-[150px] flex-1 place-items-center">
          <div
            aria-hidden
            className="absolute inset-[12%] rounded-full opacity-50 blur-xl transition-[opacity,transform] duration-300 group-hover:scale-110 group-hover:opacity-80"
            style={{ background: `radial-gradient(circle at 40% 35%, ${primary.glow}, ${secondary.bg} 70%, transparent 72%)` }}
          />
          <m.div layoutId={reducedMotion ? undefined : `sprite-${entry.id}`} className="relative">
            <PokemonImage
              id={entry.id}
              alt=""
              size={140}
              className="aspect-square h-auto max-h-full w-auto max-w-full drop-shadow-[0_8px_12px_rgb(0_0_0_/_0.35)] transition-transform duration-300 group-hover:scale-105"
            />
          </m.div>
        </div>

        <div className="shrink-0 pt-1 text-center">
          <h3 className="truncate text-[15px] leading-tight font-bold" title={name}>
            <Link
              to={`/pokemon/${entry.id}`}
              aria-label={t('list.open', { name })}
              className="outline-none after:absolute after:inset-0 after:rounded-3xl after:content-['']"
            >
              {name}
            </Link>
          </h3>
          {entry.formKind !== 'default' && (
            <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-muted uppercase">{t(`forms.${entry.formKind}`)}</p>
          )}
          <div className="mt-2 flex justify-center gap-1">
            {entry.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      </div>
    </m.div>
  );
});

export function PokemonCardSkeleton() {
  return (
    <div className="glass flex h-full flex-col rounded-3xl p-3" aria-hidden>
      <div className="shimmer h-3 w-12 rounded" />
      <div className="shimmer mx-auto mt-3 aspect-square w-3/4 rounded-full" />
      <div className="shimmer mx-auto mt-auto h-4 w-2/3 rounded" />
      <div className="mt-2 flex justify-center gap-1">
        <div className="shimmer h-4 w-14 rounded-full" />
        <div className="shimmer h-4 w-14 rounded-full" />
      </div>
    </div>
  );
}
