// ============================================================================
// components/OralList.tsx - Liste de tous les oraux
// ----------------------------------------------------------------------------
// Page "Mes oraux" : grille de cartes + bouton d'import. Affiche un etat vide
// invitant a importer un premier oral ou a charger l'exemple.
// ============================================================================

import { useStore } from '../store';
import { useUiStore } from '../uiStore';
import OralCard from './OralCard';

export default function OralList() {
  const orals = useStore((s) => s.orals);
  const loadSample = useStore((s) => s.loadSample);
  const navigate = useUiStore((s) => s.navigate);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Mes oraux</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {orals.length} oral{orals.length > 1 ? 'aux' : ''} enregistre{orals.length > 1 ? 's' : ''}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => navigate('import')}>
          + Importer un oral
        </button>
      </div>

      {orals.length === 0 ? (
        <div className="card space-y-3 text-center">
          <p className="text-slate-500 dark:text-slate-400">Aucun oral pour l'instant.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => navigate('import')}>
              Importer mon premier oral
            </button>
            <button type="button" className="btn-outline" onClick={loadSample}>
              Charger l'exemple
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orals.map((oral) => (
            <OralCard key={oral.id} oral={oral} />
          ))}
        </div>
      )}
    </section>
  );
}
