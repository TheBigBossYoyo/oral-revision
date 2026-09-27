// ============================================================================
// store.ts - Etat global (Zustand) + persistance automatique
// ----------------------------------------------------------------------------
// Source de verite de l'application. Toute modification est immediatement
// sauvegardee dans localStorage via storage.ts. Le texte des paragraphes n'est
// jamais reformule par le code : seules les editions explicites de l'utilisateur
// le modifient.
// ============================================================================

import { create } from 'zustand';
import type {
  AudioSettings,
  DetectedType,
  Oral,
  Paragraph,
  ParsedOral,
  ReviewMode,
  Section,
  StreakState,
  ThemeMode,
} from './types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_STREAK,
  exportBackup,
  loadPersisted,
  savePersisted,
  type PersistedState,
} from './storage';
import {
  applyGrade,
  recomputeOralAggregates,
  todayISO,
  addDays,
} from './scheduleAlgorithm';
import {
  buildOralFromParsed,
  createParagraph,
  reindexOral,
  newId,
} from './utils/oralFactory';
import { estimateMinutes } from './utils/textProcessing';
import { createSampleOral } from './data/sampleOral';

interface OralStore extends PersistedState {
  hydrated: boolean;

  // --- Oraux ---
  addOralFromParsed: (parsed: ParsedOral, rawText: string) => string;
  addOral: (oral: Oral) => void;
  replaceOral: (oral: Oral) => void;
  deleteOral: (oralId: string) => void;
  getOral: (oralId: string) => Oral | undefined;

  // --- Sections ---
  updateSection: (
    oralId: string,
    sectionId: string,
    patch: Partial<Pick<Section, 'originalHeading' | 'detectedType' | 'memorizationMode' | 'movementNumber'>>,
  ) => void;
  deleteSection: (oralId: string, sectionId: string) => void;
  addSection: (oralId: string, detectedType: DetectedType) => void;

  // --- Paragraphes ---
  gradeParagraph: (oralId: string, paragraphId: string, newScore: number, mode: ReviewMode) => void;
  updateParagraphText: (oralId: string, sectionId: string, paragraphId: string, text: string) => void;
  splitParagraph: (oralId: string, sectionId: string, paragraphId: string, offset: number) => void;
  mergeWithNext: (oralId: string, sectionId: string, paragraphId: string) => void;
  moveParagraph: (oralId: string, paragraphId: string, toSectionId: string, toIndex?: number) => void;
  /**
   * Definit la plage de phrases lues en boucle pour l'audio.
   * `startIndex` (undefined ou 0) = depuis le debut ; `endIndex` (undefined) =
   * jusqu'a la derniere phrase. Simple reglage de confort : ne touche pas au
   * contenu appris ni aux agregats.
   */
  setParagraphAudioRange: (
    oralId: string,
    sectionId: string,
    paragraphId: string,
    startIndex: number | undefined,
    endIndex: number | undefined,
  ) => void;

  // --- Reglages ---
  setTheme: (theme: ThemeMode) => void;
  setExamDate: (date: string) => void;
  setDailyNewTarget: (n: number) => void;
  setAudioSettings: (patch: Partial<AudioSettings>) => void;

  // --- Sauvegarde ---
  exportData: () => string;
  importBackup: (state: PersistedState) => void;
  resetAll: () => void;
  loadSample: () => void;
}

// ---------------------------------------------------------------------------
// Helpers immutables
// ---------------------------------------------------------------------------

/** Applique une transformation a un oral identifie, puis recalcule ses agregats. */
function withOral(orals: Oral[], oralId: string, fn: (oral: Oral) => Oral): Oral[] {
  return orals.map((o) => (o.id === oralId ? recomputeOralAggregates(fn(o)) : o));
}

function mapSection(oral: Oral, sectionId: string, fn: (s: Section) => Section): Oral {
  return { ...oral, sections: oral.sections.map((s) => (s.id === sectionId ? fn(s) : s)) };
}

function mapParagraph(section: Section, paragraphId: string, fn: (p: Paragraph) => Paragraph): Section {
  return { ...section, paragraphs: section.paragraphs.map((p) => (p.id === paragraphId ? fn(p) : p)) };
}

