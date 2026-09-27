// ============================================================================
// server/gemini.ts - Appel Gemini + validation anti-reformulation
// ----------------------------------------------------------------------------
// SDK officiel courant : "@google/genai" (le client { GoogleGenAI }).
// La cle API n'est lue que cote serveur (process.env.GEMINI_API_KEY).
//
// Garantie anti-reformulation : on verifie que CHAQUE paragraphe renvoye par
// Gemini est une portion exacte du texte original. Si trop de paragraphes ne
// correspondent pas (ou si la reponse n'est pas du JSON valide), on bascule sur
// le decoupage local de secours (parseOralFallback), partage avec le frontend.
// ============================================================================

import { GoogleGenAI } from '@google/genai';
import type {
  DetectedType,
  MemorizationMode,
  ParsedOral,
  ParsedParagraph,
  ParsedSection,
  ParseResult,
  ParseWarning,
} from '../src/types';
import { parseOralFallback } from '../src/utils/parseOralFallback';
import { isExactSubstring } from '../src/utils/textProcessing';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts/parseOralPrompt';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const DETECTED_TYPES: DetectedType[] = [
  'title', 'introduction', 'lecture', 'analyse', 'movement', 'conclusion', 'other',
];
const MEMO_MODES: MemorizationMode[] = ['memorize', 'readOnly', 'ignored'];

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'ma_cle_api') return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------

function makeFallback(
  rawText: string,
  message: string,
  code: ParseWarning['code'],
  level: ParseWarning['level'],
  extraWarnings: ParseWarning[] = [],
): ParseResult {
  return {
    ok: true,
    source: 'fallback',
    rawText,
    oral: parseOralFallback(rawText),
    warnings: [{ level, code, message }, ...extraWarnings],
  };
}

// ---------------------------------------------------------------------------
// Parsing JSON robuste (tolerant aux balises Markdown ```json)
// ---------------------------------------------------------------------------

function safeParseJson(text: string): unknown | null {
  const cleaned = text
    .replace(/^\uFEFF/, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Coercition + validation
// ---------------------------------------------------------------------------

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function clampConfidence(v: unknown): number {
  const n = typeof v === 'number' ? v : 0.8;
  return Math.max(0, Math.min(1, n));
}

function coerceType(v: unknown): DetectedType {
  return DETECTED_TYPES.includes(v as DetectedType) ? (v as DetectedType) : 'other';
}

function coerceMode(v: unknown, type: DetectedType): MemorizationMode {
  if (MEMO_MODES.includes(v as MemorizationMode)) return v as MemorizationMode;
  return type === 'lecture' ? 'readOnly' : type === 'title' ? 'ignored' : 'memorize';
}

function coerceStringArray(v: unknown, source: string): string[] {
  if (!Array.isArray(v)) return [];
  // Citations/procedes : on ne garde que ce qui existe vraiment dans le texte.
  return v
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .filter((x) => isExactSubstring(x, source) || x.length < 40);
}

interface ValidationResult {
  oral: ParsedOral;
  warnings: ParseWarning[];
  mismatchRatio: number;
}

/**
 * Normalise la reponse de Gemini en `ParsedOral` valide et verifie que chaque
 * paragraphe existe bien dans le texte source.
 */
function validateAndNormalize(parsed: unknown, rawText: string): ValidationResult {
  const root = (parsed ?? {}) as Record<string, unknown>;
  const rawSections = Array.isArray(root.sections) ? root.sections : [];
  const warnings: ParseWarning[] = [];

  let totalParagraphs = 0;
  let mismatches = 0;

  const sections: ParsedSection[] = rawSections.map((rawSection, si) => {
    const sec = (rawSection ?? {}) as Record<string, unknown>;
    const detectedType = coerceType(sec.detectedType);
    const sectionId = asString(sec.id, `section-${si + 1}`);
    const originalHeading = asString(sec.originalHeading, `Section ${si + 1}`);

    // Verifie que le titre existe dans la source (sinon, simple avertissement).
    if (originalHeading && !isExactSubstring(originalHeading, rawText) && originalHeading.length > 3) {
      warnings.push({
        level: 'info',
        code: 'heading_not_found',
        message: `Le titre "${originalHeading}" n'a pas ete retrouve tel quel dans le texte. Verifiez-le.`,
        sectionId,
      });
    }

    const rawParagraphs = Array.isArray(sec.paragraphs) ? sec.paragraphs : [];
    const paragraphs: ParsedParagraph[] = rawParagraphs.map((rawPara, pi) => {
      const par = (rawPara ?? {}) as Record<string, unknown>;
      const text = asString(par.text);
      totalParagraphs += 1;

      if (text && !isExactSubstring(text, rawText)) {
        mismatches += 1;
        warnings.push({
          level: 'error',
          code: 'paragraph_not_found',
          message:
            'Ce paragraphe ne correspond pas exactement au texte original : Gemini a peut-etre reformule. A verifier ou remplacer.',
          sectionId,
          paragraphId: asString(par.id, `p-${si + 1}-${pi + 1}`),
          excerpt: text.slice(0, 140),
        });
      }

      return {
        id: asString(par.id, `p-${si + 1}-${pi + 1}`),
        text,
        order: typeof par.order === 'number' ? par.order : pi + 1,
        quotes: coerceStringArray(par.quotes, rawText),
        literaryDevices: coerceStringArray(par.literaryDevices, rawText),
      };
    });

    const movementNumber =
      typeof sec.movementNumber === 'number' ? sec.movementNumber : undefined;

    return {
      id: sectionId,
      originalHeading,
      detectedType,
      movementNumber,
      memorizationMode: coerceMode(sec.memorizationMode, detectedType),
      confidence: clampConfidence(sec.confidence),
      paragraphs: paragraphs.filter((p) => p.text.length > 0),
    };
  });

  const oral: ParsedOral = {
    title: asString(root.title, asString(root.rawTitle, 'Oral importe')),
    rawTitle: asString(root.rawTitle, asString(root.title)),
    sections: sections.filter((s) => s.paragraphs.length > 0 || s.detectedType === 'lecture'),
  };

  const mismatchRatio = totalParagraphs === 0 ? 1 : mismatches / totalParagraphs;
  return { oral, warnings, mismatchRatio };
}

// ---------------------------------------------------------------------------
// Point d'entree
// ---------------------------------------------------------------------------

/** Analyse un oral via Gemini, avec validation et fallback automatique. */
export async function parseOral(rawText: string): Promise<ParseResult> {
  const ai = getClient();
  if (!ai) {
    return makeFallback(
      rawText,
      'GEMINI_API_KEY absente ou non configuree : decoupage local utilise.',
      'fallback_used',
      'warning',
    );
  }

  let text: string;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildUserPrompt(rawText),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });
    text = response.text ?? '';
  } catch (err) {
    console.error('[gemini] Appel a l\'API en echec :', err);
    return makeFallback(rawText, 'appel a Gemini en echec', 'fallback_used', 'warning');
  }

  const parsed = safeParseJson(text);
  if (!parsed) {
    return makeFallback(rawText, 'Gemini n\'a pas renvoye de JSON valide', 'invalid_json', 'error');
  }

  const { oral, warnings, mismatchRatio } = validateAndNormalize(parsed, rawText);

  // Trop de reformulations OU structure vide -> on prefere le decoupage local.
  if (oral.sections.length === 0 || mismatchRatio > 0.34) {
    return makeFallback(
      rawText,
      'trop de paragraphes ne correspondent pas au texte original (reformulation detectee)',
      'high_mismatch',
      'error',
      warnings,
    );
  }

  return { ok: true, source: 'gemini', rawText, oral, warnings };
}
