// ============================================================================
// scheduleAlgorithm.ts - Repetition espacee + planning jusqu'a l'examen
// ----------------------------------------------------------------------------
// Modele : chaque paragraphe a un `masteryScore` de 0 a 5. Apres chaque revision
// on recalcule sa prochaine date. Les intervalles se COMPRESSENT a l'approche de
// l'examen (la charge augmente automatiquement). On priorise les paragraphes
// faibles et jamais vus, en alternant les oraux et les sections.
// ============================================================================

import type {
  AppSettings,
  DailySession,
  GlobalStats,
  Oral,
  Paragraph,
  ReviewMode,
  Section,
  SessionItem,
} from './types';

// ----------------------------------------------------------------------------
// Dates (travail en 'YYYY-MM-DD', comparable lexicographiquement)
// ----------------------------------------------------------------------------

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return ymd(new Date());
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

/** Nombre de jours de `from` (inclus) jusqu'a `to`. Negatif si `to` est passe. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000);
}

/** Jours restants avant l'examen (>= 0). */
export function daysUntilExam(examDate: string, from: string = todayISO()): number {
  return Math.max(0, daysBetween(from, examDate));
}

export function formatFrenchDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// ----------------------------------------------------------------------------
// Bareme de maitrise
// ----------------------------------------------------------------------------

/** Intervalle "ideal" (en jours) par score, hors compression d'examen. */
export const BASE_INTERVALS: Record<number, number> = {
  0: 1, // inconnu : revu en session + des demain
  1: 1, // tres faible : demain
  2: 2, // fragile : dans 2 jours
  3: 4, // correct : dans 3-4 jours
  4: 6, // presque maitrise : dans 5-6 jours
  5: 14, // maitrise : derniere revision avant l'examen
};

export interface ScoreInfo {
  score: number;
  label: string;
  description: string;
}

export const SCORE_INFO: ScoreInfo[] = [
  { score: 0, label: 'Inconnu', description: 'A revoir aujourd\'hui et demain' },
  { score: 1, label: 'Tres faible', description: 'A revoir demain' },
  { score: 2, label: 'Fragile', description: 'A revoir dans 2 jours' },
  { score: 3, label: 'Correct', description: 'A revoir dans 3-4 jours' },
  { score: 4, label: 'Presque acquis', description: 'A revoir dans 5-6 jours' },
  { score: 5, label: 'Maitrise', description: 'Une derniere revision avant l\'examen' },
];

export function scoreLabel(score: number): string {
  return SCORE_INFO[Math.max(0, Math.min(5, score))]?.label ?? '';
}

/**
 * Calcule la prochaine date de revision.
 * L'intervalle est compresse si l'examen approche : interval reel =
 * min(intervalIdeal, max(1, floor(joursRestants / 2))). Ainsi un paragraphe
 * "maitrise" est tout de meme revu avant le 26 juin, et la frequence augmente
 * mecaniquement dans la derniere ligne droite.
 */
export function computeNextReview(
  score: number,
  examDate: string,
  from: string = todayISO(),
): string {
  const s = Math.max(0, Math.min(5, Math.round(score)));
  const daysLeft = daysBetween(from, examDate);

  // Examen passe (ou aujourd'hui) : on revoit encore le lendemain par defaut.
  if (daysLeft <= 0) return addDays(from, 1);

  const ideal = BASE_INTERVALS[s];
  const compressed = Math.min(ideal, Math.max(1, Math.floor(daysLeft / 2)));
  let next = addDays(from, compressed);

  // Ne jamais planifier apres l'examen : on revoit au plus tard la veille.
  if (daysBetween(next, examDate) < 0) {
    next = examDate;
  }
  return next;
}

// ----------------------------------------------------------------------------
// Predicats
// ----------------------------------------------------------------------------

export function isLearnable(section: Section): boolean {
  return section.memorizationMode === 'memorize';
}

export function isDue(p: Paragraph, today: string = todayISO()): boolean {
  return p.nextReviewDate === null || p.nextReviewDate <= today;
}

export function isWeak(p: Paragraph): boolean {
  return p.masteryScore <= 2;
}

export function isMastered(p: Paragraph): boolean {
  return p.masteryScore >= 5;
}

export function isNeverSeen(p: Paragraph): boolean {
  return p.reviewHistory.length === 0;
}

// ----------------------------------------------------------------------------
// Collecte
// ----------------------------------------------------------------------------

export interface ParagraphContext {
  paragraph: Paragraph;
  section: Section;
  oral: Oral;
}

