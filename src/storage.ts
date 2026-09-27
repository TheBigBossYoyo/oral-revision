// ============================================================================
// storage.ts - Persistance locale (localStorage) + export / import JSON
// ----------------------------------------------------------------------------
// Toutes les donnees sont stockees localement : l'application fonctionne donc
// sans Internet une fois les oraux importes. Aucune donnee n'est envoyee a un
// serveur (sauf le texte brut au moment de l'import, vers le backend Gemini).
// ============================================================================

import type { AppSettings, BackupFile, Oral, StreakState } from './types';
import { DEFAULT_EDGE_VOICE } from './audio/edgeVoices';

export const STORAGE_KEY = 'oral-revision:v1';
export const BACKUP_VERSION = 1;

/** Date d'examen par defaut (objectif de l'utilisateur). */
export const DEFAULT_EXAM_DATE = '2026-06-26';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  audio: {
    useHumanVoice: true,
    edgeVoice: DEFAULT_EDGE_VOICE,
    voiceURI: null,
    rate: 0.95,
    volume: 1,
    pitch: 1,
    lang: 'fr-FR',
    loopPauseMs: 600,
  },
  examDate: DEFAULT_EXAM_DATE,
  dailyNewTarget: 6,
};

export const DEFAULT_STREAK: StreakState = {
  count: 0,
  lastStudyDate: null,
  best: 0,
};

/** Forme de l'etat reellement persiste sur le disque. */
export interface PersistedState {
  orals: Oral[];
  settings: AppSettings;
  streak: StreakState;
}

const EMPTY_STATE: PersistedState = {
  orals: [],
  settings: DEFAULT_SETTINGS,
  streak: DEFAULT_STREAK,
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Fusionne les reglages charges avec les defauts (tolerant aux versions). */
function mergeSettings(partial: Partial<AppSettings> | undefined): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    audio: { ...DEFAULT_SETTINGS.audio, ...(partial?.audio ?? {}) },
  };
}

/** Charge l'etat persiste, ou null si rien n'est encore stocke. */
export function loadPersisted(): PersistedState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      orals: Array.isArray(parsed.orals) ? parsed.orals : [],
      settings: mergeSettings(parsed.settings),
      streak: { ...DEFAULT_STREAK, ...(parsed.streak ?? {}) },
    };
  } catch (err) {
    console.error('[storage] Lecture impossible, etat reinitialise.', err);
    return null;
  }
}

/** Sauvegarde immediate de l'etat dans localStorage. */
export function savePersisted(state: PersistedState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[storage] Sauvegarde impossible (quota depasse ?).', err);
  }
}

/** Retourne un etat vide (utilise au tout premier lancement). */
export function emptyState(): PersistedState {
  return structuredClone(EMPTY_STATE);
}

// ----------------------------------------------------------------------------
// Export / Import JSON
// ----------------------------------------------------------------------------

/** Construit le contenu JSON d'une sauvegarde complete (texte pretty-print). */
export function exportBackup(state: PersistedState): string {
  const backup: BackupFile = {
    app: 'oral-revision',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    orals: state.orals,
    settings: state.settings,
    streak: state.streak,
  };
  return JSON.stringify(backup, null, 2);
}

/** Declenche le telechargement d'un fichier de sauvegarde dans le navigateur. */
export function downloadBackup(state: PersistedState): void {
  if (!isBrowser()) return;
  const content = exportBackup(state);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `oral-revision-sauvegarde-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Analyse un fichier de sauvegarde JSON et retourne un etat valide.
 * Leve une erreur explicite si le fichier est invalide.
 */
export function parseBackup(jsonText: string): PersistedState {
  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error('Fichier illisible : ce n\'est pas du JSON valide.');
  }
  const obj = data as Partial<BackupFile>;
  if (!obj || obj.app !== 'oral-revision' || !Array.isArray(obj.orals)) {
    throw new Error('Fichier de sauvegarde non reconnu (champ "orals" manquant).');
  }
  return {
    orals: obj.orals,
    settings: mergeSettings(obj.settings),
    streak: { ...DEFAULT_STREAK, ...(obj.streak ?? {}) },
  };
}
