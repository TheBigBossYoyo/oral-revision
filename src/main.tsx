// ============================================================================
// main.tsx - Point d'entree React
// ----------------------------------------------------------------------------
// Monte l'application dans #root. Le CSS (Tailwind + composants) est importe ici
// une seule fois. La PWA (service worker) est enregistree automatiquement par
// vite-plugin-pwa (option `registerType: 'autoUpdate'` dans vite.config.ts).
// ============================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Element racine #root introuvable dans index.html.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
