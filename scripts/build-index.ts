/**
 * Génère `public/data/index.json`, l'index léger de toutes les espèces et formes.
 *
 * Usage : npm run build:index [-- --force]
 *
 * - Les réponses PokeAPI sont mises en cache sur disque (.cache/pokeapi) : une
 *   seconde exécution est quasi instantanée. `--force` vide ce cache.
 * - Respecte HTTPS_PROXY (réseaux d'entreprise, CI).
 * - Si pokeapi.co est injoignable, le client bascule sur le miroir statique
 *   PokeAPI/api-data (voir src/api/pokeapi.ts).
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EnvHttpProxyAgent, fetch as undiciFetch, setGlobalDispatcher } from 'undici';
import { buildIndex } from '../src/api/indexBuilder.ts';
import { setFetchImplementation } from '../src/api/pokeapi.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, '.cache', 'pokeapi');
const outFile = join(root, 'public', 'data', 'index.json');
const force = process.argv.includes('--force');

if (process.env.HTTPS_PROXY || process.env.https_proxy) setGlobalDispatcher(new EnvHttpProxyAgent());

const cachePath = (url: string) => join(cacheDir, `${createHash('sha1').update(url).digest('hex')}.json`);

/** fetch avec cache disque : seules les réponses 200 sont conservées. */
setFetchImplementation(async (url, init) => {
  const file = cachePath(url);
  try {
    const body = await readFile(file, 'utf8');
    return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
  } catch {
    // absent du cache
  }
  const res = await undiciFetch(url, init as Parameters<typeof undiciFetch>[1]);
  const body = await res.text();
  if (res.ok) await writeFile(file, body);
  return new Response(body, { status: res.status });
});

async function main() {
  if (force) await rm(cacheDir, { recursive: true, force: true });
  await mkdir(cacheDir, { recursive: true });
  await mkdir(dirname(outFile), { recursive: true });

  const started = Date.now();
  let lastLog = 0;
  const index = await buildIndex({
    concurrency: 16,
    onProgress: ({ done, total }) => {
      if (Date.now() - lastLog > 2000 || done === total) {
        lastLog = Date.now();
        process.stdout.write(`\r  ${done}/${total} Pokémon`);
      }
    },
  });
  process.stdout.write('\n');

  const json = JSON.stringify(index);
  await writeFile(outFile, json);
  const { size } = await stat(outFile);
  const species = new Set(index.entries.map((e) => e.speciesId)).size;
  console.log(
    `✔ ${index.entries.length} entrées (${species} espèces) → public/data/index.json ` +
      `(${(size / 1024).toFixed(0)} Ko) en ${((Date.now() - started) / 1000).toFixed(1)} s`,
  );
}

main().catch((err: unknown) => {
  console.error('\n✖ Échec de la génération de l’index :', err);
  process.exit(1);
});
