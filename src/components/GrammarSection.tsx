// ============================================================================
// components/GrammarSection.tsx - Section Grammaire (theorie + QCM)
// ----------------------------------------------------------------------------
// Deux onglets :
//   - « Theorie » : le programme de grammaire (seconde / premiere) en chapitres,
//     chacun avec ses sous-parties, exemples et un encadre « methode oral ».
//   - « S'entrainer » : des QCM par chapitre, corriges en direct, avec score et
//     memorisation du meilleur resultat (revisionStore).
// ============================================================================

import { useMemo, useState } from 'react';
import {
  GRAMMAR_CHAPTERS,
  quizForChapter,
  type GrammarChapter,
  type GrammarLevel,
  type QuizQuestion,
} from '../data/grammar';
import { useRevisionStore } from '../revisionStore';

// ---------------------------------------------------------------------------
// Helpers d'affichage
// ---------------------------------------------------------------------------

const LEVEL_DISPLAY: Record<GrammarLevel, string> = {
  seconde: 'Seconde',
  premiere: 'Première',
  transversal: 'Transversal',
};

function LevelBadge({ level }: { level: GrammarLevel }) {
  const color =
    level === 'seconde' ? '#6366f1' : level === 'premiere' ? '#0ea5e9' : '#22c55e';
  return (
    <span className="badge" style={{ backgroundColor: `${color}1a`, color }}>
      {LEVEL_DISPLAY[level]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Onglet Theorie
// ---------------------------------------------------------------------------

function ChapterDetail({ chapter, onBack }: { chapter: GrammarChapter; onBack: () => void }) {
  return (
    <article className="space-y-5">
      <button type="button" className="btn-ghost" onClick={onBack}>
        &larr; Tous les chapitres
      </button>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-bold">{chapter.title}</h2>
          <LevelBadge level={chapter.level} />
        </div>
        <p className="text-slate-500 dark:text-slate-400">{chapter.summary}</p>
      </header>

      {chapter.oralTip && (
        <div className="card-soft border-l-4 border-brand">
          <div className="label mb-1 text-brand-700 dark:text-brand-100">Methode a l'oral</div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{chapter.oralTip}</p>
        </div>
      )}

      {chapter.subsections.map((sub, i) => (
        <section key={i} className="card space-y-3">
          <h3 className="text-lg font-semibold">{sub.heading}</h3>
          {sub.content.map((p, j) => (
            <p key={j} className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {p}
            </p>
          ))}

          {sub.examples && sub.examples.length > 0 && (
            <div className="space-y-2 pt-1">
              {sub.examples.map((ex, k) => (
                <div key={k} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <p className="font-reading text-base italic text-slate-800 dark:text-slate-100">
                    &laquo;&nbsp;{ex.text}&nbsp;&raquo;
                  </p>
                  {ex.note && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{ex.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </article>
  );
}

function TheoryTab({ onQuiz }: { onQuiz: (chapterId: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [level, setLevel] = useState<'all' | GrammarLevel>('all');
  const quizBest = useRevisionStore((s) => s.quizBest);

  const open = GRAMMAR_CHAPTERS.find((c) => c.id === openId) ?? null;
  if (open) return <ChapterDetail chapter={open} onBack={() => setOpenId(null)} />;

  const filtered = GRAMMAR_CHAPTERS.filter((c) => level === 'all' || c.level === level || c.level === 'transversal');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="label">Niveau :</span>
        {(['all', 'seconde', 'premiere'] as const).map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => setLevel(lv)}
            className={`badge ${level === lv ? 'badge-brand' : 'badge-muted'}`}
          >
            {lv === 'all' ? 'Tous' : LEVEL_DISPLAY[lv]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((chapter) => {
          const nQuiz = quizForChapter(chapter.id).length;
          const best = quizBest[chapter.id];
          return (
            <div key={chapter.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-snug">{chapter.title}</h3>
                <LevelBadge level={chapter.level} />
              </div>
              <p className="flex-1 text-sm text-slate-500 dark:text-slate-400">{chapter.summary}</p>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn-outline !py-2" onClick={() => setOpenId(chapter.id)}>
                  Lire la lecon
                </button>
                {nQuiz > 0 && (
                  <button type="button" className="btn-ghost !py-2" onClick={() => onQuiz(chapter.id)}>
                    Quiz ({nQuiz})
                  </button>
                )}
                {best !== undefined && (
                  <span className="badge-muted ml-auto" title="Meilleur score">
                    {best}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Onglet S'entrainer (QCM)
// ---------------------------------------------------------------------------

function QuizRunner({
  chapterId,
  questions,
  title,
  onExit,
}: {
  chapterId: string;
  questions: QuizQuestion[];
  title: string;
  onExit: () => void;
}) {
  const recordQuizScore = useRevisionStore((s) => s.recordQuizScore);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[index];
  const answered = selected !== null;

  function choose(i: number) {
    if (answered) return;
    setSelected(i);
    if (i === current.correctIndex) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= questions.length) {
      const percent = Math.round((score / questions.length) * 100);
      recordQuizScore(chapterId, percent);
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const percent = Math.round((score / questions.length) * 100);
    const good = percent >= 70;
    return (
      <div className="card space-y-4 text-center">
        <h3 className="text-lg font-bold">{title}</h3>
        <div className="text-5xl font-extrabold tabular-nums" style={{ color: good ? '#22c55e' : '#f59e0b' }}>
          {percent}%
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          {score} / {questions.length} bonne{score > 1 ? 's' : ''} reponse{score > 1 ? 's' : ''}.{' '}
          {good ? 'Bravo, ce point est bien maitrise !' : 'Relisez la lecon puis retentez le quiz.'}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className="btn-primary" onClick={restart}>
            Recommencer
          </button>
          <button type="button" className="btn-outline" onClick={onExit}>
            Choisir un autre quiz
          </button>
        </div>
      </div>
    );
  }

  const progress = Math.round((index / questions.length) * 100);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <h3 className="font-bold">{title}</h3>
          <span className="text-slate-500 dark:text-slate-400">
            {index + 1} / {questions.length}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill bg-brand" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="card space-y-4">
        <p className="text-base font-semibold leading-relaxed">{current.question}</p>

        <div className="space-y-2">
          {current.options.map((opt, i) => {
            const isCorrect = i === current.correctIndex;
            const isPicked = i === selected;
            let cls = 'border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800';
            if (answered) {
              if (isCorrect) cls = 'border-green-500 bg-green-50 dark:bg-green-500/10';
              else if (isPicked) cls = 'border-red-500 bg-red-50 dark:bg-red-500/10';
              else cls = 'border-slate-200 opacity-60 dark:border-slate-800';
            }
            return (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => choose(i)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${cls}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
                {answered && isCorrect && <span className="text-green-600 dark:text-green-400">&#10003;</span>}
                {answered && isPicked && !isCorrect && <span className="text-red-600 dark:text-red-400">&#10007;</span>}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
            <span className="font-semibold">{selected === current.correctIndex ? 'Correct. ' : 'Explication : '}</span>
            {current.explanation}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button type="button" className="btn-ghost" onClick={onExit}>
          Quitter
        </button>
        <button type="button" className="btn-primary" disabled={!answered} onClick={next}>
          {index + 1 >= questions.length ? 'Voir le resultat' : 'Question suivante'}
        </button>
      </div>
    </div>
  );
}

function QuizTab({ initialChapterId }: { initialChapterId: string | null }) {
  const quizBest = useRevisionStore((s) => s.quizBest);
  const [chapterId, setChapterId] = useState<string | null>(initialChapterId);

  const chapters = useMemo(() => GRAMMAR_CHAPTERS.filter((c) => quizForChapter(c.id).length > 0), []);

  if (chapterId) {
    const chapter = GRAMMAR_CHAPTERS.find((c) => c.id === chapterId);
    const questions = quizForChapter(chapterId);
    if (chapter && questions.length > 0) {
      return (
        <QuizRunner
          key={chapterId}
          chapterId={chapterId}
          questions={questions}
          title={chapter.title}
          onExit={() => setChapterId(null)}
        />
      );
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Choisissez un chapitre pour vous entrainer. Chaque QCM est corrige en direct, avec une explication.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {chapters.map((chapter) => {
          const n = quizForChapter(chapter.id).length;
          const best = quizBest[chapter.id];
          return (
            <button
              key={chapter.id}
              type="button"
              onClick={() => setChapterId(chapter.id)}
              className="card flex items-center justify-between gap-3 text-left transition-colors hover:border-brand"
            >
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{chapter.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {n} question{n > 1 ? 's' : ''}
                </p>
              </div>
              {best !== undefined ? (
                <span className="badge-brand shrink-0">{best}%</span>
              ) : (
                <span className="badge-muted shrink-0">Nouveau</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export default function GrammarSection() {
  const [tab, setTab] = useState<'theory' | 'quiz'>('theory');
  // Quand on lance un quiz depuis la theorie, on bascule sur l'onglet quiz.
  const [quizChapter, setQuizChapter] = useState<string | null>(null);
  // Incremente a chaque lancement pour forcer un remontage propre du quiz,
  // meme si l'on relance le meme chapitre.
  const [launch, setLaunch] = useState(0);

  function openQuiz(chapterId: string) {
    setQuizChapter(chapterId);
    setLaunch((n) => n + 1);
    setTab('quiz');
  }

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Grammaire</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tout le programme de la question de grammaire (seconde et premiere), avec la lecon et des QCM pour
          s'entrainer.
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setTab('theory')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'theory' ? 'bg-white shadow-sm dark:bg-slate-900' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Theorie
        </button>
        <button
          type="button"
          onClick={() => setTab('quiz')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'quiz' ? 'bg-white shadow-sm dark:bg-slate-900' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          S'entrainer
        </button>
      </div>

      {tab === 'theory' ? (
        <TheoryTab onQuiz={openQuiz} />
      ) : (
        <QuizTab key={`${quizChapter ?? 'none'}-${launch}`} initialChapterId={quizChapter} />
      )}
    </section>
  );
}
