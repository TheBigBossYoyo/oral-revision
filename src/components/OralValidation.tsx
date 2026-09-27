// ============================================================================
// components/OralValidation.tsx - Relecture avant enregistrement
// ----------------------------------------------------------------------------
// Affiche le resultat de l'analyse (Gemini ou secours local), liste les
// avertissements anti-reformulation et permet de corriger la structure (titre,
// type et mode de chaque section) avant d'enregistrer l'oral. Le TEXTE des
// paragraphes reste en lecture seule : il ne doit jamais etre reformule ici.
// ============================================================================

import { useEffect, useState } from 'react';
import type {
  DetectedType,
  MemorizationMode,
  ParsedOral,
  ParsedSection,
  WarningLevel,
} from '../types';
import { useStore } from '../store';
import { useUiStore } from '../uiStore';
import { isExactSubstring } from '../utils/textProcessing';
import { detectedTypeLabel, memorizationModeLabel } from '../utils/masteryUi';

const TYPE_OPTIONS: DetectedType[] = [
  'title',
  'introduction',
  'lecture',
  'analyse',
  'movement',
  'conclusion',
  'other',
];
const MODE_OPTIONS: MemorizationMode[] = ['memorize', 'readOnly', 'ignored'];

const WARNING_STYLE: Record<WarningLevel, string> = {
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200',
  warning: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  error: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200',
};

export default function OralValidation() {
  const pending = useUiStore((s) => s.pendingImport);
  const setPendingImport = useUiStore((s) => s.setPendingImport);
  const navigate = useUiStore((s) => s.navigate);
  const openOral = useUiStore((s) => s.openOral);
  const addOralFromParsed = useStore((s) => s.addOralFromParsed);

  const [draft, setDraft] = useState<ParsedOral | null>(null);

  useEffect(() => {
    setDraft(pending ? structuredClone(pending.oral) : null);
  }, [pending]);

  if (!pending || !draft) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Validation de l'import</h2>
        <div className="card space-y-3 text-center">
          <p className="text-slate-500 dark:text-slate-400">Aucun import en attente de validation.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('import')}>
            Importer un oral
          </button>
        </div>
      </section>
    );
  }

  const rawText = pending.rawText;

  const patchSection = (idx: number, patch: Partial<ParsedSection>) =>
    setDraft((d) =>
      d ? { ...d, sections: d.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)) } : d,
    );

  const removeSection = (idx: number) =>
    setDraft((d) => (d ? { ...d, sections: d.sections.filter((_, i) => i !== idx) } : d));

  const confirm = () => {
    const usable: ParsedOral = {
      ...draft,
      sections: draft.sections.filter((s) => s.paragraphs.length > 0),
    };
    const id = addOralFromParsed(usable, rawText);
    setPendingImport(null);
    openOral(id, 'editor');
  };

  const cancel = () => {
    setPendingImport(null);
    navigate('import');
  };

  const paragraphTotal = draft.sections.reduce((acc, s) => acc + s.paragraphs.length, 0);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Verifiez la structure detectee</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {draft.sections.length} sections - {paragraphTotal} paragraphes
          </p>
        </div>
        <span className={pending.source === 'gemini' ? 'badge-brand' : 'badge-muted'}>
          {pending.source === 'gemini' ? 'Detecte par Gemini' : 'Decoupage local'}
        </span>
      </div>

      {/* -------- Avertissements -------- */}
      {pending.warnings.length > 0 && (
        <div className="space-y-2">
          {pending.warnings.map((w, i) => (
            <p key={i} className={`rounded-xl px-3 py-2 text-sm ${WARNING_STYLE[w.level]}`}>
              {w.message}
              {w.excerpt && <span className="mt-1 block font-mono text-xs opacity-80">&laquo; {w.excerpt} &raquo;</span>}
            </p>
          ))}
        </div>
      )}

      {/* -------- Titre -------- */}
      <div className="card space-y-1">
        <span className="label">Titre de l'oral</span>
        <input
          className="input"
          value={draft.title}
          onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
        />
      </div>

      {/* -------- Sections -------- */}
      <div className="space-y-4">
        {draft.sections.map((section, idx) => (
          <div key={idx} className="card space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 sm:col-span-2">
                <span className="label">Titre de la section (conserve tel quel)</span>
                <input
                  className="input"
                  value={section.originalHeading}
                  onChange={(e) => patchSection(idx, { originalHeading: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className="label">Type detecte</span>
                <select
                  className="select"
                  value={section.detectedType}
                  onChange={(e) => patchSection(idx, { detectedType: e.target.value as DetectedType })}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {detectedTypeLabel(t)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="label">Mode d'apprentissage</span>
                <select
                  className="select"
                  value={section.memorizationMode}
                  onChange={(e) => patchSection(idx, { memorizationMode: e.target.value as MemorizationMode })}
                >
                  {MODE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {memorizationModeLabel(m)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Paragraphes (lecture seule + controle anti-reformulation) */}
            <ol className="space-y-2">
              {section.paragraphs.map((p, pIdx) => {
                const exact = isExactSubstring(p.text, rawText);
                return (
                  <li
                    key={pIdx}
                    className={`rounded-xl border p-3 text-sm ${
                      exact
                        ? 'border-slate-200 dark:border-slate-700'
                        : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    }`}
                  >
                    <span className="reading-text !text-base">{p.text}</span>
                    {!exact && (
                      <span className="mt-1 block text-xs font-semibold text-red-600 dark:text-red-300">
                        Attention : ce paragraphe ne correspond pas exactement au texte original.
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="text-right">
              <button type="button" className="btn-ghost !text-red-500" onClick={() => removeSection(idx)}>
                Supprimer cette section
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* -------- Actions -------- */}
      <div className="sticky bottom-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <button type="button" className="btn-primary btn-lg" onClick={confirm}>
          Enregistrer l'oral
        </button>
        <button type="button" className="btn-ghost" onClick={cancel}>
          Annuler
        </button>
        <span className="ml-auto text-xs text-slate-400">
          Le texte des paragraphes reste inchange : seule la structure est modifiable ici.
        </span>
      </div>
    </section>
  );
}
