/**
 * Grille responsive virtualisée sur le défilement de la fenêtre.
 * Seules les lignes visibles (plus une marge) sont montées : le défilement reste
 * fluide avec les 1 351 entrées. Le nombre de colonnes suit la largeur du conteneur.
 */
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface Props<T> {
  items: readonly T[];
  getKey: (item: T) => string | number;
  renderItem: (item: T, index: number, column: number) => ReactNode;
  minColumnWidth?: number;
  rowHeight?: number;
  gap?: number;
  label: string;
}

function columnsFor(width: number, min: number, gap: number): number {
  return Math.max(2, Math.floor((width + gap) / (min + gap)));
}

export function VirtualGrid<T>({ items, getKey, renderItem, minColumnWidth = 168, rowHeight = 262, gap = 14, label }: Props<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      setWidth(el.clientWidth);
      setOffset(el.getBoundingClientRect().top + window.scrollY);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columns = width ? columnsFor(width, minColumnWidth, gap) : 2;
  // Sur petit écran, les cartes sont plus étroites : on réduit un peu la hauteur
  // (l'image s'adapte à l'espace restant, le texte garde sa taille).
  const cardWidth = width ? (width - gap * (columns - 1)) / columns : minColumnWidth;
  const height = Math.round(Math.min(rowHeight, Math.max(232, cardWidth * 1.4)));
  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => height + gap,
    overscan: 3,
    scrollMargin: offset,
  });

  // Recalcule les positions si la géométrie change (rotation, redimensionnement).
  useLayoutEffect(() => {
    virtualizer.measure();
  }, [virtualizer, height, columns]);

  return (
    <div ref={ref} role="list" aria-label={label} aria-rowcount={rowCount} style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
      {virtualizer.getVirtualItems().map((row) => {
        const start = row.index * columns;
        const slice = items.slice(start, start + columns);
        return (
          <div
            key={row.key}
            className="absolute inset-x-0 grid"
            style={{
              top: 0,
              transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
              height,
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap,
            }}
          >
            {slice.map((item, i) => (
              <div key={getKey(item)} role="listitem" aria-posinset={start + i + 1} aria-setsize={items.length}>
                {renderItem(item, start + i, i)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
