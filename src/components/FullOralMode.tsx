// ============================================================================
// components/FullOralMode.tsx - Lecture / revision de l'oral complet
// ----------------------------------------------------------------------------
// Affiche un oral du debut a la fin, section par section, avec le texte visible
// (revision "a livre ouvert") et la lecture audio par paragraphe. Les sections
// en lecture seule ne sont pas notables ; les sections a memoriser le sont.
// ============================================================================

import { useStore } from '../store';
import { useUiStore } from '../uiStore';
import { detectedTypeLabel, memorizationModeLabel } from '../utils/masteryUi';
import ParagraphCard from './ParagraphCard';

export default function FullOralMode() {
  const activeOralId = useUiStore((s) => s.activeOralId);
  const navigate = useUiStore((s) => s.navigate);
  const oral = useStore((s) => s.orals.find((o) => o.id === activeOralId));

  if (!oral) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Revision complete</h2>
        <div className="card space-y-3 text-center">
          <p className="text-slate-500 dark:text-slate-400">Aucun oral selectionne.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('orals')}>
            Voir mes oraux
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn-ghost" onClick={() => navigate('orals')}>
          &larr; Mes oraux
        </button>
        <button type="button" className="btn-outline" onClick={() => navigate('editor', { oralId: oral.id })}>
          Editer
        </button>
      </div>

      <h2 className="text-2xl font-bold">{oral.title}</h2>

      {oral.sections.map((section) => (
        <div key={section.id} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1 dark:border-slate-800">
            <h3 className="text-lg font-semibold">{section.originalHeading}</h3>
            <span className="badge-muted">{detectedTypeLabel(section.detectedType)}</span>
            <span className="badge-muted">{memorizationModeLabel(section.memorizationMode)}</span>
          </div>

          {section.paragraphs.map((paragraph) => (
            <ParagraphCard
              key={paragraph.id}
              paragraph={paragraph}
              oral={oral}
              section={section}
              defaultReveal="text"
              showHeader={false}
              gradable={section.memorizationMode === 'memorize'}
              reviewMode="visual"
            />
          ))}

          {section.paragraphs.length === 0 && (
            <p className="text-sm italic text-slate-400">Section vide.</p>
          )}
        </div>
      ))}
    </section>
  );
}
