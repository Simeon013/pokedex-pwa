/**
 * Icônes de types originales (dessinées pour ce projet, pas d'assets officiels).
 * Grille 24×24, couleur héritée (`currentColor`).
 */
import type { TypeName } from '@/domain/models';

interface Glyph {
  fill?: string;
  stroke?: string;
}

const GLYPHS: Record<TypeName, Glyph> = {
  normal: { fill: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z' },
  fire: { fill: 'M12.5 2c.6 3.7 5.5 5.6 5.5 11a6 6 0 0 1-12 0c0-2.8 1.6-4.6 2.8-5.6.2 1.8.9 2.9 2.1 3.4-.5-3.7.1-6.4 1.6-8.8z' },
  water: { fill: 'M12 2.5C9 7 6 10.4 6 14.5a6 6 0 0 0 12 0C18 10.4 15 7 12 2.5z' },
  electric: { fill: 'M13.6 2 5 13.4h6.1L9.6 22 19 10.4h-6.2z' },
  grass: { fill: 'M20.5 3.5C10.5 3.6 4 8.7 4 15.8c0 1.4.3 2.7.9 3.8 2.1-5.8 5.9-8.9 10-10.6-3.5 2.6-6.4 5.6-8.4 11.6 1.5.9 3.2 1.4 5 1.4 5.8 0 9-6 9-18.5z' },
  ice: { stroke: 'M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5M9 4.3l3 2 3-2M9 19.7l3-2 3 2M4.4 11l2.9 1-.7 3M19.6 13l-2.9-1 .7-3' },
  fighting: { fill: 'M7 4.5h3v4H7zM10.8 3.5h3v5h-3zM14.6 4.5h3v4h-3zM5 10a1.5 1.5 0 0 1 1.5-1.5h11.2A2.3 2.3 0 0 1 20 10.8v4.7a6 6 0 0 1-6 6h-3.5A5.5 5.5 0 0 1 5 16z' },
  poison: { fill: 'M12 2.5a6.5 6.5 0 0 0-3.5 12V17h7v-2.5a6.5 6.5 0 0 0-3.5-12zm-2.6 5.3a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zm5.2 0a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zM8.5 18.5h7V21h-7z' },
  ground: { fill: 'M2 20 8.5 8.5l3.7 6.1 2.6-3.6L22 20zM15.5 4.5a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4z' },
  flying: { fill: 'M2.5 13.5c4.5.3 8-1.7 10.5-6.5 1 3.4.1 6.4-1.8 8.6 3.4.2 6.6-1.6 8.8-6 1.4 5.6-1.8 11.4-8.6 11.4H5.5c-1.6 0-2.9-1.3-3-3z' },
  psychic: { stroke: 'M12 12a1.2 1.2 0 1 1-1.2-1.2A2.6 2.6 0 0 1 13.4 13.4a4 4 0 0 1-4 4A5.4 5.4 0 0 1 4 12a6.8 6.8 0 0 1 6.8-6.8A8.2 8.2 0 0 1 19 13.4' },
  bug: {
    fill: 'M12 7.5a4.2 4.2 0 0 1 4.2 4.2v4.6a4.2 4.2 0 0 1-8.4 0v-4.6A4.2 4.2 0 0 1 12 7.5z',
    stroke: 'M9.5 7 7.5 3.5M14.5 7l2-3.5M7.5 12H4M16.5 12H20M7.5 16.5 4.5 19M16.5 16.5l3 2.5',
  },
  rock: { fill: 'M7.5 3.5h8.5l5 6.2-3 10.8H7L3 12.3zm1.8 3-2.2 5.7 2.7 5.3h5.9l1.8-6.3-2.8-4.7z' },
  ghost: { fill: 'M12 2.5a7 7 0 0 0-7 7V21l2.4-2 2.3 2 2.3-2 2.3 2 2.3-2L19 21V9.5a7 7 0 0 0-7-7zM9.2 8.4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5.6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z' },
  dragon: { fill: 'M3.5 20.5C5.6 11.4 10.8 5 20.5 3c-3.1 2.9-4.7 5.8-5.2 8.8 1.6-1 3.2-1.3 4.8-1-3.7 2-6.3 5.2-7.5 9.7z' },
  dark: { fill: 'M14.5 2.5a9.5 9.5 0 1 0 7 15.8A8 8 0 0 1 14.5 2.5z' },
  steel: { fill: 'M12 2 20.7 7v10L12 22l-8.7-5V7zm0 6.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4z' },
  fairy: { fill: 'M11 2c.8 4.6 2.5 6.9 7 8-4.5 1.1-6.2 3.4-7 8-.8-4.6-2.5-6.9-7-8 4.5-1.1 6.2-3.4 7-8zM18.5 14.5c.3 1.6 1 2.4 2.5 2.8-1.5.4-2.2 1.2-2.5 2.8-.3-1.6-1-2.4-2.5-2.8 1.5-.4 2.2-1.2 2.5-2.8z' },
};

export function TypeIcon({ type, className = 'size-4', title }: { type: TypeName; className?: string; title?: string }) {
  const g = GLYPHS[type];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {g.fill && <path d={g.fill} fill="currentColor" fillRule="evenodd" />}
      {g.stroke && <path d={g.stroke} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
