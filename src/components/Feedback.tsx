/** Bandeau hors ligne, état d'erreur avec « Réessayer », et frontière d'erreur React. */
import { AnimatePresence, m } from 'framer-motion';
import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { useOnline } from '@/hooks/useOnline';
import { messagesFor, translate, useT } from '@/i18n';
import { useSettings } from '@/store/settings';

export function OfflineBanner() {
  const t = useT();
  const online = useOnline();
  const wasOffline = useRef(false);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    if (!online) wasOffline.current = true;
    else if (wasOffline.current) {
      wasOffline.current = false;
      setShowBack(true);
      const id = setTimeout(() => setShowBack(false), 2500);
      return () => clearTimeout(id);
    }
  }, [online]);

  const message = !online ? t('app.offline') : showBack ? t('app.backOnline') : null;
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
      <AnimatePresence>
        {message && (
          <m.p
            key={message}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`glass rounded-full px-4 py-2 text-sm font-medium shadow-xl ${online ? 'text-emerald-400' : 'text-amber-300'}`}
          >
            {message}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ErrorState({ message, onRetry, offline = false }: { message: string; onRetry?: () => void; offline?: boolean }) {
  const t = useT();
  return (
    <div role="alert" className="glass mx-auto my-10 max-w-md rounded-3xl p-6 text-center">
      <p className="text-3xl" aria-hidden>
        {offline ? '📡' : '⚠️'}
      </p>
      <p className="mt-2 font-semibold">{offline ? t('app.errorOffline') : message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-4 h-10 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-fg hover:brightness-110">
          {t('app.retry')}
        </button>
      )}
    </div>
  );
}

interface BoundaryState {
  error: Error | null;
}

/** Capture les erreurs de rendu d'une zone et propose de réessayer. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: unknown }, BoundaryState> {
  override state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur de rendu :', error, info.componentStack);
  }

  override componentDidUpdate(prev: { resetKey?: unknown }) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  override render() {
    if (!this.state.error) return this.props.children;
    const m = messagesFor(useSettings.getState().lang);
    return <ErrorState message={translate(m, 'app.errorGeneric')} onRetry={() => this.setState({ error: null })} />;
  }
}
