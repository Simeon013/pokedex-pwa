/**
 * Étape 1 : écran de diagnostic de la couche de données (index, cache, fiche détaillée).
 * Il sera remplacé par le routeur de l'application à l'étape 2.
 */
import { useEffect, useState } from 'react';
import { loadIndex, loadPokemonDetail } from '@/api/queries';
import type { PokedexIndex, PokemonDetail } from '@/domain/models';
import { defensiveProfile } from '@/domain/typeChart';

type State =
  | { status: 'loading'; progress?: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; index: PokedexIndex; sample: PokemonDetail; ms: number };

export default function App() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();
    (async () => {
      const index = await loadIndex((p) => !cancelled && setState({ status: 'loading', progress: `${p.done}/${p.total}` }));
      const sample = await loadPokemonDetail(6);
      if (!cancelled) setState({ status: 'ready', index, sample, ms: Math.round(performance.now() - t0) });
    })().catch((err: unknown) => !cancelled && setState({ status: 'error', message: String(err) }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <main className="mx-auto max-w-2xl p-6 font-mono text-sm">
      <h1 className="mb-4 text-xl font-bold">Pokédex · diagnostic des données</h1>
      {state.status === 'loading' && <p role="status">Chargement… {state.progress}</p>}
      {state.status === 'error' && (
        <div role="alert">
          <p className="text-red-400">{state.message}</p>
          <button className="mt-2 rounded bg-white/10 px-3 py-1" onClick={() => setAttempt((n) => n + 1)}>
            Réessayer
          </button>
        </div>
      )}
      {state.status === 'ready' && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt>Entrées</dt>
          <dd>{state.index.entries.length}</dd>
          <dt>Espèces</dt>
          <dd>{new Set(state.index.entries.map((e) => e.speciesId)).size}</dd>
          <dt>Généré le</dt>
          <dd>{state.index.generatedAt}</dd>
          <dt>Exemple</dt>
          <dd>
            {state.sample.names.fr} — {state.sample.genera.fr} — {state.sample.types.join('/')}
          </dd>
          <dt>Faiblesses</dt>
          <dd>{defensiveProfile(state.sample.types).weaknesses.map((w) => `${w.type} ×${w.multiplier}`).join(', ')}</dd>
          <dt>Temps</dt>
          <dd>{state.ms} ms (rechargez : les données viennent alors d’IndexedDB)</dd>
        </dl>
      )}
    </main>
  );
}
