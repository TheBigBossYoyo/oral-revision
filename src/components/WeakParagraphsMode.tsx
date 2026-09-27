// ============================================================================
// components/WeakParagraphsMode.tsx - Entrainement cible des points faibles
// ----------------------------------------------------------------------------
// Regroupe tous les paragraphes a memoriser dont le score est faible (<= 2),
// les plus fragiles d'abord, pour une seance de consolidation. La liste est
// figee au montage afin de ne pas retirer un paragraphe des qu'il s'ameliore.
// ============================================================================

import { useState } from 'react';
import { useStore } from '../store';
import { useUiStore } from '../uiStore';
import { collectLearnable, isWeak } from '../scheduleAlgorithm';
import ParagraphCard from './ParagraphCard';

export default function WeakParagraphsMode() {
  const orals = useStore((s) => s.orals);
  const navigate = useUiStore((s) => s.navigate);

  const [items] = useState(() =>
    collectLearnable(orals)
      .filter((c) => isWeak(c.paragraph))
      .sort((a, b) => a.paragraph.masteryScore - b.paragraph.masteryScore),
  );
  const [index, setIndex] = useState(0);

  if (items.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Points faibles</h2>
        <div className="card space-y-3 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Aucun paragraphe fragile pour l'instant. Continuez vos sessions quotidiennes !
          </p>
          <button type="button" className="btn-primary" onClick={() => navigate('dashboard')}>
            Retour au tableau de bord
          </button>
        </div>
      </section>
    );
  }

  if (index >= items.length) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Consolidation terminee</h2>
        <div className="card space-y-3 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Vous avez revu {items.length} paragraphe{items.length > 1 ? 's' : ''} fragile{items.length > 1 ? 's' : ''}.
          </p>
          <button type="button" className="btn-primary" onClick={() => navigate('dashboard')}>
            Tableau de bord
          </button>
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
          <h2 className="text-lg font-bold">Points faibles</h2>
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
        reviewMode="recitation"
        onGraded={() => setIndex((i) => i + 1)}
      />

      <div className="flex items-center justify-between">
        <button type="button" className="btn-ghost" onClick={() => navigate('dashboard')}>
          Quitter
        </button>
        <button type="button" className="btn-ghost" onClick={() => setIndex((i) => i + 1)}>
          Passer
        </button>
      </div>
    </section>
  );
}