/** Tous les paragraphes a memoriser (sections en mode "memorize"). */
export function collectLearnable(orals: Oral[]): ParagraphContext[] {
  const out: ParagraphContext[] = [];
  for (const oral of orals) {
    for (const section of oral.sections) {
      if (!isLearnable(section)) continue;
      for (const paragraph of section.paragraphs) {
        out.push({ paragraph, section, oral });
      }
    }
  }
  return out;
}

/** Paragraphes en lecture seule (pour le mode lecture). */
export function collectReadOnly(orals: Oral[]): ParagraphContext[] {
  const out: ParagraphContext[] = [];
  for (const oral of orals) {
    for (const section of oral.sections) {
      if (section.memorizationMode !== 'readOnly') continue;
      for (const paragraph of section.paragraphs) {
        out.push({ paragraph, section, oral });
      }
    }
  }
  return out;
}

// ----------------------------------------------------------------------------
// Application d'une note + agregats
// ----------------------------------------------------------------------------

/**
 * Applique une note a un paragraphe : met a jour le score, l'historique, la
 * difficulte et la prochaine date de revision. Retourne un NOUVEAU paragraphe
 * (immutable). Ne touche jamais au champ `text`.
 */
export function applyGrade(
  paragraph: Paragraph,
  newScore: number,
  mode: ReviewMode,
  examDate: string,
  from: string = todayISO(),
): Paragraph {
  const clamped = Math.max(0, Math.min(5, Math.round(newScore)));
  const previousScore = paragraph.masteryScore;

  let difficulty = paragraph.difficulty;
  if (clamped <= 1) difficulty = Math.min(5, difficulty + 1);
  else if (clamped >= 4) difficulty = Math.max(1, difficulty - 1);

  return {
    ...paragraph,
    masteryScore: clamped,
    difficulty,
    nextReviewDate: computeNextReview(clamped, examDate, from),
    reviewHistory: [
      ...paragraph.reviewHistory,
      { date: new Date().toISOString(), previousScore, newScore: clamped, mode },
    ],
  };
}

/** Maitrise globale d'un oral (0..1), moyenne des scores/5 des paragraphes a memoriser. */
export function computeGlobalMastery(oral: Oral): number {
  const learnable = oral.sections
    .filter(isLearnable)
    .flatMap((s) => s.paragraphs);
  if (learnable.length === 0) return 0;
  const sum = learnable.reduce((acc, p) => acc + p.masteryScore, 0);
  return sum / (5 * learnable.length);
}

/** Prochaine revision d'un oral = date la plus proche parmi ses paragraphes. */
export function computeOralNextReview(oral: Oral): string | null {
  const dates = oral.sections
    .filter(isLearnable)
    .flatMap((s) => s.paragraphs)
    .map((p) => p.nextReviewDate)
    .filter((d): d is string => d !== null);
  if (dates.length === 0) return null;
  return dates.sort()[0];
}

/** Recalcule les agregats d'un oral (maitrise globale + prochaine revision). */
export function recomputeOralAggregates(oral: Oral): Oral {
  return {
    ...oral,
    globalMastery: computeGlobalMastery(oral),
    nextReviewDate: computeOralNextReview(oral),
    updatedAt: new Date().toISOString(),
  };
}

// ----------------------------------------------------------------------------
// Statistiques globales (dashboard)
// ----------------------------------------------------------------------------

export function getGlobalStats(
  orals: Oral[],
  settings: AppSettings,
  today: string = todayISO(),
): GlobalStats {
  const learnable = collectLearnable(orals);
  const totalParagraphs = orals.reduce(
    (acc, o) => acc + o.sections.reduce((a, s) => a + s.paragraphs.length, 0),
    0,
  );

  const masteryDistribution = [0, 0, 0, 0, 0, 0];
  let masteredParagraphs = 0;
  let weakParagraphs = 0;
  let neverSeenParagraphs = 0;
  let dueToday = 0;
  let estimatedMinutesToday = 0;
  let scoreSum = 0;

  for (const { paragraph: p } of learnable) {
    masteryDistribution[Math.max(0, Math.min(5, p.masteryScore))] += 1;
    scoreSum += p.masteryScore;
    if (isMastered(p)) masteredParagraphs += 1;
    if (isWeak(p)) weakParagraphs += 1;
    if (isNeverSeen(p)) neverSeenParagraphs += 1;
    if (isDue(p, today)) {
      dueToday += 1;
      estimatedMinutesToday += p.estimatedMinutes;
    }
  }

  const learnableCount = learnable.length;
  const globalProgress = learnableCount === 0 ? 0 : scoreSum / (5 * learnableCount);

  // Retard / avance : on compare le nombre de paragraphes "presque acquis" (>=4)
  // a l'objectif lineaire attendu compte tenu du temps ecoule.
  const startDates = orals.map((o) => o.createdAt.slice(0, 10)).sort();
  const start = startDates[0] ?? today;
  const totalSpan = Math.max(1, daysBetween(start, settings.examDate));
  const elapsed = Math.max(0, Math.min(totalSpan, daysBetween(start, today)));
  const expectedMastered = Math.round(learnableCount * (elapsed / totalSpan));
  const effectiveMastered = learnable.filter((c) => c.paragraph.masteryScore >= 4).length;
  const scheduleDelta = expectedMastered - effectiveMastered; // > 0 => en retard

  return {
    daysLeft: daysUntilExam(settings.examDate, today),
    totalOrals: orals.length,
    totalParagraphs,
    learnableParagraphs: learnableCount,
    masteredParagraphs,
    weakParagraphs,
    neverSeenParagraphs,
    dueToday,
    globalProgress,
    estimatedMinutesToday: Math.round(estimatedMinutesToday),
    masteryDistribution,
    scheduleDelta,
  };
}

