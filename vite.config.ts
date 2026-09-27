import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Le frontend appelle "/api/..." et Vite proxifie vers le backend Express local.
// Ainsi la cle Gemini n'est JAMAIS exposee au navigateur.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // On met en cache l'app shell pour un fonctionnement hors-ligne apres le 1er chargement.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      manifest: {
        name: 'OralRevision - Apprentissage des oraux',
        short_name: 'OralRevision',
        description: 'Apprendre par coeur ses oraux de francais avant le 26 juin.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        lang: 'fr',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
