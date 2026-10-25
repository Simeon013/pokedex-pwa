import { Link } from 'react-router';
import { useT } from '@/i18n';

export default function NotFoundPage() {
  const t = useT();
  return (
    <div className="mx-auto my-16 max-w-md px-4 text-center">
      <p className="text-6xl font-black text-muted" aria-hidden>
        404
      </p>
      <h1 className="mt-2 text-xl font-bold">{t('app.notFound')}</h1>
      <Link to="/pokedex" className="mt-6 inline-flex h-10 items-center rounded-2xl bg-accent px-5 text-sm font-bold text-accent-fg">
        {t('app.backHome')}
      </Link>
    </div>
  );
}
