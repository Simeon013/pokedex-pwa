import { useSettings } from '@/store/settings';
import { useMediaQuery } from './useMediaQuery';

/** Vrai si les animations doivent être réduites (préférence système ou réglage de l'app). */
export function useReducedMotion(): boolean {
  const pref = useSettings((s) => s.motion);
  const system = useMediaQuery('(prefers-reduced-motion: reduce)');
  return pref === 'reduced' || (pref === 'system' && system);
}
