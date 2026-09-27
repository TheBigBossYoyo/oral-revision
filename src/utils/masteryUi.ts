// ============================================================================
// utils/masteryUi.ts - Helpers d'affichage (couleurs de maitrise, libelles FR)
// ----------------------------------------------------------------------------
// Les couleurs de maitrise sont appliquees en STYLE INLINE (et non via des
// classes Tailwind dynamiques) afin d'eviter que Tailwind ne "purge" des classes
// construites a la volee (ex : `bg-mastery-${score}`). Ce fichier centralise
// donc toute la correspondance score -> couleur / libelle.
// ============================================================================

import type { CSSProperties } from 'react';
import type { DetectedType, MemorizationMode, SessionItem } from '../types';
import { SCORE_INFO, scoreLabel } from '../scheduleAlgorithm';

/** Couleurs de maitrise 0..5 (DOIT rester synchronise avec tailwind.config.js). */
export const MASTERY_HEX = [
  '#ef4444', // 0 inconnu
  '#f97316', // 1 tres faible
  '#f59e0b', // 2 fragile
  '#eab308', // 3 correct
  '#84cc16', // 4 presque acquis
  '#22c55e', // 5 maitrise
] as const;

export { SCORE_INFO, scoreLabel };

/** Borne un score dans 0..5 (entier). */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(5, Math.round(score)));
}

/** Couleur hexadecimale associee a un score de maitrise. */
export function masteryColor(score: number): string {
  return MASTERY_HEX[clampScore(score)];
}

/** Pastille pleine (point de couleur). */
export function masteryDotStyle(score: number): CSSProperties {
  return { backgroundColor: masteryColor(score) };
}

/** Texte colore selon le score. */
export function masteryTextStyle(score: number): CSSProperties {
  return { color: masteryColor(score) };
}

/** Fond doux + texte de la meme teinte (badge de maitrise). */
export function masterySoftStyle(score: number): CSSProperties {
  const c = masteryColor(score);
  // `22` = ~13% d'opacite en hexa, pour un fond discret.
  return { backgroundColor: `${c}22`, color: c };
}

/** Formate une proportion 0..1 en pourcentage ("72 %"). */
export function formatPercent(value01: number): string {
  return `${Math.round(value01 * 100)} %`;
}

// ----------------------------------------------------------------------------
// Libelles francais
// ----------------------------------------------------------------------------

export const DETECTED_TYPE_LABEL: Record<DetectedType, string> = {
  title: 'Titre',
  introduction: 'Introduction',
  lecture: 'Lecture',
  analyse: 'Analyse',
  movement: 'Mouvement',
  conclusion: 'Conclusion',
  other: 'Autre',
};

export function detectedTypeLabel(type: DetectedType): string {
  return DETECTED_TYPE_LABEL[type] ?? 'Autre';
}

export const MEMO_MODE_LABEL: Record<MemorizationMode, string> = {
  memorize: 'A memoriser',
  readOnly: 'Lecture seule',
  ignored: 'Ignore',
};

export function memorizationModeLabel(mode: MemorizationMode): string {
  return MEMO_MODE_LABEL[mode] ?? mode;
}

export const REASON_LABEL: Record<SessionItem['reason'], string> = {
  new: 'Nouveau',
  overdue: 'En retard',
  weak: 'A consolider',
  due: 'A revoir',
  reinforce: 'Renfort',
};

export function reasonLabel(reason: SessionItem['reason']): string {
  return REASON_LABEL[reason] ?? '';
}

/** Style d'un badge "raison" (couleur indicative selon l'urgence). */
export function reasonBadgeStyle(reason: SessionItem['reason']): CSSProperties {
  const map: Record<SessionItem['reason'], string> = {
    new: '#6366f1',
    overdue: '#ef4444',
    weak: '#f59e0b',
    due: '#0ea5e9',
    reinforce: '#84cc16',
  };
  const c = map[reason] ?? '#64748b';
  return { backgroundColor: `${c}22`, color: c };
}
