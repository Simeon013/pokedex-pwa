/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // Sous-chemin de déploiement (GitHub Pages : /pokedex-pwa/). Racine par défaut (Vercel, Netlify, local).
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    // Pas de manualChunks pour Three.js : il doit rester dans un chunk chargé à la demande
    // (React.lazy), sinon Vite l'ajoute aux modulepreload de toutes les pages.
    rollupOptions: {
      output: {
        manualChunks: (id) => (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id) ? 'react' : undefined),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
