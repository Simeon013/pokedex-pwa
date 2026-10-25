/** Petites icônes d'interface (traits, 24×24). */
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const FilterIcon = ({ className = 'size-5' }) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);
export const SunIcon = ({ className = 'size-5' }) => (
  <svg {...base} className={className} aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const MoonIcon = ({ className = 'size-5' }) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
  </svg>
);
export const CloseIcon = ({ className = 'size-5' }) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const ArrowUpDownIcon = ({ className = 'size-4' }) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" />
  </svg>
);
export const GlobeIcon = ({ className = 'size-5' }) => (
  <svg {...base} className={className} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);
export const ChevronIcon = ({ className = 'size-4', dir = 'right' as 'left' | 'right' }) => (
  <svg {...base} className={className} aria-hidden>
    <path d={dir === 'right' ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} />
  </svg>
);
