import { useEffect } from 'react';
import { LANG_TAGS } from '@/i18n';
import { useSettings } from '@/store/settings';
import { useMediaQuery } from './useMediaQuery';
import { useReducedMotion } from './useReducedMotion';

/** Synchronise thème, langue et préférence d'animation avec l'élément <html>. */
export function useApplyTheme() {
  const theme = useSettings((s) => s.theme);
  const lang = useSettings((s) => s.lang);
  const systemLight = useMediaQuery('(prefers-color-scheme: light)');
  const reduced = useReducedMotion();
  const resolved = theme === 'system' ? (systemLight ? 'light' : 'dark') : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.classList.toggle('light', resolved === 'light');
    root.classList.toggle('reduce-motion', reduced);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0a0c16' : '#f4f5fb');
  }, [resolved, reduced]);

  useEffect(() => {
    document.documentElement.lang = LANG_TAGS[lang];
  }, [lang]);

  return resolved;
}
