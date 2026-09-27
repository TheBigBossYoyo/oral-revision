// ============================================================================
// components/PresentationTrainer.tsx - Memoriser SA presentation de l'oeuvre
// ----------------------------------------------------------------------------
// L'eleve colle (ou importe depuis un .txt) le texte de la presentation qu'il a
// redigee pour la 2e partie de l'oral, puis l'apprend par coeur grace a quatre
// modes de revelation progressive :
//   - « Lecture »          : texte complet, en boucle audio possible.
//   - « Recitation »       : phrases masquees a reveler une a une (rappel actif).
//   - « Premiere lettre »  : seule l'initiale de chaque mot reste (technique de
//                            recitation classique : on reconstitue de memoire).
//   - « Trous »            : mots masques cliquables, difficulte reglable.
//
// REGLE D'OR (comme partout dans l'app) : le texte n'est JAMAIS reformule. Les
// modes ne font que MASQUER l'affichage ; le texte source reste mot pour mot.
// Le texte est sauvegarde localement via revisionStore.
// ============================================================================

import { useMemo, useRef, useState } from 'react';
import { useRevisionStore } from '../revisionStore';
import { buildCloze, countWords, splitSentences } from '../utils/textProcessing';
import AudioLoopButton from './AudioLoopButton';

type StudyMode = 'read' | 'recall' | 'firstLetter' | 'cloze';

const MODES: Array<{ id: StudyMode; label: string }> = [
  { id: 'read', label: 'Lecture' },
  { id: 'recall', label: 'Recitation' },
  { id: 'firstLetter', label: 'Premiere lettre' },
  { id: 'cloze', label: 'Trous' },
];

