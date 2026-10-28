import { useEffect, useState } from 'react';
import { prettifySlug } from '@/api/normalize';
import type { LocalizedKind } from '@/api/pokeapi';
import { loadLocalizedNames } from '@/api/queries';
import type { Lang, LocalizedNames } from '@/domain/models';
import { useLang } from '@/i18n';

const memory = new Map<string, LocalizedNames>();

/** Nom dans la langue demandée, avec majuscule initiale (certains noms PokeAPI sont en minuscules). */
function pick(names: LocalizedNames, lang: Lang): string {
  const n = names[lang] ?? names.en;
  return n.charAt(0).toLocaleUpperCase(lang) + n.slice(1);
}

/**
 * Nom traduit d'une ressource PokeAPI (objet, version, lieu, groupe d'œufs…).
 * Affiche immédiatement le slug mis en forme, puis le nom traduit une fois chargé (et mis en cache).
 */
export function useLocalizedName(kind: LocalizedKind, slug: string | null | undefined): string {
  const lang = useLang();
  const key = slug ? `${kind}/${slug}` : '';
  const [names, setNames] = useState<LocalizedNames | undefined>(() => memory.get(key));

  useEffect(() => {
    if (!slug) return;
    const cached = memory.get(key);
    if (cached) {
      setNames(cached);
      return;
    }
    let cancelled = false;
    loadLocalizedNames(kind, slug)
      .then((n) => {
        memory.set(key, n);
        if (!cancelled) setNames(n);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [kind, slug, key]);

  if (!slug) return '';
  return names ? pick(names, lang) : prettifySlug(slug);
}

/** Composant pratique pour afficher un nom de ressource dans du texte. */
export function ResourceName({ kind, slug }: { kind: LocalizedKind; slug: string }) {
  return <>{useLocalizedName(kind, slug)}</>;
}
