// ============================================================================
// types.ts - Modele de donnees central de l'application
// ----------------------------------------------------------------------------
// IMPORTANT : ce fichier est le "contrat" partage par tout le code (frontend
// ET backend). Le texte des paragraphes (`Paragraph.text`) doit TOUJOURS rester
// exactement celui que l'utilisateur a colle : aucune reformulation n'est jamais
// appliquee a ce champ.
// ============================================================================

/** Type de section detecte (par Gemini ou par le decoupage local de secours). */
export type DetectedType =
  | 'title'
  | 'introduction'
  | 'lecture'
  | 'analyse'
  | 'movement'
  | 'conclusion'
  | 'other';

/** Mode de memorisation d'une section. */
export type MemorizationMode = 'memorize' | 'readOnly' | 'ignored';

/** Mode utilise lors d'une revision (sert a l'historique). */
export type ReviewMode = 'visual' | 'audio' | 'recitation' | 'exam';

/** Une entree de l'historique de revision d'un paragraphe. */
export interface ReviewHistoryEntry {
  /** Date ISO de la revision. */
  date: string;
  /** Score avant la revision (0..5). */
  previousScore: number;
  /** Score apres la revision (0..5). */
  newScore: number;
  /** Mode d'entrainement utilise. */
  mode: ReviewMode;
}

/**
 * Un paragraphe : la plus petite unite d'apprentissage.
 * `text` est TOUJOURS une portion exacte du texte original de l'utilisateur.
 */
export interface Paragraph {
  id: string;
  oralId: string;
  sectionId: string;
  /** Texte EXACT colle par l'utilisateur (jamais reformule). */
  text: string;
  /** Position dans la section (1-based). */
  order: number;
  /** Score de maitrise de 0 (inconnu) a 5 (maitrise). */
  masteryScore: number;
  /** Historique complet des revisions. */
  reviewHistory: ReviewHistoryEntry[];
  /** Date ISO de la prochaine revision, ou null si jamais planifie/jamais vu. */
  nextReviewDate: string | null;
  /** Difficulte ressentie 1 (facile) .. 5 (difficile). Defaut 3. */
  difficulty: number;
  /** Temps estime de memorisation en minutes. */
  estimatedMinutes: number;
  /** Citations EXACTES extraites du texte (jamais inventees). */
  quotes: string[];
  /** Procedes litteraires repere dans ce paragraphe. */
  literaryDevices: string[];
  /**
   * Point de depart de la lecture audio en boucle : index (0-based) de la
   * premiere PHRASE lue, au sens de `splitSentences(text)`. Absent ou 0 = lire
   * depuis le debut (comportement par defaut). Permet de reprendre l'audio plus
   * loin une fois le debut memorise. N'affecte JAMAIS le texte affiche ou
   * sauvegarde.
   */
  audioStartIndex?: number;
  /**
   * Point de fin de la lecture audio en boucle : index (0-based) de la DERNIERE
   * phrase lue (incluse), au sens de `splitSentences(text)`. Absent = lire
   * jusqu'a la derniere phrase (comportement par defaut). Combine a
   * `audioStartIndex`, il definit la plage [debut, fin] jouee en boucle. Permet
   * d'isoler un passage precis. N'affecte JAMAIS le texte affiche ou sauvegarde.
   */
  audioEndIndex?: number;
}

/** Une section de l'oral (introduction, mouvement, conclusion, etc.). */
export interface Section {
  id: string;
  /** Titre EXACT ecrit par l'utilisateur (ex : "Mvt 1 - Le quiproquo aveugle"). */
  originalHeading: string;
  detectedType: DetectedType;
  /** Numero du mouvement si detectedType === 'movement'. */
  movementNumber?: number;
  memorizationMode: MemorizationMode;
  /** Score de confiance de la detection (0..1). */
  confidence: number;
  paragraphs: Paragraph[];
}

/** Un oral complet (une analyse lineaire). */
export interface Oral {
  id: string;
  /** Titre affiche (= rawTitle, conserve tel quel). */
  title: string;
  /** Titre brut detecte, conserve exactement. */
  rawTitle?: string;
  /** Texte brut original colle par l'utilisateur (source de verite). */
  rawText: string;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
  /** Maitrise globale 0..1 (moyenne ponderee des paragraphes a memoriser). */
  globalMastery: number;
  /** Prochaine date de revision de l'oral (la plus proche de ses paragraphes). */
  nextReviewDate: string | null;
}

// ----------------------------------------------------------------------------
// Resultat d'analyse (Gemini ou fallback) - structure AVANT enrichissement
// (avant ajout des IDs, scores, dates de revision...).
// ----------------------------------------------------------------------------

