import { useEffect, useRef } from 'react';

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Raccourci clavier global. Ignoré quand l'utilisateur écrit dans un champ
 * (sauf `allowInInputs`) ou utilise un modificateur.
 */
export function useHotkey(key: string, handler: (e: KeyboardEvent) => void, opts: { allowInInputs?: boolean; enabled?: boolean } = {}) {
  const ref = useRef(handler);
  ref.current = handler;
  const { allowInInputs = false, enabled = true } = opts;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== key || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!allowInInputs && isEditable(e.target)) return;
      ref.current(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [key, allowInInputs, enabled]);
}
