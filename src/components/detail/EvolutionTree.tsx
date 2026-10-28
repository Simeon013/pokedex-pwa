/**
 * Arbre d'évolution animé. Chaque branche affiche ses conditions (niveau, objet, bonheur,
 * moment de la journée…) ; les embranchements multiples (Évoli) s'empilent.
 * Disposition horizontale sur grand écran, verticale sur mobile.
 */
import { m } from 'framer-motion';
import { Fragment } from 'react';
import { Link } from 'react-router';
import { displayName } from '@/domain/filters';
import { countNodes } from '@/domain/evolution';
import type { EvolutionCondition, EvolutionMethod, EvolutionNode } from '@/domain/models';
import { TYPE_COLORS, isTypeName } from '@/domain/typeChart';
import { ResourceName } from '@/hooks/useLocalizedName';
import { formatDexNumber, useLang, useT, type MessageKey } from '@/i18n';
import { useIndexStore } from '@/store/pokedexIndex';
import { PokemonImage } from '../PokemonImage';
import { TypeBadge } from '../TypeBadge';

function TypeName({ type }: { type: string }) {
  const t = useT();
  return <>{isTypeName(type) ? t(`types.${type}`) : type}</>;
}

/** Une condition, avec noms d'objets, lieux, capacités et espèces traduits. */
export function ConditionLabel({ c }: { c: EvolutionCondition }) {
  const t = useT();
  const parts = (key: MessageKey, slot: string, node: React.ReactNode) => {
    const [before = '', after = ''] = t(key, { [slot]: '\u0000' }).split('\u0000');
    return (
      <>
        {before}
        {node}
        {after}
      </>
    );
  };
  switch (c.kind) {
    case 'level':
      return <>{t('evo.level', { n: c.value })}</>;
    case 'item':
      return parts('evo.item', 'item', <ResourceName kind="item" slug={c.item} />);
    case 'held-item':
      return parts('evo.heldItem', 'item', <ResourceName kind="item" slug={c.item} />);
    case 'happiness':
      return <>{t('evo.happiness', { n: c.value })}</>;
    case 'affection':
      return <>{t('evo.affection', { n: c.value })}</>;
    case 'beauty':
      return <>{t('evo.beauty', { n: c.value })}</>;
    case 'time':
      return <>{t(`evo.${c.value}`)}</>;
    case 'known-move':
      return parts('evo.knownMove', 'move', <ResourceName kind="move" slug={c.move} />);
    case 'known-move-type':
      return parts('evo.knownMoveType', 'type', <TypeName type={c.type} />);
    case 'location':
      return parts('evo.location', 'location', <ResourceName kind="location" slug={c.location} />);
    case 'locations':
      return parts(
        'evo.location',
        'location',
        <>
          {c.locations.slice(0, 3).map((l, i) => (
            <Fragment key={l}>
              {i > 0 && ', '}
              <ResourceName kind="location" slug={l} />
            </Fragment>
          ))}
          {c.locations.length > 3 && ` +${c.locations.length - 3}`}
        </>,
      );
    case 'party-species':
      return parts('evo.partySpecies', 'species', <ResourceName kind="pokemon-species" slug={c.species} />);
    case 'party-type':
      return parts('evo.partyType', 'type', <TypeName type={c.type} />);
    case 'trade-species':
      return parts('evo.tradeSpecies', 'species', <ResourceName kind="pokemon-species" slug={c.species} />);
    case 'gender':
      return <>{t(c.value === 'female' ? 'evo.female' : 'evo.male')}</>;
    case 'rain':
      return <>{t('evo.rain')}</>;
    case 'upside-down':
      return <>{t('evo.upsideDown')}</>;
    case 'physical-stats':
      return <>{t(c.value === 'atk>def' ? 'evo.atkGtDef' : c.value === 'atk=def' ? 'evo.atkEqDef' : 'evo.atkLtDef')}</>;
    case 'trigger': {
      const key = `evo.trigger.${c.trigger}` as MessageKey;
      const label = t(key);
      return <>{label === key ? t('evo.trigger.other') : label}</>;
    }
  }
}