/** Met a jour le streak quotidien en fonction de la derniere date d'etude. */
function bumpStreak(streak: StreakState): StreakState {
  const today = todayISO();
  if (streak.lastStudyDate === today) return streak;
  const yesterday = addDays(today, -1);
  const count = streak.lastStudyDate === yesterday ? streak.count + 1 : 1;
  return { count, lastStudyDate: today, best: Math.max(streak.best, count) };
}

// ---------------------------------------------------------------------------
// Etat initial (hydrate depuis localStorage, sinon oral d'exemple)
// ---------------------------------------------------------------------------

function initialState(): PersistedState {
  const persisted = loadPersisted();
  if (persisted) return persisted;
  // Premier lancement : on precharge l'oral d'exemple pour tester l'app.
  return { orals: [createSampleOral()], settings: DEFAULT_SETTINGS, streak: DEFAULT_STREAK };
}

export const useStore = create<OralStore>((set, get) => ({
  ...initialState(),
  hydrated: true,

  // ----- Oraux -----
  addOralFromParsed: (parsed, rawText) => {
    const oral = buildOralFromParsed(parsed, rawText);
    set((s) => ({ orals: [...s.orals, oral] }));
    return oral.id;
  },

  addOral: (oral) => set((s) => ({ orals: [...s.orals, oral] })),

  replaceOral: (oral) =>
    set((s) => ({
      orals: s.orals.map((o) => (o.id === oral.id ? recomputeOralAggregates(reindexOral(oral)) : o)),
    })),

  deleteOral: (oralId) => set((s) => ({ orals: s.orals.filter((o) => o.id !== oralId) })),

  getOral: (oralId) => get().orals.find((o) => o.id === oralId),

  // ----- Sections -----
  updateSection: (oralId, sectionId, patch) =>
    set((s) => ({
      orals: withOral(s.orals, oralId, (o) => mapSection(o, sectionId, (sec) => ({ ...sec, ...patch }))),
    })),

  deleteSection: (oralId, sectionId) =>
    set((s) => ({
      orals: withOral(s.orals, oralId, (o) =>
        reindexOral({ ...o, sections: o.sections.filter((sec) => sec.id !== sectionId) }),
      ),
    })),

  addSection: (oralId, detectedType) =>
    set((s) => ({
      orals: withOral(s.orals, oralId, (o) => ({
        ...o,
        sections: [
          ...o.sections,
          {
            id: newId('section'),
            originalHeading: 'Nouvelle section',
            detectedType,
            memorizationMode: detectedType === 'lecture' ? 'readOnly' : 'memorize',
            confidence: 1,
            paragraphs: [],
          },
        ],
      })),
    })),

  // ----- Paragraphes -----
  gradeParagraph: (oralId, paragraphId, newScore, mode) =>
    set((s) => {
      const examDate = s.settings.examDate;
      const orals = withOral(s.orals, oralId, (o) => ({
        ...o,
        sections: o.sections.map((sec) =>
          mapParagraph(sec, paragraphId, (p) => applyGrade(p, newScore, mode, examDate)),
        ),
      }));
      return { orals, streak: bumpStreak(s.streak) };
    }),

  updateParagraphText: (oralId, sectionId, paragraphId, text) =>
    set((s) => ({
      orals: withOral(s.orals, oralId, (o) =>
        mapSection(o, sectionId, (sec) =>
          mapParagraph(sec, paragraphId, (p) => ({
            ...p,
            text,
            estimatedMinutes: estimateMinutes(text),
          })),
        ),
      ),
    })),

  splitParagraph: (oralId, sectionId, paragraphId, offset) =>
    set((s) => ({
      orals: withOral(s.orals, oralId, (o) =>
        reindexOral(
          mapSection(o, sectionId, (sec) => {
            const idx = sec.paragraphs.findIndex((p) => p.id === paragraphId);
            if (idx < 0) return sec;
            const target = sec.paragraphs[idx];
            const left = target.text.slice(0, offset).trim();
            const right = target.text.slice(offset).trim();
            if (!left || !right) return sec; // rien a diviser
            const a = createParagraph(left, oralId, sectionId, idx + 1, {
              quotes: target.quotes,
              literaryDevices: target.literaryDevices,
            });
            const b = createParagraph(right, oralId, sectionId, idx + 2);
            const paragraphs = [...sec.paragraphs];
            paragraphs.splice(idx, 1, a, b);
            return { ...sec, paragraphs };
          }),
        ),
      ),
    })),

  mergeWithNext: (oralId, sectionId, paragraphId) =>
    set((s) => ({
      orals: withOral(s.orals, oralId, (o) =>
        reindexOral(
          mapSection(o, sectionId, (sec) => {
            const idx = sec.paragraphs.findIndex((p) => p.id === paragraphId);
            if (idx < 0 || idx >= sec.paragraphs.length - 1) return sec;
            const a = sec.paragraphs[idx];
            const b = sec.paragraphs[idx + 1];
            const merged = createParagraph(`${a.text}\n\n${b.text}`, oralId, sectionId, idx + 1, {
              quotes: [...a.quotes, ...b.quotes],
              literaryDevices: [...a.literaryDevices, ...b.literaryDevices],
            });
            const paragraphs = [...sec.paragraphs];
            paragraphs.splice(idx, 2, merged);
            return { ...sec, paragraphs };
          }),
        ),
      ),
    })),

  moveParagraph: (oralId, paragraphId, toSectionId, toIndex) =>
    set((s) => ({
      orals: withOral(s.orals, oralId, (o) => {
        let moving: Paragraph | undefined;
        const stripped = o.sections.map((sec) => {
          const idx = sec.paragraphs.findIndex((p) => p.id === paragraphId);
          if (idx < 0) return sec;
          moving = sec.paragraphs[idx];
          return { ...sec, paragraphs: sec.paragraphs.filter((p) => p.id !== paragraphId) };
        });
        if (!moving) return o;
        const movingPara = moving;
        const sections = stripped.map((sec) => {
          if (sec.id !== toSectionId) return sec;
          const paragraphs = [...sec.paragraphs];
          const at = toIndex === undefined ? paragraphs.length : Math.max(0, Math.min(toIndex, paragraphs.length));
          paragraphs.splice(at, 0, { ...movingPara, sectionId: toSectionId });
          return { ...sec, paragraphs };
        });
        return reindexOral({ ...o, sections });
      }),
    })),

  setParagraphAudioRange: (oralId, sectionId, paragraphId, startIndex, endIndex) =>
    set((s) => ({
      // Reglage de confort audio uniquement : on met a jour le paragraphe sans
      // passer par `withOral` afin de NE PAS recalculer les agregats ni toucher
      // a `updatedAt` (ce n'est pas une modification du contenu appris).
      orals: s.orals.map((o) =>
        o.id !== oralId
          ? o
          : mapSection(o, sectionId, (sec) =>
              mapParagraph(sec, paragraphId, (p) => ({
                ...p,
                // 0/undefined = depuis le debut ; undefined = jusqu'a la fin :
                // on ne stocke que les bornes reellement personnalisees.
                audioStartIndex: startIndex && startIndex > 0 ? startIndex : undefined,
                audioEndIndex: endIndex,
              })),
            ),
      ),
    })),

  // ----- Reglages -----
  setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
  setExamDate: (examDate) => set((s) => ({ settings: { ...s.settings, examDate } })),
  setDailyNewTarget: (dailyNewTarget) =>
    set((s) => ({ settings: { ...s.settings, dailyNewTarget: Math.max(1, dailyNewTarget) } })),
  setAudioSettings: (patch) =>
    set((s) => ({ settings: { ...s.settings, audio: { ...s.settings.audio, ...patch } } })),

  // ----- Sauvegarde -----
  exportData: () => exportBackup({ orals: get().orals, settings: get().settings, streak: get().streak }),
  importBackup: (state) => set(() => ({ ...state })),
  resetAll: () => set(() => ({ orals: [], settings: DEFAULT_SETTINGS, streak: DEFAULT_STREAK })),
  loadSample: () => set((s) => ({ orals: [...s.orals, createSampleOral()] })),
}));

// ---------------------------------------------------------------------------
// Persistance automatique : toute modification est sauvegardee.
// ---------------------------------------------------------------------------
useStore.subscribe((state) => {
  savePersisted({ orals: state.orals, settings: state.settings, streak: state.streak });
});
