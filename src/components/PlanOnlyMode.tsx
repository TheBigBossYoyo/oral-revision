// ============================================================================
// components/PlanOnlyMode.tsx - Planning previsionnel des revisions
// ----------------------------------------------------------------------------
// Affiche, sans rien reviser, le calendrier des prochaines revisions calcule par
// l'algorithme de repetition espacee : paragraphes jamais vus, en retard, et
// repartition par date jusqu'a l'examen. Global, ou filtre sur un oral precis.
// ============================================================================

import { useMemo } from 'react';
import { useStore } from '../store';
import { useUiStore } from '../uiStore';
import { collectLearnable, isNeverSeen, todayISO, formatFrenchDate } from '../scheduleAlgorithm';

interface DateGroup {
  date: string;
  count: number;
  orals: string[];
  overdue: boolean;
}

function Tile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="card-soft text-center">
      <div className="text-2xl font-bold tabular-nums" style={{ color: accent }}>
        {value}
      </div>
      <div className="label mt-1">{label}</div>
    </div>
  );
}

export default function PlanOnlyMode() {
  const orals = useStore((s) => s.orals);
  const settings = useStore((s) => s.settings);
  const activeOralId = useUiStore((s) => s.activeOralId);
  const navigate = useUiStore((s) => s.navigate);

  const { groups, newCount, overdueCount, upcomingTotal, oralTitle } = useMemo(() => {
    const today = todayISO();
    const all = collectLearnable(orals).filter((c) => !activeOralId || c.oral.id === activeOralId);

    let newCount = 0;
    let overdueCount = 0;
    const map = new Map<string, { count: number; orals: Set<string> }>();

    for (const { paragraph, oral } of all) {
      if (isNeverSeen(paragraph) || paragraph.nextReviewDate === null) {
        newCount += 1;
        continue;
      }
      const date = paragraph.nextReviewDate;
      if (date < today) overdueCount += 1;
      const entry = map.get(date) ?? { count: 0, orals: new Set<string>() };
      entry.count += 1;
      entry.orals.add(oral.title);
      map.set(date, entry);
    }

    const groups: DateGroup[] = [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, count: v.count, orals: [...v.orals], overdue: date < today }));

    const upcomingTotal = groups.reduce((acc, g) => acc + g.count, 0);
    const oralTitle = activeOralId ? all[0]?.oral.title ?? null : null;

    return { groups, newCount, overdueCount, upcomingTotal, oralTitle };
  }, [orals, activeOralId]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{oralTitle ? `Planning - ${oralTitle}` : 'Planning global'}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Examen le {formatFrenchDate(settings.examDate)}
          </p>
        </div>
        {activeOralId && (
          <button type="button" className="btn-ghost" onClick={() => navigate('orals')}>
            &larr; Mes oraux
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Tile label="Jamais vus" value={newCount} accent="#6366f1" />
        <Tile label="En retard" value={overdueCount} accent="#ef4444" />
        <Tile label="Planifies" value={upcomingTotal} accent="#0ea5e9" />
      </div>

      {groups.length === 0 && newCount === 0 ? (
        <div className="card text-center text-slate-500 dark:text-slate-400">
          Aucun paragraphe a planifier. Importez un oral pour commencer.
        </div>
      ) : (
        <div className="card space-y-2">
          <h3 className="font-semibold">Calendrier des revisions</h3>
          {newCount > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-brand-50 px-3 py-2 dark:bg-brand-700/20">
              <span className="badge-brand">Nouveaux</span>
              <span className="text-sm">{newCount} paragraphe{newCount > 1 ? 's' : ''} a decouvrir en session</span>
            </div>
          )}
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {groups.map((g) => (
              <li key={g.date} className="flex items-center gap-3 py-2">
                <span
                  className={`w-28 shrink-0 text-sm font-medium ${
                    g.overdue ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {formatFrenchDate(g.date)}
                </span>
                <span className="badge-muted shrink-0">{g.count}</span>
                <span className="truncate text-xs text-slate-400">{g.orals.join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
