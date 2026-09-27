// ============================================================================
// uiStore.ts - Navigation et etat d'interface (NON persiste)
// ----------------------------------------------------------------------------
// Un petit routeur interne base sur l'etat, volontairement separe du store de
// donnees pour ne PAS persister la navigation.
// ============================================================================

import { create } from 'zustand';
import type { ParseResult } from './types';

export type View =
  | 'dashboard'
  | 'orals'
  | 'import'
  | 'validation'
  | 'editor'
  | 'session'
  | 'exam'
  | 'weak'
  | 'full'
  | 'plan'
  | 'grammar'
  | 'oeuvre'
  | 'settings';

interface UiStore {
  view: View;
  /** Oral courant (pour l'editeur, le mode complet, le mode plan). */
  activeOralId: string | null;
  /** Resultat d'analyse en attente de validation (page de validation). */
  pendingImport: ParseResult | null;

  navigate: (view: View, opts?: { oralId?: string | null }) => void;
  openOral: (oralId: string, view?: View) => void;
  setPendingImport: (result: ParseResult | null) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  view: 'dashboard',
  activeOralId: null,
  pendingImport: null,

  navigate: (view, opts) =>
    set((s) => ({ view, activeOralId: opts && 'oralId' in opts ? opts.oralId ?? null : s.activeOralId })),

  openOral: (oralId, view = 'editor') => set({ view, activeOralId: oralId }),

  setPendingImport: (result) => set({ pendingImport: result }),
}));
