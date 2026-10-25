/**
 * Internationalisation minimale et typée.
 *
 * - Textes d'interface : français et anglais (les autres langues retombent sur l'anglais).
 * - Noms et descriptions des Pokémon : toutes les langues de `LANGS`, fournies par PokeAPI.
 */
import { useCallback } from 'react';
import type { Lang } from '@/domain/models';
import { useSettings } from '@/store/settings';
import { en } from './locales/en';
import { fr, type Messages } from './locales/fr';

export const LANG_LABELS: Record<Lang, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  'zh-hans': '简体中文',
};

/** Code BCP 47 pour `lang=` et `Intl`. */
export const LANG_TAGS: Record<Lang, string> = {
  fr: 'fr', en: 'en', de: 'de', es: 'es', it: 'it', ja: 'ja', ko: 'ko', 'zh-hans': 'zh-Hans',
};

export function messagesFor(lang: Lang): Messages {
  return lang === 'fr' ? fr : en;
}

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
type Paths<T> = { [K in keyof T]: T[K] extends string ? K : Join<K, Paths<T[K]>> }[keyof T];
export type MessageKey = Paths<Messages>;

export function translate(messages: Messages, key: MessageKey, vars?: Record<string, string | number>): string {
  let node: unknown = messages;
  for (const part of key.split('.')) node = (node as Record<string, unknown>)[part];
  let text = typeof node === 'string' ? node : key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

export function useLang(): Lang {
  return useSettings((s) => s.lang);
}

export function useT() {
  const lang = useLang();
  return useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(messagesFor(lang), key, vars),
    [lang],
  );
}

/** Formatage des nombres selon la langue. */
export function formatNumber(n: number, lang: Lang, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(LANG_TAGS[lang], opts).format(n);
}

export function formatDexNumber(n: number): string {
  return `#${String(n).padStart(4, '0')}`;
}
