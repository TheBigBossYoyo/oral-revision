// ============================================================================
// components/ProgressStats.tsx - Repartition visuelle de la maitrise
// ----------------------------------------------------------------------------
// Affiche une barre empilee (rouge -> vert) representant la repartition des
// paragraphes a memoriser par score, plus une legende detaillee. Recoit des
// statistiques deja calculees (GlobalStats) pour rester purement presentatif.
// ============================================================================

import type { GlobalStats } from '../types';
import { SCORE_INFO } from '../scheduleAlgorithm';
import { masteryColor, formatPercent } from '../utils/masteryUi';

interface Props {
  stats: GlobalStats;
}

export default function ProgressStats({ stats }: Props) {
  const total = stats.learnableParagraphs || 1;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Repartition de la maitrise</h3>
        <span className="badge-brand">{formatPercent(stats.globalProgress)}</span>
      </div>

      {/* Barre empilee */}
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="img"
        aria-label={`Progression globale : ${formatPercent(stats.globalProgress)}`}
      >
        {stats.masteryDistribution.map((count, score) =>
          count > 0 ? (
            <div
              key={score}
              style={{ width: `${(count / total) * 100}%`, backgroundColor: masteryColor(score) }}
              title={`${SCORE_INFO[score].label} : ${count}`}
            />
          ) : null,
        )}
      </div>

      {/* Legende */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {SCORE_INFO.map((info) => (
          <li key={info.score} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: masteryColor(info.score) }}
            />
            <span className="truncate text-slate-600 dark:text-slate-300">{info.label}</span>
            <span className="ml-auto font-semibold tabular-nums">
              {stats.masteryDistribution[info.score]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
