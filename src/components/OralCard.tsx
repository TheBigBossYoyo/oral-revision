// ============================================================================
// components/OralCard.tsx - Carte resume d'un oral
// ----------------------------------------------------------------------------
// Vignette affichee dans la liste des oraux et le tableau de bord : titre,
// progression, prochaine revision et acces rapides (reviser / editer / planning).
// ============================================================================

import type { Oral } from '../types';
import { useStore } from '../store';
import { useUiStore } from '../uiStore';
import { formatPercent, masteryColor } from '../utils/masteryUi';
import { formatFrenchDate, todayISO } from '../scheduleAlgorithm';

export default function OralCard({ oral }: { oral: Oral }) {
  const openOral = useUiStore((s) => s.openOral);
  const deleteOral = useStore((s) => s.deleteOral);

  const sectionCount = oral.sections.length;
  const paragraphCount = oral.sections.reduce((acc, s) => acc + s.paragraphs.length, 0);
  const pct = Math.round(oral.globalMastery * 100);
  const isDue = oral.nextReviewDate !== null && oral.nextReviewDate <= todayISO();

  const handleDelete = () => {
    if (window.confirm(`Supprimer l'oral "${oral.title}" ?\nCette action est irreversible.`)) {
      deleteOral(oral.id);
    }
  };

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug">{oral.title}</h3>
        <span className="badge-muted shrink-0">{sectionCount} sect.</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{paragraphCount} paragraphes</span>
          <span className="font-semibold">{formatPercent(oral.globalMastery)}</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${pct}%`, backgroundColor: masteryColor(Math.round(oral.globalMastery * 5)) }}
          />
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {oral.nextReviewDate ? (
          <>
            Prochaine revision : <span className={isDue ? 'font-semibold text-brand' : ''}>{formatFrenchDate(oral.nextReviewDate)}</span>
            {isDue && ' (aujourd\'hui)'}
          </>
        ) : (
          'Jamais revise'
        )}
      </p>

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <button type="button" className="btn-primary" onClick={() => openOral(oral.id, 'full')}>
          Reviser
        </button>
        <button type="button" className="btn-outline" onClick={() => openOral(oral.id, 'editor')}>
          Editer
        </button>
        <button type="button" className="btn-ghost" onClick={() => openOral(oral.id, 'plan')}>
          Planning
        </button>
        <button type="button" className="btn-ghost ml-auto !text-red-500" onClick={handleDelete}>
          Supprimer
        </button>
      </div>
    </div>
  );
}
