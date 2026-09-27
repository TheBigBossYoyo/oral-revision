// ============================================================================
// revisionStore.ts - Progression des sections Grammaire et Oeuvre (persiste)
// ----------------------------------------------------------------------------
// Stockage local et autonome, separe du store des oraux pour ne pas alourdir la
// sauvegarde JSON des analyses. Conserve :
//   - le meilleur score obtenu a chaque quiz de grammaire (par chapitre) ;
//   - le statut de chaque question d'entretien sur l'oeuvre (a revoir / acquise) ;
//   - le texte de la presentation orale de l'oeuvre (a memoriser).
// Tout est sauvegarde dans localStorage sous une cle dediee.
// ============================================================================

import { create } from 'zustand';

const STORAGE_KEY = 'oral-revision:revision:v1';

/** Statut d'une question d'entretien (oeuvre). Absent = jamais travaillee. */
export type QuestionStatus = 'review' | 'mastered';

interface RevisionPersisted {
  /** chapitreId -> meilleur score en pourcentage (0..100). */
  quizBest: Record<string, number>;
  /** questionId -> statut. */
  questionStatus: Record<string, QuestionStatus>;
  /** Texte de la presentation orale de l'oeuvre, a memoriser (colle par l'eleve). */
  presentationText: string;
}

interface RevisionStore extends RevisionPersisted {
  /** Enregistre un score de quiz s'il ameliore le meilleur du chapitre. */
  recordQuizScore: (chapterId: string, percent: number) => void;
  /** Definit (ou retire si null) le statut d'une question d'oeuvre. */
  setQuestionStatus: (questionId: string, status: QuestionStatus | null) => void;
  /** Reinitialise toute la progression de l'entretien sur l'oeuvre. */
  resetQuestionStatuses: () => void;
  /** Remplace le texte de la presentation a memoriser. */
  setPresentationText: (text: string) => void;
}

function loadPersisted(): RevisionPersisted {
  const empty: RevisionPersisted = { quizBest: {}, questionStatus: {}, presentationText: '' };
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<RevisionPersisted>;
    return {
      quizBest: parsed.quizBest ?? {},
      questionStatus: parsed.questionStatus ?? {},
      presentationText: typeof parsed.presentationText === 'string' ? parsed.presentationText : '',
    };
  } catch {
    return empty;
  }
}

function savePersisted(state: RevisionPersisted): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        quizBest: state.quizBest,
        questionStatus: state.questionStatus,
        presentationText: state.presentationText,
      }),
    );
  } catch {
    /* quota depasse : on ignore silencieusement (progression non critique). */
  }
}

export const useRevisionStore = create<RevisionStore>((set) => ({
  ...loadPersisted(),

  recordQuizScore: (chapterId, percent) =>
    set((s) => {
      const best = s.quizBest[chapterId] ?? 0;
      if (percent <= best) return s;
      return { quizBest: { ...s.quizBest, [chapterId]: percent } };
    }),

  setQuestionStatus: (questionId, status) =>
    set((s) => {
      const next = { ...s.questionStatus };
      if (status === null) delete next[questionId];
      else next[questionId] = status;
      return { questionStatus: next };
    }),

  resetQuestionStatuses: () => set({ questionStatus: {} }),

  setPresentationText: (text) => set({ presentationText: text }),
}));

// Persistance automatique a chaque changement.
useRevisionStore.subscribe((state) =>
  savePersisted({
    quizBest: state.quizBest,
    questionStatus: state.questionStatus,
    presentationText: state.presentationText,
  }),
);
