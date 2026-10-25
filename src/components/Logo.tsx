/** Logo : sphère stylisée (dessin original). */
export function Logo({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7a7a" />
          <stop offset="1" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#logo-top)" />
      <path d="M2 16a14 14 0 0 0 28 0z" fill="#f8fafc" />
      <path d="M2 16h28" stroke="#0f172a" strokeWidth="2.4" />
      <circle cx="16" cy="16" r="4.6" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.4" />
      <circle cx="16" cy="16" r="1.8" fill="#0f172a" opacity=".25" />
    </svg>
  );
}