function Methods({ methods }: { methods: EvolutionMethod[] }) {
  const t = useT();
  if (methods.length === 0) return null;
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      {methods.map((method, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-[10px] font-bold text-muted uppercase">{t('evo.or')}</span>}
          <ul className="flex flex-wrap justify-center gap-1">
            {method.conditions.map((c, j) => (
              <li key={j} className="rounded-2xl bg-surface-2 px-2.5 py-1 text-center text-xs font-semibold">
                <ConditionLabel c={c} />
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </div>
  );
}

function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 16" className={`h-4 w-12 rotate-90 text-muted md:rotate-0 ${className}`} aria-hidden>
      <m.path
        d="M2 8h40m-6-6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </svg>
  );
}

function NodeCard({ node, currentSpeciesId, depth }: { node: EvolutionNode; currentSpeciesId: number; depth: number }) {
  const lang = useLang();
  const entry = useIndexStore((s) => s.byId.get(node.speciesId));
  const name = entry ? displayName(entry, lang) : node.slug;
  const current = node.speciesId === currentSpeciesId;
  const glow = TYPE_COLORS[entry?.types[0] ?? 'normal'].glow;
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 240, damping: 20, delay: depth * 0.18 }}
    >
      <Link
        to={`/pokemon/${node.speciesId}`}
        aria-current={current ? 'page' : undefined}
        className={`group flex w-full max-w-32 flex-col items-center rounded-2xl p-2.5 text-center transition-colors ${
          current ? 'bg-surface-2 ring-2 ring-accent' : 'hover:bg-surface-2'
        }`}
      >
        <div className="relative grid size-20 place-items-center">
          <div className="absolute inset-2 rounded-full opacity-40 blur-lg" style={{ background: glow }} aria-hidden />
          <PokemonImage id={node.speciesId} alt="" size={80} className="relative size-20 transition-transform group-hover:scale-110" />
        </div>
        <span className="mt-1 font-mono text-[11px] text-muted">{formatDexNumber(node.speciesId)}</span>
        <span className="text-sm leading-tight font-bold">{name}</span>
        {entry && (
          <span className="mt-1.5 flex flex-wrap justify-center gap-1">
            {entry.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </span>
        )}
      </Link>
    </m.div>
  );
}

/**
 * Disposition d'un nœud et de ses enfants :
 * - chaîne ou 2 branches : flèches horizontales sur grand écran, verticales sur mobile ;
 * - 3 branches ou plus (Évoli, Debugant…) : une flèche commune puis une grille de tuiles,
 *   chaque tuile montrant l'évolution et sa condition (sur mobile dès 2 branches).
 */
function Branch({ node, currentSpeciesId, depth }: { node: EvolutionNode; currentSpeciesId: number; depth: number }) {
  const count = node.children.length;
  const tiles = count > 2;
  const branching = count > 1;
  const tileClass = 'flex-col-reverse justify-end rounded-2xl bg-surface p-2';
  return (
    <div className={`flex flex-col items-center gap-3 ${tiles ? '' : 'md:flex-row md:justify-center'}`}>
      <NodeCard node={node} currentSpeciesId={currentSpeciesId} depth={depth} />
      {branching && <Arrow className={tiles ? 'md:rotate-90' : 'md:hidden'} />}
      {count > 0 && (
        <div
          className={
            tiles
              ? 'grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'
              : branching
                ? 'grid w-full grid-cols-2 gap-3 md:flex md:w-auto md:flex-col'
                : 'flex flex-col gap-3'
          }
        >
          {node.children.map((child) => (
            <div
              key={child.speciesId}
              className={`flex min-w-0 items-center gap-2 ${
                tiles ? tileClass : branching ? `${tileClass} md:flex-row md:gap-3 md:bg-transparent md:p-0` : 'flex-col md:flex-row md:gap-3'
              }`}
            >
              <div className="flex max-w-full flex-col items-center gap-1.5 md:max-w-56">
                {!tiles && <Arrow className={branching ? 'hidden md:block' : ''} />}
                <Methods methods={child.methods} />
              </div>
              <Branch node={child} currentSpeciesId={currentSpeciesId} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EvolutionTree({ root, currentSpeciesId }: { root: EvolutionNode; currentSpeciesId: number }) {
  const t = useT();
  if (countNodes(root) === 1) return <p className="text-sm text-muted">{t('detail.noEvolution')}</p>;
  return (
    <div className="-mx-2 overflow-x-auto px-2 pb-2">
      <div className="mx-auto w-full md:w-max md:min-w-full">
        <Branch node={root} currentSpeciesId={currentSpeciesId} depth={0} />
      </div>
    </div>
  );
}
