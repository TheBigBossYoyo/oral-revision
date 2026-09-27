// ============================================================================
// audio/edgeVoices.ts - Catalogue des voix neuronales francaises (Edge TTS)
// ----------------------------------------------------------------------------
// Liste PARTAGEE entre le frontend (selecteur de voix dans les reglages) et le
// backend (validation de la voix demandee avant synthese). Ce module ne depend
// d'AUCUNE API navigateur ni Node : il peut donc etre importe des deux cotes
// (cote client comme cote serveur) sans risque.
//
// Les voix "Edge TTS" sont les voix neuronales de Microsoft, gratuites et SANS
// cle API. Elles offrent un rendu beaucoup plus humain que la synthese vocale
// integree au navigateur (Web Speech API).
// ============================================================================

export interface EdgeVoice {
  /** ShortName Microsoft, ex : "fr-FR-DeniseNeural" (identifiant a envoyer). */
  shortName: string;
  /** Libelle lisible affiche dans le selecteur de voix. */
  label: string;
  /** Locale de la voix (fr-FR, fr-CA, fr-BE, fr-CH). */
  locale: string;
  /** Genre de la voix. */
  gender: 'Female' | 'Male';
}

/**
 * Voix francaises neuronales disponibles via Edge TTS.
 * Sous-ensemble stable et verifie : la liste complete de Microsoft est plus
 * large, mais toutes les voix ne sont pas garanties dans le temps.
 */
export const EDGE_FR_VOICES: EdgeVoice[] = [
  { shortName: 'fr-FR-DeniseNeural', label: 'Denise (France, femme)', locale: 'fr-FR', gender: 'Female' },
  { shortName: 'fr-FR-EloiseNeural', label: 'Eloise (France, femme)', locale: 'fr-FR', gender: 'Female' },
  { shortName: 'fr-FR-HenriNeural', label: 'Henri (France, homme)', locale: 'fr-FR', gender: 'Male' },
  { shortName: 'fr-FR-VivienneMultilingualNeural', label: 'Vivienne (France, femme, multilingue)', locale: 'fr-FR', gender: 'Female' },
  { shortName: 'fr-FR-RemyMultilingualNeural', label: 'Remy (France, homme, multilingue)', locale: 'fr-FR', gender: 'Male' },
  { shortName: 'fr-CA-SylvieNeural', label: 'Sylvie (Canada, femme)', locale: 'fr-CA', gender: 'Female' },
  { shortName: 'fr-CA-AntoineNeural', label: 'Antoine (Canada, homme)', locale: 'fr-CA', gender: 'Male' },
  { shortName: 'fr-CA-ThierryNeural', label: 'Thierry (Canada, homme)', locale: 'fr-CA', gender: 'Male' },
  { shortName: 'fr-BE-CharlineNeural', label: 'Charline (Belgique, femme)', locale: 'fr-BE', gender: 'Female' },
  { shortName: 'fr-BE-GerardNeural', label: 'Gerard (Belgique, homme)', locale: 'fr-BE', gender: 'Male' },
  { shortName: 'fr-CH-ArianeNeural', label: 'Ariane (Suisse, femme)', locale: 'fr-CH', gender: 'Female' },
  { shortName: 'fr-CH-FabriceNeural', label: 'Fabrice (Suisse, homme)', locale: 'fr-CH', gender: 'Male' },
];

/** Voix par defaut (France, feminine, tres naturelle). */
export const DEFAULT_EDGE_VOICE = 'fr-FR-DeniseNeural';

/** Verifie qu'un identifiant de voix fait partie du catalogue connu. */
export function isKnownEdgeVoice(shortName: string): boolean {
  return EDGE_FR_VOICES.some((v) => v.shortName === shortName);
}

/** Retourne une voix valide : celle demandee si connue, sinon la voix par defaut. */
export function resolveEdgeVoice(shortName: string | null | undefined): string {
  return shortName && isKnownEdgeVoice(shortName) ? shortName : DEFAULT_EDGE_VOICE;
}
