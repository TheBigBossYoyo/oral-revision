// ============================================================================
// components/ExamMode.tsx - Examen blanc (recitation d'un oral entier)
// ----------------------------------------------------------------------------
// Simule l'epreuve : on choisit un oral, puis chaque paragraphe a memoriser est
// presente cache, dans l'ordre. L'utilisateur recite a voix haute, revele pour
// se corriger et se note. Le mode de revision "exam" est enregistre dans
// l'historique pour distinguer ces passages des revisions classiques.
// ============================================================================

import { useMemo, useState } from 'react';
import type { Oral, Paragraph, Section } from '../types';
import { useStore } from '../store';
import { useUiStore } from '../uiStore';
import { isLearnable } from '../scheduleAlgorithm';
import ParagraphCard from './ParagraphCard';

interface ExamItem {
  paragraph: Paragraph;
  section: Section;
  oral: Oral;
}

export default function ExamMode() {
  const orals = useStore((s) => s.orals);
  const navigate = useUiStore((s) => s.navigate);

  const [selectedId, setSelectedId] = useState(orals[0]?.id ?? '');
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);

  const items = useMemo<ExamItem[]>(() => {
    const oral = orals.find((o) => o.id === selectedId);
    if (!oral) return [];
    const out: ExamItem[] = [];
    for (const section of oral.sections) {
      if (!isLearnable(section)) continue;
      for (const paragraph of section.paragraphs) {
        out.push({ paragraph, section, oral });
      }
    }
    return out;
  }, [orals, selectedId]);

  if (orals.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Examen blanc</h2>
        <div className="card space-y-3 text-center">
          <p className="text-slate-500 dark:text-slate-400">Importez d'abord un oral.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('import')}>
            Importer un oral
          </button>
        </div>
      </section>
    );
  }

  // ---- Ecran de preparation ----
  if (!started) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Examen blanc</h2>
        <div className="card space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choisissez l'oral a reciter entierement. Chaque paragraphe sera presente cache : recitez,
            puis revelez pour vous corriger et vous noter.
          </p>
          <label className="space-y-1">
            <span className="label">Oral a reciter</span>
            <select className="select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {orals.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn-primary btn-lg"
            disabled={items.length === 0}
            onClick={() => {
              setIndex(0);
              setStarted(true);
            }}
          >
            {items.length === 0 ? 'Aucun paragraphe a memoriser' : `Commencer (${items.length} paragraphes)`}
          </button>
        </div>
      </section>
    );
  }

  // ---- Ecran de fin ----
  if (index >= items.length) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Examen termine</h2>
        <div className="card space-y-3 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Vous avez recite l'oral en entier ({items.length} paragraphes).
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setIndex(0);
                setStarted(false);
              }}
            >
              Recommencer
            </button>
            <button type="button" className="btn-outline" onClick={() => navigate('dashboard')}>
              Tableau de bord
            </button>
          </div>
        </div>
      </section>
    );
  }

  const current = items[index];
  const progress = Math.round((index / items.length) * 100);

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <h2 className="text-lg font-bold">{current.oral.title}</h2>
          <span className="text-slate-500 dark:text-slate-400">
            {index + 1} / {items.length}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill bg-brand" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <ParagraphCard
        key={current.paragraph.id}
        paragraph={current.paragraph}
        oral={current.oral}
        section={current.section}
        defaultReveal="hidden"
        reviewMode="exam"
        onGraded={() => setIndex((i) => i + 1)}
      />

      <div className="flex items-center justify-between">
        <button type="button" className="btn-ghost" onClick={() => setStarted(false)}>
          Quitter l'examen
        </button>
        <button type="button" className="btn-ghost" onClick={() => setIndex((i) => i + 1)}>
          Passer
        </button>
      </div>
    </section>
  );
}
