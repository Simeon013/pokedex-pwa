import { useEffect, useRef } from 'react';

interface Options {
  onLeft?: () => void;
  onRight?: () => void;
  /** Distance horizontale minimale (px). */
  threshold?: number;
  enabled?: boolean;
}

/**
 * Détecte un balayage horizontal (tactile uniquement) sur un élément.
 * Ignoré si le geste est surtout vertical (défilement) ou démarre dans une zone
 * qui défile horizontalement (carrousels, tableaux).
 */
export function useSwipe<T extends HTMLElement>({ onLeft, onRight, threshold = 70, enabled = true }: Options) {
  const ref = useRef<T>(null);
  const handlers = useRef({ onLeft, onRight });
  handlers.current = { onLeft, onRight };

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let active = false;

    const scrollsX = (target: EventTarget | null) => {
      let node = target as HTMLElement | null;
      while (node && node !== el) {
        if (node.scrollWidth > node.clientWidth + 4 && getComputedStyle(node).overflowX !== 'visible') return true;
        node = node.parentElement;
      }
      return false;
    };

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      active = e.touches.length === 1 && !!t && !scrollsX(e.target);
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      startT = performance.now();
    };
    const onEnd = (e: TouchEvent) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const fast = performance.now() - startT < 600;
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5 || !fast) return;
      if (dx < 0) handlers.current.onLeft?.();
      else handlers.current.onRight?.();
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [enabled, threshold]);

  return ref;
}
