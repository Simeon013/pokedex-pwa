/**
 * Réglages utilisateur persistants : thème, langue, animations, 3D.
 * Le thème et la langue sont aussi copiés dans localStorage pour être appliqués
 * avant le premier rendu (voir le script inline de index.html), sans flash.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LANGS, type Lang } from '@/domain/models';
import { persistentStorage } from './storage';

export type ThemePref = 'dark' | 'light' | 'system';
export type MotionPref = 'system' | 'reduced' | 'full';
export type Quality3D = 'low' | 'medium' | 'high';

export interface SettingsState {
  theme: ThemePref;
  lang: Lang;
  motion: MotionPref;
  enable3d: boolean;
  quality3d: Quality3D;
  playCryOnOpen: boolean;
  setTheme: (t: ThemePref) => void;
  setLang: (l: Lang) => void;
  setMotion: (m: MotionPref) => void;
  setEnable3d: (v: boolean) => void;
  setQuality3d: (q: Quality3D) => void;
  setPlayCryOnOpen: (v: boolean) => void;
}

/** Français par défaut (exigence du projet), sauf choix explicite enregistré. */
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('pokedex:lang');
    if (saved && (LANGS as readonly string[]).includes(saved)) return saved as Lang;
  } catch {
    // stockage indisponible
  }
  return 'fr';
}

function initialTheme(): ThemePref {
  try {
    const saved = localStorage.getItem('pokedex:theme');
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
  } catch {
    // stockage indisponible
  }
  return 'dark';
}

function mirror(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // stockage indisponible
  }
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: initialTheme(),
      lang: initialLang(),
      motion: 'system',
      enable3d: true,
      quality3d: 'medium',
      playCryOnOpen: false,
      setTheme: (theme) => {
        mirror('pokedex:theme', theme);
        set({ theme });
      },
      setLang: (lang) => {
        mirror('pokedex:lang', lang);
        set({ lang });
      },
      setMotion: (motion) => set({ motion }),
      setEnable3d: (enable3d) => set({ enable3d }),
      setQuality3d: (quality3d) => set({ quality3d }),
      setPlayCryOnOpen: (playCryOnOpen) => set({ playCryOnOpen }),
    }),
    { name: 'settings', storage: persistentStorage, version: 1 },
  ),
);
