// ============================================================================
// components/OeuvreSection.tsx - Entrainement a l'entretien (2e partie de l'oral)
// ----------------------------------------------------------------------------
// Aide a preparer la presentation et la defense de l'oeuvre choisie :
//   « Le Portrait de Dorian Gray » d'Oscar Wilde.
// Deux modes :
//   - « Parcourir » : toutes les questions, classees par theme, avec elements de
//     reponse a reveler et un statut (a revoir / acquise).
//   - « Interrogation » : un examinateur virtuel pose les questions une a une,
//     reponse masquee ; on s'auto-evalue et on avance.
// La progression (statut des questions) est sauvegardee via revisionStore.
// ============================================================================

import { useMemo, useState } from 'react';
import {
  OEUVRE_AUTHOR,
  OEUVRE_CATEGORIES,
  OEUVRE_QUESTIONS,
  OEUVRE_TITLE,
  difficultyLabel,
  questionsForCategory,
  type OeuvreCategory,
  type OeuvreQuestion,
} from '../data/dorianGray';
import { useRevisionStore, type QuestionStatus } from '../revisionStore';
import PresentationTrainer from './PresentationTrainer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function DifficultyDots({ d }: { d: 1 | 2 | 3 }) {
  return (
    <span className="badge-muted" title={difficultyLabel(d)}>
      {'●'.repeat(d)}
      <span className="text-slate-300 dark:text-slate-600">{'○'.repeat(3 - d)}</span>
    </span>
  );
}

function StatusButtons({ id }: { id: string }) {
  const status = useRevisionStore((s) => s.questionStatus[id]);
  const setStatus = useRevisionStore((s) => s.setQuestionStatus);

  const set = (value: QuestionStatus) => setStatus(id, status === value ? null : value);

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => set('review')}
        className={`badge ${status === 'review' ? '' : 'badge-muted'}`}
        style={status === 'review' ? { backgroundColor: '#f59e0b1a', color: '#f59e0b' } : undefined}
      >
        A revoir
      </button>
      <button
        type="button"
        onClick={() => set('mastered')}
        className={`badge ${status === 'mastered' ? '' : 'badge-muted'}`}
        style={status === 'mastered' ? { backgroundColor: '#22c55e1a', color: '#22c55e' } : undefined}
      >
        Acquise
      </button>
    </div>
  );
}

