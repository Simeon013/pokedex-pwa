import { useEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { ErrorBoundary, OfflineBanner } from '@/components/Feedback';
import { Header } from '@/components/Header';
import { useApplyTheme } from '@/hooks/useApplyTheme';
import { useT } from '@/i18n';
import { useIndexStore } from '@/store/pokedexIndex';

export default function Layout() {
  const t = useT();
  const resolved = useApplyTheme();
  const load = useIndexStore((s) => s.load);
  const location = useLocation();

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[80] rounded-xl bg-accent px-4 py-2 font-bold text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('app.skipToContent')}
      </a>
      <Header resolvedTheme={resolved} />
      <main id="main" tabIndex={-1} className="outline-none">
        <ErrorBoundary resetKey={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <OfflineBanner />
      <ScrollRestoration />
    </>
  );
}
