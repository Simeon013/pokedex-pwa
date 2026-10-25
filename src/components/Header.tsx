import { Link, NavLink } from 'react-router';
import type { Lang } from '@/domain/models';
import { LANG_LABELS, useT } from '@/i18n';
import { LANGS } from '@/domain/models';
import { useSettings } from '@/store/settings';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';
import { GlobeIcon, MoonIcon, SunIcon } from './ui/Icons';

export function Header({ resolvedTheme }: { resolvedTheme: 'dark' | 'light' }) {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  const setTheme = useSettings((s) => s.setTheme);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/pokedex" className="flex shrink-0 items-center gap-2 rounded-xl" aria-label={t('app.title')}>
          <Logo className="size-8" />
          <span className="hidden text-lg font-extrabold tracking-tight sm:block">{t('app.title')}</span>
        </Link>

        <nav aria-label={t('nav.main')} className="hidden lg:block">
          <ul className="flex gap-1">
            <li>
              <NavLink
                to="/pokedex"
                className={({ isActive }) => `rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? 'bg-surface-2' : 'text-muted hover:text-fg'}`}
              >
                {t('nav.pokedex')}
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="mx-auto w-full max-w-xl">
          <SearchBar />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label className="glass relative hidden h-11 items-center gap-1.5 rounded-2xl pr-2 pl-3 sm:flex">
            <GlobeIcon className="size-4 text-muted" />
            <span className="sr-only">{t('settings.language')}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="h-full cursor-pointer appearance-none bg-transparent pr-1 text-sm font-semibold outline-none"
            >
              {LANGS.map((l) => (
                <option key={l} value={l} className="bg-bg text-fg">
                  {LANG_LABELS[l]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="glass grid size-11 place-items-center rounded-2xl transition-transform hover:bg-surface-2 active:scale-95"
            aria-label={t('settings.toggleTheme')}
            title={t('settings.toggleTheme')}
          >
            {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