export interface ParsedParagraph {
  id?: string;
  text: string;
  order: number;
  quotes?: string[];
  literaryDevices?: string[];
}

export interface ParsedSection {
  id?: string;
  originalHeading: string;
  detectedType: DetectedType;
  movementNumber?: number;
  memorizationMode: MemorizationMode;
  confidence: number;
  paragraphs: ParsedParagraph[];
}

export interface ParsedOral {
  title: string;
  rawTitle?: string;
  sections: ParsedSection[];
}

/** Niveau de gravite d'un avertissement d'analyse. */
export type WarningLevel = 'info' | 'warning' | 'error';

/** Avertissement produit par la validation anti-reformulation. */
export interface ParseWarning {
  level: WarningLevel;
  code:
    | 'fallback_used'
    | 'invalid_json'
    | 'paragraph_not_found'
    | 'heading_not_found'
    | 'empty_result'
    | 'backend_unreachable'
    | 'high_mismatch';
  message: string;
  sectionId?: string;
  paragraphId?: string;
  /** Extrait concerne (pour affichage). */
  excerpt?: string;
}

/** Reponse complete renvoyee par le backend /api/parse-oral (ou le fallback). */
export interface ParseResult {
  ok: boolean;
  /** Origine de l'analyse : Gemini ou decoupage local de secours. */
  source: 'gemini' | 'fallback';
  /** Texte brut original (renvoye tel quel). */
  rawText: string;
  oral: ParsedOral;
  warnings: ParseWarning[];
}

// ----------------------------------------------------------------------------
// Reglages de l'application
// ----------------------------------------------------------------------------

export interface AudioSettings {
  /**
   * Utiliser la voix humaine "Edge TTS" (via le backend) plutot que la synthese
   * vocale du navigateur. Repli AUTOMATIQUE sur la voix du navigateur si le
   * backend est injoignable ou si l'appareil est hors-ligne.
   */
  useHumanVoice: boolean;
  /** Voix Edge TTS utilisee quand `useHumanVoice` est actif (ShortName Microsoft). */
  edgeVoice: string;
  /** URI de la voix Web Speech choisie (null = voix par defaut du navigateur). */
  voiceURI: string | null;
  /** Vitesse de lecture : 0.75 | 1 | 1.15 | 1.25 (ou autre). */
  rate: number;
  /** Volume 0..1. */
  volume: number;
  /** Hauteur 0..2 (defaut 1). */
  pitch: number;
  /** Langue, par defaut "fr-FR". */
  lang: string;
  /** Pause (ms) inseree entre deux boucles audio. */
  loopPauseMs: number;
}

export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  audio: AudioSettings;
  /** Date de l'examen au format ISO (YYYY-MM-DD). */
  examDate: string;
  /** Objectif minimal de paragraphes nouveaux par jour. */
  dailyNewTarget: number;
}

/** Suivi du streak quotidien. */
export interface StreakState {
  count: number;
  /** Derniere date (YYYY-MM-DD) ou l'utilisateur a etudie. */
  lastStudyDate: string | null;
  /** Meilleur streak atteint. */
  best: number;
}

// ----------------------------------------------------------------------------
// Statistiques agregees (pour le dashboard)
// ----------------------------------------------------------------------------

export interface GlobalStats {
  daysLeft: number;
  totalOrals: number;
  totalParagraphs: number;
  learnableParagraphs: number;
  masteredParagraphs: number;
  weakParagraphs: number;
  neverSeenParagraphs: number;
  dueToday: number;
  globalProgress: number; // 0..1
  estimatedMinutesToday: number;
  /** Repartition par score : index 0..5 -> nombre de paragraphes. */
  masteryDistribution: number[];
  /** Retard (positif) ou avance (negatif) en nombre de paragraphes. */
  scheduleDelta: number;
}

// ----------------------------------------------------------------------------
// Plan de session du jour
// ----------------------------------------------------------------------------

/** Un item de session = un paragraphe a travailler aujourd'hui + son contexte. */
export interface SessionItem {
  paragraph: Paragraph;
  section: Section;
  oral: Oral;
  /** Raison de la selection (affichage). */
  reason: 'new' | 'overdue' | 'weak' | 'due' | 'reinforce';
}

export interface DailySession {
  date: string;
  items: SessionItem[];
  totalEstimatedMinutes: number;
  oralsConcerned: string[];
}

/** Format du fichier d'export/sauvegarde JSON. */
export interface BackupFile {
  app: 'oral-revision';
  version: number;
  exportedAt: string;
  orals: Oral[];
  settings: AppSettings;
  streak: StreakState;
}