/** Trois niveaux de difficulte pour le mode « Trous » (intensite du masquage). */
const CLOZE_LEVELS: Array<{ id: string; label: string; intensity: number }> = [
  { id: 'easy', label: 'Facile', intensity: 0.2 },
  { id: 'medium', label: 'Moyen', intensity: 0.45 },
  { id: 'hard', label: 'Difficile', intensity: 0.85 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Decoupe le texte en paragraphes (ligne vide = separation ; sinon par ligne). */
function splitParagraphs(text: string): string[] {
  const byBlank = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (byBlank.length > 1) return byBlank;
  // Pas de ligne vide : on retombe sur un decoupage par saut de ligne simple.
  const byLine = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return byLine.length > 0 ? byLine : [text.trim()].filter(Boolean);
}

interface WordToken {
  text: string;
  /** true = vrai mot (lettres), false = separateur (espaces, ponctuation). */
  isWord: boolean;
}

/** Tokenise un texte en mots et separateurs, sans rien modifier. */
function tokenizeWords(text: string): WordToken[] {
  const tokens: WordToken[] = [];
  const re = /(\p{L}[\p{L}À-ɏ'’-]*)|([^\p{L}]+)/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ text: m[0], isWord: Boolean(m[1]) });
  }
  return tokens;
}

/** Reduit un mot a son initiale suivie de points (« Oscar » -> « O···· »). */
function firstLetterMask(word: string): string {
  if (word.length <= 1) return word;
  return word[0] + '·'.repeat(word.length - 1);
}

// ---------------------------------------------------------------------------
// Bloc paragraphe (un mode de revelation a la fois)
// ---------------------------------------------------------------------------

function ParagraphBlock({
  text,
  mode,
  intensity,
  startRevealed,
}: {
  text: string;
  mode: StudyMode;
  intensity: number;
  /** Etat initial (pilote par « Tout afficher / Tout masquer » via remontage). */
  startRevealed: boolean;
}) {
  const sentences = useMemo(() => splitSentences(text), [text]);
  const tokens = useMemo(() => tokenizeWords(text), [text]);
  const clozeSegments = useMemo(
    () => buildCloze(text, { intensity, maskConnectors: true, maskQuotes: true }),
    [text, intensity],
  );

  const [revealedSentences, setRevealedSentences] = useState(startRevealed ? sentences.length : 0);
  const [revealedWords, setRevealedWords] = useState<Set<number>>(() =>
    startRevealed ? new Set(tokens.map((_, i) => i)) : new Set(),
  );

  const toggleWord = (i: number) =>
    setRevealedWords((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  // ---- Lecture ----
  if (mode === 'read') {
    return <p className="reading-text">{text}</p>;
  }

  // ---- Recitation : phrases masquees, revelees une a une ----
  if (mode === 'recall') {
    return (
      <div className="space-y-3">
        <p className="reading-text">
          {sentences.map((sentence, idx) => {
            const shown = idx < revealedSentences;
            return (
              <span
                key={idx}
                onClick={() => !shown && setRevealedSentences(idx + 1)}
                className={
                  shown
                    ? ''
                    : 'cursor-pointer select-none rounded bg-slate-200 text-transparent transition hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700'
                }
                title={shown ? undefined : 'Cliquer pour reveler cette phrase'}
              >
                {shown ? `${sentence} ` : `${'█'.repeat(Math.min(40, sentence.length))} `}
              </span>
            );
          })}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-outline !py-2"
            disabled={revealedSentences >= sentences.length}
            onClick={() => setRevealedSentences((n) => Math.min(sentences.length, n + 1))}
          >
            Phrase suivante
          </button>
          <button type="button" className="btn-ghost !py-2" onClick={() => setRevealedSentences(sentences.length)}>
            Tout afficher
          </button>
          <button type="button" className="btn-ghost !py-2" onClick={() => setRevealedSentences(0)}>
            Masquer
          </button>
        </div>
      </div>
    );
  }

  // ---- Premiere lettre : on ne garde que l'initiale, clic pour reveler ----
  if (mode === 'firstLetter') {
    return (
      <p className="reading-text leading-loose">
        {tokens.map((tok, idx) => {
          if (!tok.isWord || tok.text.length <= 1) return <span key={idx}>{tok.text}</span>;
          const shown = revealedWords.has(idx);
          return (
            <span
              key={idx}
              onClick={() => toggleWord(idx)}
              className="cursor-pointer rounded transition-colors hover:bg-brand/10"
              title={shown ? 'Cliquer pour re-masquer' : 'Cliquer pour reveler ce mot'}
            >
              {shown ? tok.text : firstLetterMask(tok.text)}
            </span>
          );
        })}
      </p>
    );
  }

  // ---- Trous : mots masques cliquables ----
  return (
    <p className="reading-text leading-loose">
      {clozeSegments.map((seg, idx) => {
        if (!seg.masked) return <span key={idx}>{seg.text}</span>;
        const shown = revealedWords.has(idx);
        return (
          <span
            key={idx}
            onClick={() => toggleWord(idx)}
            className="cloze-blank"
            style={shown ? undefined : { color: 'transparent' }}
            title={shown ? 'Cliquer pour re-masquer' : 'Cliquer pour reveler'}
          >
            {shown ? seg.text : ' '.repeat(Math.max(2, seg.text.length))}
          </span>
        );
      })}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Editeur (coller / importer le texte)
// ---------------------------------------------------------------------------

function PresentationEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (text: string) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const fileRef = useRef<HTMLInputElement>(null);

  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setDraft(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  return (
    <div className="card space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold">Votre presentation de l'oeuvre</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Collez le texte que vous avez redige pour ouvrir la 2e partie de l'oral, ou importez un fichier
          <code className="mx-1 rounded bg-slate-100 px-1 dark:bg-slate-800">.txt</code>. Conservez vos paragraphes
          (laissez une ligne vide entre eux) : ils servent de reperes pour la recitation.
        </p>
      </div>

      <textarea
        className="textarea min-h-[18rem]"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Collez ici votre presentation..."
        spellCheck
      />

      <input
        ref={fileRef}
        type="file"
        accept=".txt,.md,text/plain"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importFile(f);
          e.target.value = '';
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary" disabled={!draft.trim()} onClick={() => onSave(draft)}>
          Enregistrer
        </button>
        <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()}>
          Importer un fichier .txt
        </button>
        {draft && (
          <button type="button" className="btn-ghost" onClick={() => setDraft('')}>
            Vider
          </button>
        )}
        {onCancel && (
          <button type="button" className="btn-ghost ml-auto" onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Le texte est sauvegarde dans ce navigateur uniquement et n'est jamais reformule&nbsp;: il reste mot pour mot
        celui que vous collez.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export default function PresentationTrainer() {
  const presentationText = useRevisionStore((s) => s.presentationText);
  const setPresentationText = useRevisionStore((s) => s.setPresentationText);

  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<StudyMode>('read');
  const [clozeLevel, setClozeLevel] = useState(CLOZE_LEVELS[1]);
  // Pilote « Tout afficher / Tout masquer » : un changement remonte les blocs.
  const [revealNonce, setRevealNonce] = useState(0);
  const [startRevealed, setStartRevealed] = useState(false);

  const paragraphs = useMemo(() => splitParagraphs(presentationText), [presentationText]);
  const words = useMemo(() => countWords(presentationText), [presentationText]);
  // Temps de parole estime a l'oral (~130 mots/minute).
  const speakMinutes = Math.max(1, Math.round(words / 130));

  const save = (text: string) => {
    setPresentationText(text.trim());
    setEditing(false);
  };

  const setAll = (revealed: boolean) => {
    setStartRevealed(revealed);
    setRevealNonce((n) => n + 1);
  };

  const switchMode = (next: StudyMode) => {
    setMode(next);
    setStartRevealed(false);
    setRevealNonce((n) => n + 1);
  };

  // --- Aucun texte enregistre, ou edition en cours ---
  if (editing || !presentationText.trim()) {
    return (
      <PresentationEditor
        initial={presentationText}
        onSave={save}
        onCancel={editing && presentationText.trim() ? () => setEditing(false) : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre d'outils : stats + actions */}
      <div className="card-soft flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>
            <span className="font-bold tabular-nums">{words}</span>{' '}
            <span className="text-slate-500 dark:text-slate-400">mots</span>
          </span>
          <span>
            <span className="font-bold tabular-nums">~{speakMinutes}</span>{' '}
            <span className="text-slate-500 dark:text-slate-400">min a l'oral</span>
          </span>
          <span>
            <span className="font-bold tabular-nums">{paragraphs.length}</span>{' '}
            <span className="text-slate-500 dark:text-slate-400">paragraphe{paragraphs.length > 1 ? 's' : ''}</span>
          </span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <AudioLoopButton id="presentation-audio" text={presentationText} label="Tout ecouter" className="!py-2" />
          <button type="button" className="btn-ghost !py-2" onClick={() => setEditing(true)}>
            Modifier le texte
          </button>
        </div>
      </div>

      {/* Selecteur de mode */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap rounded-xl border border-slate-200 p-0.5 dark:border-slate-700">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => switchMode(m.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === m.id ? 'bg-brand text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Difficulte du mode Trous */}
        {mode === 'cloze' && (
          <div className="inline-flex rounded-xl border border-slate-200 p-0.5 dark:border-slate-700">
            {CLOZE_LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  setClozeLevel(lvl);
                  setAll(false);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  clozeLevel.id === lvl.id
                    ? 'bg-brand text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        )}

        {/* Tout afficher / tout masquer (sauf en lecture pure) */}
        {mode !== 'read' && (
          <div className="ml-auto flex gap-2">
            <button type="button" className="btn-ghost !py-1.5 text-xs" onClick={() => setAll(true)}>
              Tout afficher
            </button>
            <button type="button" className="btn-ghost !py-1.5 text-xs" onClick={() => setAll(false)}>
              Tout masquer
            </button>
          </div>
        )}
      </div>

      {/* Aide contextuelle */}
      <p className="text-sm italic text-slate-400">
        {mode === 'read' && 'Lisez votre presentation a voix haute, plusieurs fois. Ecoutez-la en boucle pour l’ancrer.'}
        {mode === 'recall' && 'Recitez de memoire, puis cliquez phrase par phrase pour verifier.'}
        {mode === 'firstLetter' && 'Reconstituez chaque phrase a partir des seules initiales. Cliquez un mot pour le devoiler.'}
        {mode === 'cloze' && 'Completez mentalement les trous. Cliquez un mot masque pour le reveler.'}
      </p>

      {/* Paragraphes */}
      <div className="space-y-3">
        {paragraphs.map((para, i) => (
          <div key={i} className="card space-y-3">
            <div className="flex items-center gap-2">
              <span className="badge-muted">Paragraphe {i + 1}</span>
              <AudioLoopButton
                id={`presentation-p-${i}`}
                text={para}
                label="Ecouter"
                className="ml-auto !py-1.5 !px-3"
              />
            </div>
            <ParagraphBlock
              key={`${mode}-${clozeLevel.id}-${revealNonce}`}
              text={para}
              mode={mode}
              intensity={clozeLevel.intensity}
              startRevealed={startRevealed}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
