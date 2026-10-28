/**
 * Lecteur du cri (fichiers .ogg de PokeAPI) avec visualiseur :
 * - forme d'onde calculée depuis l'audio décodé, colorée au fil de la lecture ;
 * - barres de fréquences en direct (AnalyserNode) pendant la lecture,
 *   remplacées par la seule progression si les animations sont réduites.
 * Bascule entre cri récent et cri original (générations 1 à 5) quand il existe.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useT } from '@/i18n';

type Status = 'idle' | 'loading' | 'playing' | 'error';

let sharedContext: AudioContext | null = null;
function audioContext(): AudioContext {
  sharedContext ??= new AudioContext();
  return sharedContext;
}

const buffers = new Map<string, Promise<AudioBuffer>>();
function loadBuffer(url: string): Promise<AudioBuffer> {
  let p = buffers.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then((data) => audioContext().decodeAudioData(data));
    p.catch(() => buffers.delete(url));
    buffers.set(url, p);
  }
  return p;
}

/** Pics d'amplitude normalisés (0..1) pour dessiner la forme d'onde. */
export function waveformPeaks(samples: Float32Array, bars: number): number[] {
  const size = Math.max(1, Math.floor(samples.length / bars));
  const peaks: number[] = [];
  let max = 0;
  for (let i = 0; i < bars; i++) {
    let peak = 0;
    for (let j = i * size; j < Math.min(samples.length, (i + 1) * size); j++) peak = Math.max(peak, Math.abs(samples[j] ?? 0));
    peaks.push(peak);
    max = Math.max(max, peak);
  }
  return peaks.map((p) => (max > 0 ? p / max : 0));
}

interface Props {
  latest: string | null;
  legacy: string | null;
  name: string;
  color: string;
  /** Couleur de l'icône sur le bouton (contraste avec `color`). */
  iconColor?: string;
  /** Lecture automatique demandée (réglage « jouer le cri à l'ouverture »). */
  autoPlay?: boolean;
}

export function CryPlayer({ latest, legacy, name, color, iconColor = '#fff', autoPlay = false }: Props) {
  const t = useT();
  const reduced = useReducedMotion();
  const [variant, setVariant] = useState<'latest' | 'legacy'>('latest');
  const [status, setStatus] = useState<Status>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peaksRef = useRef<number[] | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const rafRef = useRef(0);
  const url = variant === 'legacy' ? (legacy ?? latest) : (latest ?? legacy);

  const draw = useCallback(
    (progress: number, freq?: Uint8Array) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const peaks = peaksRef.current;
      const bars = peaks?.length ?? 48;
      const gap = 2;
      const bw = (w - gap * (bars - 1)) / bars;
      const muted = getComputedStyle(canvas).getPropertyValue('--muted').trim() || '#888';
      for (let i = 0; i < bars; i++) {
        const base = peaks ? peaks[i] ?? 0 : 0.08;
        const live = freq ? (freq[Math.floor((i / bars) * freq.length * 0.7)] ?? 0) / 255 : 0;
        const v = Math.max(0.06, Math.max(base * 0.9, live));
        const bh = v * (h - 4);
        ctx.fillStyle = i / bars <= progress ? color : muted;
        ctx.globalAlpha = i / bars <= progress ? 1 : 0.35;
        ctx.beginPath();
        ctx.roundRect(i * (bw + gap), (h - bh) / 2, bw, bh, Math.min(3, bw / 2));
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    [color],
  );

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    try {
      sourceRef.current?.stop();
    } catch {
      // déjà arrêté
    }
    sourceRef.current = null;
  }, []);

  // Changement de Pokémon ou de version : on arrête et on redessine la forme d'onde.
  useEffect(() => {
    stop();
    setStatus('idle');
    peaksRef.current = null;
    draw(0);
    if (!url) return;
    let cancelled = false;
    // La forme d'onde n'est calculée que si le fichier est déjà décodé (pas de requête implicite).
    const cached = buffers.get(url);
    cached
      ?.then((buf) => {
        if (cancelled) return;
        peaksRef.current = waveformPeaks(buf.getChannelData(0), 48);
        draw(0);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      stop();
    };
  }, [url, draw, stop]);

  const play = useCallback(async () => {
    if (!url) return;
    if (status === 'playing') {
      stop();
      setStatus('idle');
      draw(0);
      return;
    }
    setStatus('loading');
    try {
      const ctx = audioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      const buffer = await loadBuffer(url);
      peaksRef.current = waveformPeaks(buffer.getChannelData(0), 48);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = 0.7;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(gain).connect(analyser).connect(ctx.destination);
      const freq = new Uint8Array(analyser.frequencyBinCount);
      const start = ctx.currentTime;
      source.onended = () => {
        cancelAnimationFrame(rafRef.current);
        if (sourceRef.current === source) {
          sourceRef.current = null;
          setStatus('idle');
          draw(1);
        }
      };
      sourceRef.current = source;
      source.start();
      setStatus('playing');
      const tick = () => {
        const progress = Math.min(1, (ctx.currentTime - start) / buffer.duration);
        if (!reduced) analyser.getByteFrequencyData(freq);
        draw(progress, reduced ? undefined : freq);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setStatus('error');
    }
  }, [url, status, stop, draw, reduced]);

  // Lecture automatique : seulement si le navigateur l'autorise (après une interaction).
  useEffect(() => {
    if (autoPlay && url && navigator.userActivation?.hasBeenActive) void play();
  }, [autoPlay, url]);

  if (!latest && !legacy) return <p className="text-sm text-muted">{t('cry.unavailable')}</p>;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => void play()}
        aria-label={status === 'playing' ? t('cry.stop') : t('cry.play', { name })}
        className="relative grid size-12 shrink-0 place-items-center rounded-full shadow-lg transition-transform active:scale-95"
        style={{ backgroundColor: color, color: iconColor }}
      >
        {status === 'playing' && !reduced && (
          <span className="absolute inset-0 animate-ping rounded-full opacity-40" style={{ backgroundColor: color }} aria-hidden />
        )}
        {status === 'loading' ? (
          <span className="size-5 animate-spin rounded-full border-2 border-current/40 border-t-current" aria-hidden />
        ) : status === 'playing' ? (
          <svg viewBox="0 0 24 24" className="relative size-5" aria-hidden>
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="relative size-6" aria-hidden>
            <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5zM15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <canvas ref={canvasRef} className="h-10 w-full" aria-hidden />
        {status === 'error' && (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
            {t('cry.error')}
          </p>
        )}
      </div>
      {legacy && latest && legacy !== latest && (
        <div className="flex shrink-0 rounded-xl border border-line p-0.5 text-xs" role="group" aria-label={t('cry.version')}>
          {(['latest', 'legacy'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={variant === v}
              onClick={() => setVariant(v)}
              className={`rounded-lg px-2 py-1 font-semibold ${variant === v ? 'bg-surface-2' : 'text-muted'}`}
            >
              {t(`cry.${v}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
