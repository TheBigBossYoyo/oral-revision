// ============================================================================
// components/OralEditor.tsx - Edition fine d'un oral enregistre
// ----------------------------------------------------------------------------
// Permet d'ajuster le titre, les sections (titre / type / mode), et chaque
// paragraphe (correction du texte, division au curseur, fusion avec le suivant).
// Toute modification passe par le store (sauvegarde automatique).
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import type { DetectedType, MemorizationMode, Oral, Paragraph, Section } from '../types';
import { useStore } from '../store';
import { useUiStore } from '../uiStore';
import { detectedTypeLabel, memorizationModeLabel } from '../utils/masteryUi';
import AudioLoopButton from './AudioLoopButton';

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

// ----------------------------------------------------------------------------
// Sous-composant : edition d'un paragraphe
// ----------------------------------------------------------------------------
function ParagraphEditor({
  oral,
  section,
  paragraph,
  isLast,
}: {
  oral: Oral;
  section: Section;
  paragraph: Paragraph;
  isLast: boolean;
}) {
  const updateParagraphText = useStore((s) => s.updateParagraphText);
  const splitParagraph = useStore((s) => s.splitParagraph);
  const mergeWithNext = useStore((s) => s.mergeWithNext);

  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(paragraph.text);

  useEffect(() => {
    setText(paragraph.text);
  }, [paragraph.id, paragraph.text]);

  const dirty = text !== paragraph.text;

  const save = () => {
    if (text.trim() && dirty) {
      updateParagraphText(oral.id, section.id, paragraph.id, text);
    } else if (!text.trim()) {
      setText(paragraph.text); // refuse un paragraphe vide
    }
  };

  const splitHere = () => {
    save();
    const pos = ref.current?.selectionStart ?? 0;
    if (pos > 0 && pos < text.length) {
      splitParagraph(oral.id, section.id, paragraph.id, pos);
    } else {
      window.alert('Placez le curseur a l\'endroit ou diviser le paragraphe.');
    }
  };

  return (
    <div className="card-soft space-y-2">
      <div className="flex items-center justify-between">
        <span className="label">Paragraphe {paragraph.order}</span>
        <AudioLoopButton id={`edit-${paragraph.id}`} text={paragraph.text} compact />
      </div>
      <textarea
        ref={ref}
        className="textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-outline" disabled={!dirty} onClick={save}>
          Enregistrer
        </button>
        <button type="button" className="btn-ghost" onClick={splitHere}>
          Diviser au curseur
        </button>
        {!isLast && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => mergeWithNext(oral.id, section.id, paragraph.id)}
          >
            Fusionner avec le suivant
          </button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Composant principal
// ----------------------------------------------------------------------------
export default function OralEditor() {
  const activeOralId = useUiStore((s) => s.activeOralId);
  const navigate = useUiStore((s) => s.navigate);
  const oral = useStore((s) => s.orals.find((o) => o.id === activeOralId));

  const updateSection = useStore((s) => s.updateSection);
  const deleteSection = useStore((s) => s.deleteSection);
  const addSection = useStore((s) => s.addSection);
  const replaceOral = useStore((s) => s.replaceOral);

  const [title, setTitle] = useState(oral?.title ?? '');
  useEffect(() => {
    setTitle(oral?.title ?? '');
  }, [oral?.id, oral?.title]);

  if (!oral) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Editeur</h2>
        <div className="card space-y-3 text-center">
          <p className="text-slate-500 dark:text-slate-400">Aucun oral selectionne.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('orals')}>
            Voir mes oraux
          </button>
        </div>
      </section>
    );
  }

  const saveTitle = () => {
    if (title.trim() && title !== oral.title) {
      replaceOral({ ...oral, title: title.trim() });
    } else if (!title.trim()) {
      setTitle(oral.title);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn-ghost" onClick={() => navigate('orals')}>
          &larr; Mes oraux
        </button>
        <div className="flex gap-2">
          <button type="button" className="btn-outline" onClick={() => navigate('full', { oralId: oral.id })}>
            Mode revision
          </button>
          <button type="button" className="btn-outline" onClick={() => navigate('plan', { oralId: oral.id })}>
            Planning
          </button>
        </div>
      </div>

      {/* Titre */}
      <div className="card space-y-1">
        <span className="label">Titre de l'oral</span>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
        />
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {oral.sections.map((section) => (
          <div key={section.id} className="card space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 sm:col-span-2">
                <span className="label">Titre de la section</span>
                <input
                  className="input"
                  value={section.originalHeading}
                  onChange={(e) => updateSection(oral.id, section.id, { originalHeading: e.target.value })}
                />
              </label>
              <label className="space-y-1">
                <span className="label">Type</span>
                <select
                  className="select"
                  value={section.detectedType}
                  onChange={(e) =>
                    updateSection(oral.id, section.id, { detectedType: e.target.value as DetectedType })
                  }
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {detectedTypeLabel(t)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="label">Mode</span>
                <select
                  className="select"
                  value={section.memorizationMode}
                  onChange={(e) =>
                    updateSection(oral.id, section.id, { memorizationMode: e.target.value as MemorizationMode })
                  }
                >
                  {MODE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {memorizationModeLabel(m)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-2">
              {section.paragraphs.map((p, idx) => (
                <ParagraphEditor
                  key={p.id}
                  oral={oral}
                  section={section}
                  paragraph={p}
                  isLast={idx === section.paragraphs.length - 1}
                />
              ))}
              {section.paragraphs.length === 0 && (
                <p className="text-sm italic text-slate-400">Section vide.</p>
              )}
            </div>

            <div className="text-right">
              <button
                type="button"
                className="btn-ghost !text-red-500"
                onClick={() => {
                  if (window.confirm('Supprimer cette section et ses paragraphes ?')) {
                    deleteSection(oral.id, section.id);
                  }
                }}
              >
                Supprimer la section
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn-outline" onClick={() => addSection(oral.id, 'analyse')}>
        + Ajouter une section
      </button>
    </section>
  );
}
