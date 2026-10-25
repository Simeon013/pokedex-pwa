import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCached, getOrFetch, invalidate, resetMemoryCache } from './cache';
import { db } from './dexie';

beforeEach(async () => {
  resetMemoryCache();
  await db.cache.clear();
});

describe('getOrFetch', () => {
  it('récupère puis sert depuis le cache', async () => {
    const fetcher = vi.fn(async () => ({ v: 1 }));
    expect(await getOrFetch('k', fetcher)).toEqual({ v: 1 });
    expect(await getOrFetch('k', fetcher)).toEqual({ v: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('persiste dans IndexedDB (survit au vidage mémoire)', async () => {
    await getOrFetch('persist', async () => 42);
    resetMemoryCache();
    expect(await getCached('persist')).toBe(42);
  });

  it('stale-while-revalidate : renvoie l’ancienne valeur puis notifie la nouvelle', async () => {
    await getOrFetch('swr', async () => 'old');
    await db.cache.update('swr', { updatedAt: 0 });
    resetMemoryCache();
    const onUpdate = vi.fn();
    expect(await getOrFetch('swr', async () => 'new', { onUpdate })).toBe('old');
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith('new'));
    expect(await getCached('swr')).toBe('new');
  });

  it('force : réseau en échec → valeur en cache', async () => {
    await getOrFetch('f', async () => 'cached');
    await expect(getOrFetch('f', () => Promise.reject(new Error('offline')), { force: true })).resolves.toBe('cached');
  });

  it('propage l’erreur sans valeur en cache', async () => {
    await expect(getOrFetch('none', () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
  });

  it('invalidate', async () => {
    await getOrFetch('x', async () => 1);
    await invalidate('x');
    expect(await getCached('x')).toBeUndefined();
  });
});
