import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
  children: ReactNode;
  /** Couleurs quand sélectionné (types). */
  activeStyle?: CSSProperties;
}

/** Bouton bascule en forme de pastille (aria-pressed). */
export function Chip({ selected, children, activeStyle, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-[background-color,border-color,color,transform] active:scale-95 ${
        selected ? 'border-transparent bg-accent text-accent-fg' : 'border-line bg-surface text-fg hover:bg-surface-2'
      } ${className}`}
      style={selected ? activeStyle : undefined}
      {...rest}
    >
      {children}
    </button>
  );
}
