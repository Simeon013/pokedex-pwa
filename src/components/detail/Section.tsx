import { m } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
  aside?: ReactNode;
}

/** Bloc de fiche : carte vitrée avec titre ancré, apparition douce à l'entrée dans l'écran. */
export function Section({ id, title, children, className = '', aside }: Props) {
  return (
    <m.section
      id={id}
      aria-labelledby={`${id}-title`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`glass scroll-mt-36 rounded-3xl p-5 sm:p-6 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${id}-title`} className="text-lg font-bold tracking-tight">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </m.section>
  );
}

export function SectionSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="shimmer h-4 rounded" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}
