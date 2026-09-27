// ============================================================================
// components/StudySession.tsx - Session de revision du jour
// ----------------------------------------------------------------------------
// Deroule les paragraphes selectionnes par l'algorithme de repetition espacee
// (buildDailySession). Chaque paragraphe est presente en rappel actif (cache),
// l'utilisateur le recite, le revele puis se note de 0 a 5. La liste est figee
// au montage pour ne pas se reordonner pendant la session.
// ============================================================================

import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { useUiStore } from '../uiStore';
import { buildDailySession } from '../scheduleAlgorithm';
import { formatMinutes } from '../utils/textProcessing';
import { reasonLabel, reasonBadgeStyle } from '../utils/masteryUi';
import ParagraphCard from './ParagraphCard';

export default function StudySession() {
  const orals = useStore((s) => s.orals);
  const settings = useStore((s) => s.settings);
  const navigate = useUiStore((s) => s.navigate);

  // Instantane fige de la session (ne se reordonne pas a chaque note).
  const [items] = useState(() => buildDailySession(orals, settings).items);
  const [index, setIndex] = useState(0);

  const totalMinutes = useMemo(
    () => Math.round(items.reduce((acc, it) => acc + it.paragraph.estimatedMinutes, 0)),
    [items],
  );

  if (items.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Session du jour</h2>
        <div className="card space-y-3 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Rien a reviser aujourd'hui. Tout est a jour, revenez demain !
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
        <h2 className="text-xl font-bold">Session terminee</h2>
        <div className="card space-y-3 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Vous avez travaille {items.length} paragraphe{items.length > 1 ? 's' : ''} aujourd'hui. Bravo !
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => navigate('dashboard')}>
              Tableau de bord
            </button>
            <button type="button" className="btn-outline" onClick={() => navigate('weak')}>
              Travailler mes points faibles
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
          <h2 className="text-lg font-bold">Session du jour</h2>
          <span className="text-slate-500 dark:text-slate-400">
            {index + 1} / {items.length} - {formatMinutes(totalMinutes)}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill bg-brand" style={{ width: `${progress}%` }} />
        </div>
        <span className="badge" style={reasonBadgeStyle(current.reason)}>
          {reasonLabel(current.reason)}
        </span>
      </header>

      <ParagraphCard
        key={current.paragraph.id}
        paragraph={current.paragraph}
        oral={current.oral}
        section={current.section}
        defaultReveal="hidden"
        reviewMode="visual"
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
