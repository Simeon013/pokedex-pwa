import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/api/pokeapi';
import type { CacheOptions } from '@/db/cache';

export type Resource<T> =
  | { status: 'loading'; data: undefined; error: undefined }
  | { status: 'ready'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: ApiError | Error };

/**
 * Charge une ressource via une fonction de `queries.ts` et suit son état.
 * `retry()` force un nouvel appel réseau. Les mises à jour en arrière-plan
 * (stale-while-revalidate) sont appliquées automatiquement.
 */
export function useResource<T>(key: string | null, loader: (opts: CacheOptions<T>) => Promise<T>): Resource<T> & { retry: () => void } {
  const [state, setState] = useState<Resource<T>>({ status: 'loading', data: undefined, error: undefined });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    setState({ status: 'loading', data: undefined, error: undefined });
    loader({ force: attempt > 0, onUpdate: (data) => !cancelled && setState({ status: 'ready', data, error: undefined }) })
      .then((data) => !cancelled && setState({ status: 'ready', data, error: undefined }))
      .catch((error: unknown) => !cancelled && setState({ status: 'error', data: undefined, error: error instanceof Error ? error : new Error(String(error)) }));
    return () => {
      cancelled = true;
    };
    // `loader` est recréé à chaque rendu par les appelants : seule la clé compte.
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
