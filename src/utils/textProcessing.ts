// ============================================================================
// textProcessing.ts - Utilitaires de texte
// ----------------------------------------------------------------------------
// REGLE D'OR : aucune fonction ici ne modifie le texte AFFICHE ou SAUVEGARDE.
// - `cleanForSpeech` ne sert QU'A la synthese vocale (sortie jetable).
// - `buildCloze` produit un masquage d'affichage sans toucher au texte source.
// ============================================================================

/** Compte les mots d'un texte. */
export function countWords(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

/** Compte les caracteres (hors espaces superflus). */
export function countChars(text: string): number {
  return text.replace(/\s+/g, ' ').trim().length;
}

/**
 * Estime le temps de memorisation d'un paragraphe (en minutes).
 * Heuristique : ~25 mots/minute pour apprendre par coeur (lecture + recitation).
 */
export function estimateMinutes(text: string): number {
  const words = countWords(text);
  const raw = words / 25;
  const clamped = Math.min(12, Math.max(0.5, raw));
  return Math.round(clamped * 10) / 10;
}

/** Formate une duree en minutes pour l'affichage ("3 min", "1 h 05"). */
export function formatMinutes(min: number): string {
  if (min < 1) return '< 1 min';
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

/** Normalise les espaces (pour comparer deux textes sans tenir compte du formatage). */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Verifie qu'un extrait est bien une portion exacte du texte source
 * (tolerant uniquement aux differences d'espaces / sauts de ligne).
 * Sert a la validation anti-reformulation cote frontend (filet de securite).
 */
export function isExactSubstring(excerpt: string, source: string): boolean {
  const a = normalizeWhitespace(excerpt).toLowerCase();
  const b = normalizeWhitespace(source).toLowerCase();
  if (!a) return false;
  return b.includes(a);
}

/**
 * Nettoyage LEGER pour la lecture audio uniquement.
 * Rend la voix plus naturelle (pauses, suppression de symboles parasites).
 * N'affecte JAMAIS le texte affiche ni sauvegarde.
 */
export function cleanForSpeech(text: string): string {
  return text
    // Caracteres XML/SSML qui peuvent faire echouer Edge TTS (audio vide).
    .replace(/&/g, ' et ')
    // Symboles de mise en forme parasites
    .replace(/[*_#`<>|]/g, ' ')
    // Tirets longs / cadratins -> pause
    .replace(/\s*[—–]\s*/g, ', ')
    // Guillemets lus de maniere bizarre
    .replace(/[«»“”„]/g, ' ')
    // Puces de liste
    .replace(/^\s*[-•·]\s+/gm, '')
    // Sauts de ligne -> pause de phrase
    .replace(/\s*\n+\s*/g, '. ')
    // "/" -> " ou "
    .replace(/\s*\/\s*/g, ' ou ')
    // Espaces multiples
    .replace(/\s{2,}/g, ' ')
    // Ponctuation redondante
    .replace(/\.\s*\./g, '.')
    .trim();
}

/** Decoupe un paragraphe en phrases (pour l'affichage progressif). */
export function splitSentences(text: string): string[] {
  const parts = text
    .replace(/\s*\n+\s*/g, ' ')
    .split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ«"])/u);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

// ----------------------------------------------------------------------------
// Mode "Trou" (cloze) : masquage de mots importants pour le rappel actif.
// ----------------------------------------------------------------------------

export interface ClozeSegment {
  text: string;
  masked: boolean;
}

export interface ClozeOptions {
  /** Termes a masquer en priorite (procedes litteraires, notions...). */
  keywords?: string[];
  /** Masquer les mots a l'interieur des citations (« ... »). */
  maskQuotes?: boolean;
  /** Masquer les connecteurs logiques. */
  maskConnectors?: boolean;
  /** Intensite 0..1 : proportion de mots "longs" masques en plus. */
  intensity?: number;
}

/** Connecteurs logiques frequents dans une analyse litteraire. */
const CONNECTORS = new Set<string>([
  'donc', 'ainsi', 'cependant', 'neanmoins', 'toutefois', 'pourtant', 'mais',
  'car', 'puisque', 'ensuite', 'puis', 'enfin', 'egalement', 'notamment',
  'surtout', 'tandis', 'lorsque', 'malgre', 'afin', 'contraire', 'revanche',
  'effet', 'consequent', 'premierement', 'deuxiemement', 'troisiemement',
  'abord', 'or', 'comme', 'alors', 'finalement', 'dabord',
]);

/** Retire les accents pour comparer un mot a la liste des connecteurs. */
function deaccent(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

/**
 * Construit la version "a trous" d'un texte.
 * Retourne des segments (mot par mot + separateurs) avec un drapeau `masked`.
 * Le texte source n'est jamais modifie : on ne fait que decider quoi cacher.
 */
export function buildCloze(text: string, options: ClozeOptions = {}): ClozeSegment[] {
  const { keywords = [], maskQuotes = true, maskConnectors = true, intensity = 0.3 } = options;

  const keywordSet = new Set(keywords.map((k) => deaccent(k)).filter(Boolean));

  // Reperage des plages de citations a masquer.
  const quoteRanges: Array<[number, number]> = [];
  if (maskQuotes) {
    const re = /[«"“]([^«»"”]{1,80})[»"”]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      quoteRanges.push([m.index, m.index + m[0].length]);
    }
  }
  const inQuote = (pos: number) => quoteRanges.some(([s, e]) => pos >= s && pos < e);

  // Decoupage en segments (mots vs separateurs), en conservant les positions.
  const segments: ClozeSegment[] = [];
  const tokenRe = /(\p{L}[\p{L}\u00C0-\u024F'’-]*)|([^\p{L}]+)/gu;
  let match: RegExpExecArray | null;
  let longWordCounter = 0;

  while ((match = tokenRe.exec(text)) !== null) {
    const word = match[1];
    if (!word) {
      segments.push({ text: match[0], masked: false });
      continue;
    }
    const pos = match.index;
    const norm = deaccent(word);
    let masked = false;

    if (maskConnectors && CONNECTORS.has(norm)) masked = true;
    else if (keywordSet.size > 0 && keywordSet.has(norm)) masked = true;
    else if (maskQuotes && inQuote(pos)) masked = true;
    else if (word.length >= 5) {
      // Masque une fraction des mots "longs" pour densifier les trous.
      longWordCounter += 1;
      const step = Math.max(2, Math.round(1 / Math.max(0.05, intensity)));
      if (longWordCounter % step === 0) masked = true;
    }

    segments.push({ text: word, masked });
  }

  return segments;
}