// ----------------------------------------------------------------------------
// Construction de la session du jour
// ----------------------------------------------------------------------------

function reasonFor(p: Paragraph, today: string): SessionItem['reason'] {
  if (isNeverSeen(p)) return 'new';
  if (p.nextReviewDate !== null && p.nextReviewDate < today) return 'overdue';
  if (isWeak(p)) return 'weak';
  return 'due';
}

/** Repartit une liste en alternant les oraux (round-robin), priorite preservee. */
function interleaveByOral(items: SessionItem[]): SessionItem[] {
  const buckets = new Map<string, SessionItem[]>();
  for (const item of items) {
    const key = item.oral.id;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(item);
  }
  const queues = [...buckets.values()];
  const out: SessionItem[] = [];
  let remaining = items.length;
  while (remaining > 0) {
    for (const q of queues) {
      const next = q.shift();
      if (next) {
        out.push(next);
        remaining -= 1;
      }
    }
  }
  return out;
}

/**
 * Construit la session du jour :
 *  1. Tous les paragraphes "dus" (en retard / faibles d'abord).
 *  2. Un quota de paragraphes jamais vus, calcule pour tout couvrir avant l'examen
 *     (le quota augmente quand la date limite approche).
 *  3. Les revisions alternent les oraux ; les nouveautes restent dans l'ordre du
 *     texte (un oral appris pour la premiere fois l'est paragraphe apres paragraphe).
 */
export function buildDailySession(
  orals: Oral[],
  settings: AppSettings,
  today: string = todayISO(),
): DailySession {
  const learnable = collectLearnable(orals);

  const neverSeen = learnable.filter((c) => isNeverSeen(c.paragraph));
  const scheduledDue = learnable.filter(
    (c) => !isNeverSeen(c.paragraph) && isDue(c.paragraph, today),
  );

  // Quota de nouveautes : assez pour tout couvrir d'ici l'examen.
  const daysLeft = Math.max(1, daysUntilExam(settings.examDate, today));
  const coverageNeed = Math.ceil(neverSeen.length / daysLeft);
  const newQuota = Math.min(
    neverSeen.length,
    Math.max(settings.dailyNewTarget, coverageNeed),
  );

  // Tri des "dus" : score croissant (faibles d'abord), puis plus en retard d'abord.
  const dueSorted = [...scheduledDue].sort((a, b) => {
    if (a.paragraph.masteryScore !== b.paragraph.masteryScore) {
      return a.paragraph.masteryScore - b.paragraph.masteryScore;
    }
    const ad = a.paragraph.nextReviewDate ?? '9999';
    const bd = b.paragraph.nextReviewDate ?? '9999';
    return ad.localeCompare(bd);
  });

  // Nouveautes : on respecte l'ordre naturel (oral -> section -> paragraphe).
  const newSelected = neverSeen.slice(0, newQuota);

  const toItem = (c: ParagraphContext): SessionItem => ({
    paragraph: c.paragraph,
    section: c.section,
    oral: c.oral,
    reason: reasonFor(c.paragraph, today),
  });

  // Revisions : on alterne les oraux pour ne pas enchainer le meme texte.
  const dueItems = interleaveByOral(dueSorted.map(toItem));
  // Premier apprentissage : ordre STRICT du document (pas d'alternance) afin
  // d'apprendre chaque oral paragraphe apres paragraphe, dans l'ordre.
  const newItems = newSelected.map(toItem);
  const items = [...dueItems, ...newItems];

  const totalEstimatedMinutes = Math.round(
    items.reduce((acc, it) => acc + it.paragraph.estimatedMinutes, 0),
  );
  const oralsConcerned = [...new Set(items.map((it) => it.oral.title))];

  return { date: today, items, totalEstimatedMinutes, oralsConcerned };
}