function AnswerBody({ q }: { q: OeuvreQuestion }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="label mb-1">Points-cles a mobiliser</div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
          {q.keyPoints.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className="label mb-1">Proposition de reponse</div>
        <p className="font-reading text-base leading-relaxed text-slate-800 dark:text-slate-100">{q.modelAnswer}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mode Parcourir
// ---------------------------------------------------------------------------

function QuestionCard({ q }: { q: OeuvreQuestion }) {
  const [open, setOpen] = useState(false);
  const status = useRevisionStore((s) => s.questionStatus[q.id]);

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold leading-relaxed">{q.question}</p>
        <DifficultyDots d={q.difficulty} />
      </div>

      {open ? (
        <>
          <AnswerBody q={q} />
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <StatusButtons id={q.id} />
            <button type="button" className="btn-ghost !py-2" onClick={() => setOpen(false)}>
              Masquer
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" className="btn-outline !py-2" onClick={() => setOpen(true)}>
            Voir les elements de reponse
          </button>
          {status === 'mastered' && <span className="badge" style={{ backgroundColor: '#22c55e1a', color: '#22c55e' }}>Acquise</span>}
          {status === 'review' && <span className="badge" style={{ backgroundColor: '#f59e0b1a', color: '#f59e0b' }}>A revoir</span>}
        </div>
      )}
    </div>
  );
}

function BrowseMode() {
  const [category, setCategory] = useState<'all' | OeuvreCategory>('all');

  const list = category === 'all' ? OEUVRE_QUESTIONS : questionsForCategory(category);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`badge ${category === 'all' ? 'badge-brand' : 'badge-muted'}`}
        >
          Tout ({OEUVRE_QUESTIONS.length})
        </button>
        {OEUVRE_CATEGORIES.map((c) => {
          const n = questionsForCategory(c.id).length;
          if (n === 0) return null;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`badge ${category === c.id ? 'badge-brand' : 'badge-muted'}`}
            >
              {c.label} ({n})
            </button>
          );
        })}
      </div>

      {category !== 'all' && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {OEUVRE_CATEGORIES.find((c) => c.id === category)?.description}
        </p>
      )}

      <div className="space-y-3">
        {list.map((q) => (
          <QuestionCard key={q.id} q={q} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mode Interrogation (examinateur virtuel)
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function OralMode() {
  const setStatus = useRevisionStore((s) => s.setQuestionStatus);
  const [category, setCategory] = useState<'all' | OeuvreCategory>('all');
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<OeuvreQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  function start() {
    const base = category === 'all' ? OEUVRE_QUESTIONS : questionsForCategory(category);
    setQueue(shuffle(base));
    setIndex(0);
    setRevealed(false);
    setStarted(true);
  }

  function mark(status: QuestionStatus) {
    setStatus(queue[index].id, status);
    advance();
  }

  function advance() {
    if (index + 1 >= queue.length) setIndex(queue.length); // ecran de fin
    else {
      setIndex((i) => i + 1);
      setRevealed(false);
    }
  }

  // --- Ecran de preparation ---
  if (!started) {
    return (
      <div className="card space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          L'examinateur vous pose les questions une a une, dans un ordre aleatoire. Repondez a voix haute, puis
          revelez une proposition de reponse et auto-evaluez-vous.
        </p>
        <label className="space-y-1">
          <span className="label">Theme des questions</span>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value as 'all' | OeuvreCategory)}>
            <option value="all">Tous les themes ({OEUVRE_QUESTIONS.length} questions)</option>
            {OEUVRE_CATEGORIES.map((c) => {
              const n = questionsForCategory(c.id).length;
              if (n === 0) return null;
              return (
                <option key={c.id} value={c.id}>
                  {c.label} ({n})
                </option>
              );
            })}
          </select>
        </label>
        <button type="button" className="btn-primary btn-lg" onClick={start}>
          Commencer l'interrogation
        </button>
      </div>
    );
  }

  // --- Ecran de fin ---
  if (index >= queue.length) {
    return (
      <div className="card space-y-3 text-center">
        <h3 className="text-lg font-bold">Interrogation terminee</h3>
        <p className="text-slate-500 dark:text-slate-400">
          Vous avez parcouru {queue.length} question{queue.length > 1 ? 's' : ''}. Retravaillez celles marquees
          &laquo;&nbsp;a revoir&nbsp;&raquo; dans l'onglet Parcourir.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className="btn-primary" onClick={start}>
            Recommencer
          </button>
          <button type="button" className="btn-outline" onClick={() => setStarted(false)}>
            Changer de theme
          </button>
        </div>
      </div>
    );
  }

  const current = queue[index];
  const progress = Math.round((index / queue.length) * 100);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Question de l'examinateur</span>
          <span className="text-slate-500 dark:text-slate-400">
            {index + 1} / {queue.length}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill bg-brand" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg font-semibold leading-relaxed">{current.question}</p>
          <DifficultyDots d={current.difficulty} />
        </div>

        {revealed ? (
          <AnswerBody q={current} />
        ) : (
          <p className="text-sm italic text-slate-400">
            Repondez a voix haute comme face a l'examinateur, puis revelez la proposition de reponse.
          </p>
        )}
      </div>

      {revealed ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Auto-evaluation :</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-outline"
              onClick={() => mark('review')}
              style={{ color: '#f59e0b' }}
            >
              A revoir
            </button>
            <button type="button" className="btn-primary" onClick={() => mark('mastered')}>
              Maitrisee &rarr;
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <button type="button" className="btn-ghost" onClick={() => setStarted(false)}>
            Quitter
          </button>
          <button type="button" className="btn-primary" onClick={() => setRevealed(true)}>
            Reveler la reponse
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

type OeuvreTab = 'presentation' | 'browse' | 'oral';

export default function OeuvreSection() {
  const [tab, setTab] = useState<OeuvreTab>('presentation');
  const questionStatus = useRevisionStore((s) => s.questionStatus);

  const { mastered, review } = useMemo(() => {
    let mastered = 0;
    let review = 0;
    for (const q of OEUVRE_QUESTIONS) {
      const st = questionStatus[q.id];
      if (st === 'mastered') mastered++;
      else if (st === 'review') review++;
    }
    return { mastered, review };
  }, [questionStatus]);

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Entretien sur l'oeuvre</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {OEUVRE_TITLE} &mdash; {OEUVRE_AUTHOR}. Entrainez-vous a presenter et defendre l'oeuvre face aux questions
          de l'examinateur.
        </p>
      </div>

      {/* Resume de progression */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-soft text-center">
          <div className="text-2xl font-bold tabular-nums">{OEUVRE_QUESTIONS.length}</div>
          <div className="label mt-1">Questions</div>
        </div>
        <div className="card-soft text-center">
          <div className="text-2xl font-bold tabular-nums" style={{ color: '#22c55e' }}>{mastered}</div>
          <div className="label mt-1">Maitrisees</div>
        </div>
        <div className="card-soft text-center">
          <div className="text-2xl font-bold tabular-nums" style={{ color: '#f59e0b' }}>{review}</div>
          <div className="label mt-1">A revoir</div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {([
          { id: 'presentation', label: 'Ma presentation' },
          { id: 'browse', label: 'Parcourir' },
          { id: 'oral', label: 'Interrogation' },
        ] as Array<{ id: OeuvreTab; label: string }>).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-white shadow-sm dark:bg-slate-900' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'presentation' && <PresentationTrainer />}
      {tab === 'browse' && <BrowseMode />}
      {tab === 'oral' && <OralMode />}
    </section>
  );
}
