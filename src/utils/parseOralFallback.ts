// ============================================================================
// parseOralFallback.ts - Decoupage local de secours (sans Gemini)
// ----------------------------------------------------------------------------
// Utilise si le backend Gemini est indisponible OU si la reponse de Gemini est
// rejetee par la validation anti-reformulation. Detecte les sections avec de
// simples expressions regulieres et decoupe selon les sauts de ligne.
// Comme Gemini, il NE REFORMULE RIEN : chaque paragraphe est une portion exacte
// du texte colle.
// ============================================================================

import type { DetectedType, MemorizationMode, ParsedOral, ParsedSection } from '../types';

interface HeadingMatch {
  type: DetectedType;
  movementNumber?: number;
}

const RE = {
  introduction: /^(introduction|intro|présentation|presentation)\b/i,
  lecture: /^(lecture|texte|extrait)\b/i,
  analyse: /^(analyse|analyse linéaire|développement|developpement)\b/i,
  conclusion: /^(conclusion|conclu|ouverture)\b/i,
  // Mouvements : "1er mouvement", "Mouvement 1", "Mvt 1", "I)", "II.", ...
  movementWord: /^(\d+)\s*(?:er|ère|ere|ème|eme|e|nd)?\s*mouvement\b/i,
  movementNum: /^mouvement\s*(?:n[°o]\s*)?(\d+)/i,
  movementAbbr: /^mvt\.?\s*(\d+)/i,
  movementRoman: /^([IVX]{1,4})\s*[).．.\-–—:]/,
};

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10 };

function romanToInt(roman: string): number {
  const s = roman.toUpperCase();
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = ROMAN[s[i]] ?? 0;
    const next = ROMAN[s[i + 1]] ?? 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}

/** Mode de memorisation par defaut selon le type detecte. */
export function defaultMode(type: DetectedType): MemorizationMode {
  switch (type) {
    case 'lecture':
      return 'readOnly';
    case 'title':
      return 'ignored';
    default:
      return 'memorize';
  }
}

/** Tente de reconnaitre une ligne comme titre de section. */
function detectHeading(rawLine: string): HeadingMatch | null {
  const line = rawLine.trim();
  if (!line) return null;

  // Mouvements (titres potentiellement longs et descriptifs).
  let m =
    line.match(RE.movementWord) ||
    line.match(RE.movementNum) ||
    line.match(RE.movementAbbr);
  if (m) return { type: 'movement', movementNumber: Number(m[1]) };

  m = line.match(RE.movementRoman);
  if (m) return { type: 'movement', movementNumber: romanToInt(m[1]) };

  // Autres sections : on exige une ligne courte (vrai titre, pas de la prose).
  if (line.length <= 80) {
    if (RE.introduction.test(line)) return { type: 'introduction' };
    if (RE.lecture.test(line)) return { type: 'lecture' };
    if (RE.analyse.test(line)) return { type: 'analyse' };
    if (RE.conclusion.test(line)) return { type: 'conclusion' };
  }
  return null;
}

/** Decoupe un bloc de texte en paragraphes (separes par des lignes vides). */
function splitParagraphs(block: string): string[] {
  return block
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\n+/g, '\n').trim())
    .filter((p) => p.length > 0);
}

/**
 * Decoupage local complet d'un oral colle en texte brut.
 * Retourne une structure `ParsedOral` (sans IDs ni scores : c'est le role de
 * la factory ensuite).
 */
export function parseOralFallback(rawText: string): ParsedOral {
  const lines = rawText.replace(/\r\n/g, '\n').split('\n');

  // 1) Titre = premiere ligne non vide qui n'est pas un en-tete de section.
  let title = '';
  let startIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    if (!detectHeading(t)) {
      title = t;
      startIndex = i + 1;
    }
    break;
  }
  if (!title) title = 'Oral importe';

  // 2) Parcours des lignes -> sections.
  const sections: ParsedSection[] = [];
  let current: { heading: string; match: HeadingMatch; buffer: string[] } | null = null;
  const orphanBuffer: string[] = [];

  const flush = () => {
    if (!current) return;
    const paragraphs = splitParagraphs(current.buffer.join('\n')).map((text, idx) => ({
      text,
      order: idx + 1,
    }));
    sections.push({
      originalHeading: current.heading,
      detectedType: current.match.type,
      movementNumber: current.match.movementNumber,
      memorizationMode: defaultMode(current.match.type),
      confidence: 0.5,
      paragraphs,
    });
    current = null;
  };

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const heading = detectHeading(line);
    if (heading) {
      flush();
      current = { heading: line.trim(), match: heading, buffer: [] };
    } else if (current) {
      current.buffer.push(line);
    } else if (line.trim()) {
      orphanBuffer.push(line);
    }
  }
  flush();

  // 3) Contenu avant toute section detectee -> section "Introduction" implicite
  //    (mode memorize) pour ne rien perdre.
  if (orphanBuffer.length > 0) {
    const paragraphs = splitParagraphs(orphanBuffer.join('\n')).map((text, idx) => ({
      text,
      order: idx + 1,
    }));
    if (paragraphs.length > 0) {
      sections.unshift({
        originalHeading: 'Contenu',
        detectedType: 'other',
        memorizationMode: 'memorize',
        confidence: 0.3,
        paragraphs,
      });
    }
  }

  // 4) Aucun decoupage possible -> tout le texte en un seul paragraphe.
  if (sections.length === 0) {
    const paragraphs = splitParagraphs(rawText).map((text, idx) => ({
      text,
      order: idx + 1,
    }));
    sections.push({
      originalHeading: 'Contenu',
      detectedType: 'other',
      memorizationMode: 'memorize',
      confidence: 0.2,
      paragraphs,
    });
  }

  return { title, rawTitle: title, sections };
}
