// ============================================================================
// components/Dashboard.tsx - Tableau de bord
// ----------------------------------------------------------------------------
// Vue d'accueil : compte a rebours jusqu'a l'examen, etat d'avancement, session
// du jour a lancer, statistiques cles et repartition de la maitrise.
// ============================================================================

import { useMemo } from 'react';
import { useStore } from '../store';
import { useUiStore } from '../uiStore';
import { getGlobalStats, buildDailySession } from '../scheduleAlgorithm';
import { formatMinutes } from '../utils/textProcessing';
import ProgressStats from './ProgressStats';
import OralCard from './OralCard';

function StatTile({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="card-soft text-center">
      <div className="text-2xl font-bold tabular-nums" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="label mt-1">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const orals = useStore((s) => s.orals);
  const settings = useStore((s) => s.settings);
  const streak = useStore((s) => s.streak);
  const loadSample = useStore((s) => s.loadSample);
  const navigate = useUiStore((s) => s.navigate);

  const stats = useMemo(() => getGlobalStats(orals, settings), [orals, settings]);
  const session = useMemo(() => buildDailySession(orals, settings), [orals, settings]);

  if (orals.length === 0) {
    return (
      <section className="space-y-5">
        <h2 className="text-xl font-bold">Bienvenue dans OralRevision</h2>
        <div className="card space-y-3 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Importez vos analyses lineaires pour les apprendre par coeur avant l'examen, ou chargez
            l'exemple pour decouvrir l'application.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => navigate('import')}>
              Importer un oral
            </button>
            <button type="button" className="btn-outline" onClick={loadSample}>
              Charger l'exemple
            </button>
          </div>
        </div>
      </section>
    );
  }

  const delta = stats.scheduleDelta;
  const sessionCount = session.items.length;

  return (
    <section className="space-y-6">
      {/* -------- Hero : compte a rebours + session du jour -------- */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card flex flex-col justify-between bg-brand text-white lg:col-span-1 dark:bg-brand-700">
          <div>
            <div className="label !text-white/70">Jours avant l'examen</div>
            <div className="mt-1 text-5xl font-extrabold tabular-nums">{stats.daysLeft}</div>
          </div>
          <p className="mt-3 text-sm text-white/80">
            {delta > 0
              ? `Vous avez ${delta} paragraphe${delta > 1 ? 's' : ''} de retard a rattraper.`
              : delta < 0
                ? `Vous etes en avance de ${-delta} paragraphe${-delta > 1 ? 's' : ''}. Continuez !`
                : 'Vous etes pile dans les temps.'}
          </p>
        </div>

        <div className="card flex flex-col justify-between lg:col-span-2">
          <div>
            <h3 className="text-lg font-semibold">Session du jour</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {sessionCount > 0
                ? `${sessionCount} paragraphe${sessionCount > 1 ? 's' : ''} a travailler - environ ${formatMinutes(session.totalEstimatedMinutes)}.`
                : 'Rien a reviser pour aujourd\'hui. Tout est a jour !'}
            </p>
            {session.oralsConcerned.length > 0 && (
              <p className="mt-1 text-xs text-slate-400">Oraux concernes : {session.oralsConcerned.join(', ')}</p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-primary btn-lg"
              disabled={sessionCount === 0}
              onClick={() => navigate('session')}
            >
              {sessionCount > 0 ? 'Commencer la session' : 'Session terminee'}
            </button>
            <button type="button" className="btn-outline" onClick={() => navigate('weak')}>
              Points faibles ({stats.weakParagraphs})
            </button>
            {streak.count > 0 && (
              <span className="badge-brand ml-auto" title={`Meilleure serie : ${streak.best} jours`}>
                Serie en cours : {streak.count} jour{streak.count > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* -------- Tuiles statistiques -------- */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="A reviser aujourd'hui" value={stats.dueToday} accent="#0ea5e9" />
        <StatTile label="Jamais vus" value={stats.neverSeenParagraphs} accent="#6366f1" />
        <StatTile label="A consolider" value={stats.weakParagraphs} accent="#f59e0b" />
        <StatTile label="Maitrises" value={stats.masteredParagraphs} accent="#22c55e" />
      </div>

      {/* -------- Progression -------- */}
      <ProgressStats stats={stats} />

      {/* -------- Oraux -------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Mes oraux</h3>
          <button type="button" className="btn-ghost" onClick={() => navigate('orals')}>
            Tout voir
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orals.slice(0, 3).map((oral) => (
            <OralCard key={oral.id} oral={oral} />
          ))}
        </div>
      </div>
    </section>
  );
}
