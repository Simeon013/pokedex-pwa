import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE, ApiError, fetchJson, idFromUrl, MIRROR_BASE, resetClientState, setFetchImplementation, toPath, urlFor } from './pokeapi';

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

describe('chemins', () => {
  it('toPath', () => {
    expect(toPath('https://pokeapi.co/api/v2/pokemon/1/')).toBe('pokemon/1');
    expect(toPath('/api/v2/pokemon-species/25/')).toBe('pokemon-species/25');
    expect(toPath('pokemon?limit=20')).toBe('pokemon?limit=20');
  });
  it('urlFor', () => {
    expect(urlFor('api', 'pokemon?limit=5')).toBe(`${API_BASE}/pokemon/?limit=5`);
    expect(urlFor('mirror', 'pokemon?limit=5')).toBe(`${MIRROR_BASE}/pokemon/index.json`);
  });
  it('idFromUrl', () => {
    expect(idFromUrl('https://pokeapi.co/api/v2/evolution-chain/67/')).toBe(67);
    expect(idFromUrl('/api/v2/pokemon/10034/')).toBe(10034);
    expect(() => idFromUrl('/api/v2/pokemon/')).toThrow();
  });
});

describe('fetchJson', () => {
  beforeEach(() => resetClientState());
  afterEach(() => vi.useRealTimers());

  it('bascule sur le miroir si l’API est injoignable, puis y reste', async () => {
    const calls: string[] = [];
    setFetchImplementation(async (url) => {
      calls.push(url);
      if (url.startsWith(API_BASE)) throw new TypeError('Failed to fetch');
      return json({ id: 1 });
    });
    await expect(fetchJson('pokemon/1', { retries: 0 })).resolves.toEqual({ id: 1 });
    await fetchJson('pokemon/2', { retries: 0 });
    expect(calls).toEqual([`${API_BASE}/pokemon/1/`, `${MIRROR_BASE}/pokemon/1/index.json`, `${MIRROR_BASE}/pokemon/2/index.json`]);
  });

  it('404 sur les deux sources → not-found, sans retry', async () => {
    const fn = vi.fn(async () => json({}, 404));
    setFetchImplementation(fn);
    await expect(fetchJson('pokemon/99999')).rejects.toMatchObject({ kind: 'not-found' });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('réessaie sur 503', async () => {
    let n = 0;
    setFetchImplementation(async () => (++n <= 2 ? json({}, 503) : json({ ok: true })));
    await expect(fetchJson('type/1', { retries: 2 })).resolves.toEqual({ ok: true });
  });

  it('déduplique les requêtes simultanées', async () => {
    const fn = vi.fn(async () => json({ id: 7 }));
    setFetchImplementation(fn);
    const [a, b] = await Promise.all([fetchJson('pokemon/7'), fetchJson('pokemon/7')]);
    expect(a).toEqual(b);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('signale le mode hors ligne', async () => {
    const spy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await expect(fetchJson('pokemon/1')).rejects.toBeInstanceOf(ApiError);
    await expect(fetchJson('pokemon/1')).rejects.toMatchObject({ kind: 'offline' });
    spy.mockRestore();
  });
});

describe('miroir indexé par numéro', () => {
  beforeEach(() => resetClientState());

  it('résout un slug en identifiant via la liste du type', async () => {
    const calls: string[] = [];
    setFetchImplementation(async (url) => {
      calls.push(url);
      if (url.startsWith(API_BASE)) throw new TypeError('Failed to fetch');
      if (url === `${MIRROR_BASE}/version/index.json`) return json({ count: 1, next: null, previous: null, results: [{ name: 'red', url: '/api/v2/version/1/' }] });
      if (url === `${MIRROR_BASE}/version/1/index.json`) return json({ id: 1, name: 'red' });
      return json({}, 404);
    });
    await expect(fetchJson('version/red', { retries: 0 })).resolves.toEqual({ id: 1, name: 'red' });
    expect(calls.at(-1)).toBe(`${MIRROR_BASE}/version/1/index.json`);
  });

  it('laisse intacts les chemins numériques et les sous-ressources', async () => {
    setFetchImplementation(async (url) => (url.startsWith(API_BASE) ? Promise.reject(new TypeError('x')) : json({ url })));
    await expect(fetchJson('pokemon/25/encounters', { retries: 0 })).resolves.toEqual({ url: `${MIRROR_BASE}/pokemon/25/encounters/index.json` });
  });
});
