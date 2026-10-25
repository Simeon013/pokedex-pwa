import { AnimatePresence, m } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useT } from '@/i18n';
import { useCollection } from '@/store/collection';

interface Props {
  id: number;
  name: string;
  className?: string;
  /** Appelé après l'ajout (déclenche les particules à l'étape 6). */
  onAdded?: (el: HTMLElement) => void;
}

/** Cœur animé : bascule l'état favori, sans propager le clic à la carte. */
export function FavoriteButton({ id, name, className = '', onAdded }: Props) {
  const t = useT();
  const isFav = useCollection((s) => s.favorites.includes(id));
  const toggle = useCollection((s) => s.toggle);
  const reduced = useReducedMotion();

  return (
    <button
      type="button"
      aria-pressed={isFav}
      aria-label={t(isFav ? 'collection.removeFavorite' : 'collection.addFavorite', { name })}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle('favorites', id);
        if (added) onAdded?.(e.currentTarget);
      }}
      className={`relative grid size-9 place-items-center rounded-full transition-colors hover:bg-surface-2 ${className}`}
    >
      <m.svg
        viewBox="0 0 24 24"
        className="size-5"
        animate={reduced ? undefined : { scale: isFav ? [1, 1.35, 1] : 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        aria-hidden
      >
        <path
          d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.5 3.7 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
          fill={isFav ? '#ff4d6d' : 'none'}
          stroke={isFav ? '#ff4d6d' : 'currentColor'}
          strokeWidth={1.8}
          strokeLinejoin="round"
          className={isFav ? '' : 'text-muted'}
        />
      </m.svg>
      <AnimatePresence>
        {isFav && !reduced && (
          <m.span
            key="ring"
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#ff4d6d]"
            initial={{ scale: 0.4, opacity: 0.9 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </button>
  );
}
