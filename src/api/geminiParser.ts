// ============================================================================
// api/geminiParser.ts - Pont frontend vers le backend Gemini
// ----------------------------------------------------------------------------
// Le frontend n'appelle JAMAIS Gemini directement (la cle API reste cote serveur).
// Il interroge POST /api/parse-oral. Si le backend est injoignable (hors-ligne,
// non lance), on bascule sur le decoupage local de secours afin que l'import
// fonctionne quand meme.
// ============================================================================

import type { ParseResult } from '../types';
import { parseOralFallback } from '../utils/parseOralFallback';
import { isExactSubstring } from '../utils/textProcessing';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const PARSE_URL = `${API_BASE}/api/parse-oral`;

/** Construit un ParseResult de secours (decoupage local). */
function fallbackResult(rawText: string, reason: string): ParseResult {
  return {
    ok: true,
    source: 'fallback',
    rawText,
    oral: parseOralFallback(rawText),
    warnings: [
      {
        level: 'warning',
        code: 'fallback_used',
        message: `Decoupage local utilise : ${reason}. Verifiez bien les sections avant de valider.`,
      },
    ],
  };
}

/**
 * Filet de securite cote client : meme si le backend valide deja, on revérifie
 * que chaque paragraphe issu de Gemini est une portion exacte du texte source.
 */
function clientSideValidate(result: ParseResult): ParseResult {
  if (result.source !== 'gemini') return result;
  const warnings = [...result.warnings];
  for (const section of result.oral.sections) {
    for (const p of section.paragraphs) {
      if (!isExactSubstring(p.text, result.rawText)) {
        warnings.push({
          level: 'error',
          code: 'paragraph_not_found',
          message: 'Un paragraphe ne correspond pas exactement au texte original (reformulation possible).',
          excerpt: p.text.slice(0, 120),
        });
      }
    }
  }
  return { ...result, warnings };
}

/**
 * Analyse un oral : tente Gemini via le backend, sinon decoupage local.
 * Ne leve jamais : retourne toujours un ParseResult exploitable.
 */
export async function parseOral(rawText: string): Promise<ParseResult> {
  const text = rawText.trim();
  if (!text) {
    return {
      ok: false,
      source: 'fallback',
      rawText,
      oral: { title: '', sections: [] },
      warnings: [{ level: 'error', code: 'empty_result', message: 'Aucun texte a analyser.' }],
    };
  }

  try {
    const res = await fetch(PARSE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: text }),
    });

    if (!res.ok) {
      return fallbackResult(text, `le serveur a repondu ${res.status}`);
    }

    const data = (await res.json()) as ParseResult;
    if (!data || !data.oral || !Array.isArray(data.oral.sections)) {
      return fallbackResult(text, 'reponse du serveur invalide');
    }
    // On force le rawText local (source de verite cote client).
    return clientSideValidate({ ...data, rawText: text });
  } catch (err) {
    console.warn('[geminiParser] Backend injoignable, fallback local.', err);
    return fallbackResult(text, 'backend injoignable (hors-ligne ?)');
  }
}

/** Separateur d'oraux pour l'import multiple. */
const ORAL_SEPARATOR = /^\s*(?:={3,}|#{2,}\s*oral|-{3,}\s*oral|::: ?oral)\b.*$/gim;

/** Decoupe un collage contenant plusieurs oraux en plusieurs textes bruts. */
export function splitOralChunks(text: string): string[] {
  return text
    .split(ORAL_SEPARATOR)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

/** Analyse plusieurs oraux d'un coup. */
export async function parseMultipleOrals(text: string): Promise<ParseResult[]> {
  const chunks = splitOralChunks(text);
  const results: ParseResult[] = [];
  for (const chunk of chunks) {
    results.push(await parseOral(chunk));
  }
  return results;
}
