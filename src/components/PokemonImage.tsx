/**
 * Image de Pokémon : lazy loading, décodage asynchrone, fondu à l'apparition
 * et chaîne de repli (artwork → HOME → sprite pixel → silhouette).
 */
import { useEffect, useState, type CSSProperties } from 'react';
import { spriteCandidates } from '@/domain/sprites';

interface Props {
  id: number;
  alt: string;
  shiny?: boolean;
  /** URL explicite (fiche détaillée) ; sinon dérivée de l'identifiant. */
  src?: string | null;
  size: number;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function PokemonImage({ id, alt, shiny = false, src, size, priority = false, className = '', style }: Props) {
  const candidates = src ? [src, ...spriteCandidates(id, shiny)] : spriteCandidates(id, shiny);
  const [attempt, setAttempt] = useState(0);
  // On mémorise l'URL effectivement chargée : si `src` arrive plus tard avec la même URL,
  // l'image reste visible (le navigateur ne redéclenche pas `load` pour une URL identique).
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  useEffect(() => {
    setAttempt(0);
  }, [id, shiny, src]);

  const current = candidates[attempt];
  const loaded = current !== undefined && loadedUrl === current;
  if (!current) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label={alt} className={`text-muted/40 ${className}`} style={style}>
        <path fill="currentColor" d="M12 2a10 10 0 0 0-9.95 9h5.1a5 5 0 0 1 9.7 0h5.1A10 10 0 0 0 12 2zm0 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM2.05 13a10 10 0 0 0 19.9 0h-5.1a5 5 0 0 1-9.7 0z" />
      </svg>
    );
  }

  return (
    <img
      src={current}
      alt={alt}
      width={size}
      height={size}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      draggable={false}
      ref={(img) => {
        // Image déjà en cache navigateur : `load` a pu avoir lieu avant l'hydratation du gestionnaire.
        if (img?.complete && img.naturalWidth > 0 && loadedUrl !== current) setLoadedUrl(current);
      }}
      onLoad={() => setLoadedUrl(current)}
      onError={() => setAttempt((a) => a + 1)}
      className={`object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${current.includes('/other/') ? '' : '[image-rendering:pixelated]'} ${className}`}
      style={style}
    />
  );
}
