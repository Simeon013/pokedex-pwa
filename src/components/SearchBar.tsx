/**
 * Barre de recherche (motif ARIA « combobox » avec liste de suggestions).
 * - `/` donne le focus depuis n'importe où ;
 * - ↑ ↓ parcourent les suggestions, Entrée ouvre la fiche, Échap ferme ;
 * - la saisie filtre aussi la grille en direct (avec un léger anti-rebond).
 */
import { AnimatePresence, m } from 'framer-motion';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { displayName, suggest } from '@/domain/filters';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useHotkey } from '@/hooks/useHotkey';
import { formatDexNumber, useLang, useT } from '@/i18n';
import { useFilters } from '@/store/filters';
import { useIndexStore } from '@/store/pokedexIndex';
import { PokemonImage } from './PokemonImage';
import { TypeBadge } from './TypeBadge';

export function SearchBar() {
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const entries = useIndexStore((s) => s.index?.entries);
  const query = useFilters((s) => s.query);
  const setQuery = useFilters((s) => s.setQuery);

  const [text, setText] = useState(query);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const debounced = useDebouncedValue(text, 120);
  useEffect(() => setQuery(debounced), [debounced, setQuery]);
  // Si les filtres sont réinitialisés ailleurs, le champ suit.
  useEffect(() => {
    if (query === '' && text !== '' && debounced === text) setText('');
  }, [query]);

  const suggestions = useMemo(() => (entries ? suggest(entries, text, lang, 8) : []), [entries, text, lang]);
  useEffect(() => setActive(-1), [text]);

  useHotkey('/', (e) => {
    e.preventDefault();
    inputRef.current?.focus();
    inputRef.current?.select();
  });

  const go = (id: number) => {
    setOpen(false);
    inputRef.current?.blur();
    navigate(`/pokemon/${id}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Enter') {
      const target = suggestions[active] ?? (suggestions.length === 1 ? suggestions[0] : undefined);
      if (target) go(target.id);
      else {
        setOpen(false);
        if (location.pathname !== '/pokedex') navigate('/pokedex');
      }
    } else if (e.key === 'Escape') {
      // Empêche Chromium de vider le champ <input type="search"> : Échap ferme d'abord la liste.
      e.preventDefault();
      if (open && text) setOpen(false);
      else inputRef.current?.blur();
    }
  };

  const showList = open && text.trim().length > 0;

  return (
    <div className="relative w-full">
      <label htmlFor={`${listId}-input`} className="sr-only">
        {t('search.label')}
      </label>
      <div className="glass flex h-11 items-center gap-2 rounded-2xl px-3 transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent)]">
        <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-muted" aria-hidden>
          <path d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.2 4.2-1.4 1.4-4.2-4.2A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" fill="currentColor" />
        </svg>
        <input
          ref={inputRef}
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder={t('search.placeholder')}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none focus-visible:outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {text ? (
          <button
            type="button"
            onClick={() => {
              setText('');
              setQuery('');
              inputRef.current?.focus();
            }}
            className="grid size-7 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
            aria-label={t('search.clear')}
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </button>
        ) : (
          <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-xs text-muted sm:block" aria-hidden>
            /
          </kbd>
        )}
      </div>

      <AnimatePresence>
        {showList && (
          <m.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="glass absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-bg/95 shadow-2xl"
          >
            <ul id={listId} role="listbox" aria-label={t('search.suggestions')} className="max-h-[60vh] overflow-y-auto p-1.5">
              {suggestions.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted">{t('search.noSuggestion')}</li>}
              {suggestions.map((e, i) => {
                const name = displayName(e, lang);
                return (
                  <li
                    key={e.id}
                    id={`${listId}-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => go(e.id)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 ${i === active ? 'bg-surface-2' : ''}`}
                  >
                    <PokemonImage id={e.id} alt="" size={40} className="size-10" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{name}</span>
                      <span className="font-mono text-xs text-muted">{formatDexNumber(e.speciesId)}</span>
                    </span>
                    <span className="flex gap-1">
                      {e.types.map((type) => (
                        <TypeBadge key={type} type={type} />
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="hidden border-t border-line px-3 py-1.5 text-[11px] text-muted sm:block">{t('search.hint')}</p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
