// ============================================================================
// oralFactory.ts - Construction d'objets `Oral` complets
// ----------------------------------------------------------------------------
// Transforme un `ParsedOral` (sortie Gemini/fallback, edite par l'utilisateur)
// en `Oral` pret a etre appris : ajout des IDs, scores initiaux, dates, etc.
// Le texte des paragraphes est recopie tel quel (aucune reformulation).
// ============================================================================

import type {
  Oral,
  Paragraph,
  ParsedOral,
  ParsedParagraph,
  ParsedSection,
  Section,
} from '../types';
import { estimateMinutes } from './textProcessing';

/** Generateur d'identifiant robuste (avec repli si crypto indisponible). */
export function newId(prefix: string): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}-${rnd}`;
}

/** Cree un paragraphe complet (jamais vu) a partir d'un texte exact. */
export function createParagraph(
  text: string,
  oralId: string,
  sectionId: string,
  order: number,
  extra?: Partial<Pick<ParsedParagraph, 'quotes' | 'literaryDevices'>>,
): Paragraph {
  return {
    id: newId('p'),
    oralId,
    sectionId,
    text,
    order,
    masteryScore: 0,
    reviewHistory: [],
    nextReviewDate: null,
    difficulty: 3,
    estimatedMinutes: estimateMinutes(text),
    quotes: extra?.quotes ?? [],
    literaryDevices: extra?.literaryDevices ?? [],
  };
}

function buildSection(parsed: ParsedSection, oralId: string): Section {
  const sectionId = newId('section');
  const paragraphs = parsed.paragraphs.map((p, idx) =>
    createParagraph(p.text, oralId, sectionId, idx + 1, {
      quotes: p.quotes,
      literaryDevices: p.literaryDevices,
    }),
  );
  return {
    id: sectionId,
    originalHeading: parsed.originalHeading,
    detectedType: parsed.detectedType,
    movementNumber: parsed.movementNumber,
    memorizationMode: parsed.memorizationMode,
    confidence: parsed.confidence,
    paragraphs,
  };
}

/** Construit un `Oral` complet a partir d'un `ParsedOral` valide. */
export function buildOralFromParsed(parsed: ParsedOral, rawText: string): Oral {
  const now = new Date().toISOString();
  const oralId = newId('oral');
  const sections = parsed.sections.map((s) => buildSection(s, oralId));
  return {
    id: oralId,
    title: parsed.title || parsed.rawTitle || 'Oral importe',
    rawTitle: parsed.rawTitle ?? parsed.title,
    rawText,
    createdAt: now,
    updatedAt: now,
    sections,
    globalMastery: 0,
    nextReviewDate: null,
  };
}

/**
 * Re-synchronise les references et l'ordre apres une edition (fusion, division,
 * deplacement de paragraphes). Garantit que chaque paragraphe pointe vers le bon
 * `sectionId`/`oralId` et possede un `order` correct.
 */
export function reindexOral(oral: Oral): Oral {
  const sections = oral.sections.map((section) => ({
    ...section,
    paragraphs: section.paragraphs.map((p, idx) => ({
      ...p,
      oralId: oral.id,
      sectionId: section.id,
      order: idx + 1,
    })),
  }));
  return { ...oral, sections };
}
