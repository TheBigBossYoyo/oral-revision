// ============================================================================
// components/OralImporter.tsx - Import d'un (ou plusieurs) oral(aux)
// ----------------------------------------------------------------------------
// L'utilisateur colle le texte brut de son analyse. On envoie le texte au
// backend Gemini (detection de structure UNIQUEMENT, jamais de reformulation) ;
// en cas d'echec, un decoupage local de secours prend le relais. Le resultat
// part ensuite vers la page de validation pour relecture avant enregistrement.
// ============================================================================

import { useState } from 'react';
import { useStore } from '../store';
import { useUiStore } from '../uiStore';
import { parseMultipleOrals } from '../api/geminiParser';

export default function OralImporter() {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOralFromParsed = useStore((s) => s.addOralFromParsed);
  const setPendingImport = useUiStore((s) => s.setPendingImport);
  const navigate = useUiStore((s) => s.navigate);

  const handleAnalyze = async () => {
    const text = rawText.trim();
    if (!text) {
      setError("Collez d'abord le texte d'un oral.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const results = await parseMultipleOrals(text);
      if (results.length === 0) {
        setError('Aucun oral detecte dans le texte colle.');
        return;
      }

      // Un seul oral : relecture dans la page de validation.
      if (results.length === 1) {
        setPendingImport(results[0]);
        navigate('validation');
        return;
      }

      // Plusieurs oraux (separes par "=== oral ===") : ajout direct.
      let added = 0;
      let warnings = 0;
      for (const r of results) {
        if (r.ok && r.oral.sections.length > 0) {
          addOralFromParsed(r.oral, r.rawText);
          added += 1;
          warnings += r.warnings.filter((w) => w.level !== 'info').length;
        }
      }
      window.alert(
        `${added} oraux importes.` +
          (warnings ? `\n${warnings} avertissement(s) : verifiez les sections dans l'editeur.` : ''),
      );
      navigate('orals');
    } catch (err) {
      setError(`Erreur lors de l'analyse : ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Importer un oral</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Collez votre analyse lineaire telle quelle. La structure (introduction, mouvements,
          conclusion...) est detectee automatiquement, <strong>sans jamais modifier votre texte</strong>.
        </p>
      </div>

      <div className="card space-y-3">
        <label className="space-y-1">
          <span className="label">Texte de l'oral</span>
          <textarea
            className="textarea min-h-[18rem]"
            placeholder={"Collez ici le titre, l'introduction, la lecture, les mouvements et la conclusion...\n\nAstuce : pour importer plusieurs oraux d'un coup, separez-les par une ligne === oral ==="}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-primary btn-lg" disabled={loading} onClick={handleAnalyze}>
            {loading ? 'Analyse en cours...' : 'Analyser la structure'}
          </button>
          <button type="button" className="btn-ghost" disabled={loading} onClick={() => navigate('orals')}>
            Annuler
          </button>
          <span className="ml-auto text-xs text-slate-400">
            {rawText.trim() ? `${rawText.trim().length} caracteres` : ''}
          </span>
        </div>
      </div>

      <div className="card-soft text-sm text-slate-500 dark:text-slate-400">
        <p className="font-semibold text-slate-600 dark:text-slate-300">Comment ca marche ?</p>
        <ul className="ml-4 mt-1 list-disc space-y-1">
          <li>Gemini detecte uniquement les sections et les decoupe en paragraphes.</li>
          <li>Chaque paragraphe est verifie : il doit etre une portion <em>exacte</em> de votre texte.</li>
          <li>Si le serveur est indisponible, un decoupage local prend le relais (hors-ligne).</li>
          <li>Vous relisez et corrigez la structure avant l'enregistrement.</li>
        </ul>
      </div>
    </section>
  );
}
