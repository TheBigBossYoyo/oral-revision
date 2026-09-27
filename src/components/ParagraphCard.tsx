// ============================================================================
// components/ParagraphCard.tsx - Unite d'apprentissage (coeur de l'app)
// ----------------------------------------------------------------------------
// Affiche UN paragraphe avec 3 modes de revelation :
//   - "text"   : texte visible (lecture / memorisation visuelle)
//   - "hidden" : rappel actif, revelation progressive phrase par phrase
//   - "cloze"  : texte a trous (mots masques cliquables)
// Plus : lecture audio en boucle et notation 0..5 (repetition espacee).
//
// REGLE D'OR : le champ `text` n'est JAMAIS reformule. Les modes "hidden" et
// "cloze" ne font que MASQUER l'affichage ; le texte source reste intact.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import type { Oral, Paragraph, ReviewMode, Section } from '../types';
import { useStore } from '../store';
import { buildCloze, splitSentences, formatMinutes } from '../utils/textProcessing';
import { SCORE_INFO } from '../scheduleAlgorithm';
import {
  masteryColor,
  masterySoftStyle,
  detectedTypeLabel,
} from '../utils/masteryUi';
import AudioLoopButton from './AudioLoopButton';
import { useSpeechLoop } from '../audio/useSpeechLoop';

export type RevealMode = 'text' | 'hidden' | 'cloze';

interface Props {
  paragraph: Paragraph;
  oral: Oral;
  /** Section d'appartenance (pour l'en-tete et le contexte). */
  section?: Section;
  /** Mode de revelation initial. */
  defaultReveal?: RevealMode;
  /** Mode de revision enregistre dans l'historique a la notation. */
  reviewMode?: ReviewMode;
  /** Afficher l'en-tete (titre oral + section + maitrise). */
  showHeader?: boolean;
  /** Autoriser la notation 0..5 (faux en lecture seule). */
  gradable?: boolean;
  /** Callback apres notation (ex : passer au paragraphe suivant). */
  onGraded?: (score: number) => void;
}

export default function ParagraphCard({
  paragraph,
  oral,
  section,
  defaultReveal = 'text',
  reviewMode = 'visual',
  showHeader = true,
  gradable = true,
  onGraded,
}: Props) {
  const gradeParagraph = useStore((s) => s.gradeParagraph);
  const setParagraphAudioRange = useStore((s) => s.setParagraphAudioRange);
  const { playingId, play } = useSpeechLoop();

  const [reveal, setReveal] = useState<RevealMode>(defaultReveal);
  const [revealedSentences, setRevealedSentences] = useState(0);
  const [revealedWords, setRevealedWords] = useState<Set<number>>(new Set());
  const [rangePanelOpen, setRangePanelOpen] = useState(false);

  const sentences = useMemo(() => splitSentences(paragraph.text), [paragraph.text]);
  const clozeSegments = useMemo(
    () => buildCloze(paragraph.text, { keywords: paragraph.literaryDevices }),
    [paragraph.text, paragraph.literaryDevices],
  );

  // Plage audio (indices de phrases). Bornee a l'intervalle valide : un texte
  // edite peut contenir moins de phrases qu'au moment du choix.
  const lastIndex = Math.max(0, sentences.length - 1);
  const audioStart = Math.min(Math.max(0, paragraph.audioStartIndex ?? 0), lastIndex);
  // Fin par defaut = derniere phrase. La fin ne peut jamais preceder le debut.
  const audioEnd = Math.min(
    Math.max(audioStart, paragraph.audioEndIndex ?? lastIndex),
    lastIndex,
  );
  // Une plage est "personnalisee" des qu'elle ne couvre plus tout le paragraphe.
  const isCustomRange = audioStart > 0 || audioEnd < lastIndex;
  // Texte REELLEMENT lu en boucle : tout le paragraphe (defaut) ou la plage
  // [debut, fin] choisie. On reutilise le texte EXACT des phrases : aucune
  // reformulation, juste une portion exacte du paragraphe.
  const audioText = useMemo(() => {
    if (!isCustomRange) return paragraph.text;
    const sliced = sentences.slice(audioStart, audioEnd + 1).join(' ');
    return sliced || paragraph.text;
  }, [isCustomRange, audioStart, audioEnd, sentences, paragraph.text]);

  // Reinitialise l'etat de revelation a chaque changement de paragraphe / mode.
  useEffect(() => {
    setReveal(defaultReveal);
    setRevealedSentences(defaultReveal === 'text' ? sentences.length : 0);
    setRevealedWords(new Set());
    setRangePanelOpen(false);
  }, [paragraph.id, defaultReveal, sentences.length]);

  const switchReveal = (mode: RevealMode) => {
    setReveal(mode);
    setRevealedSentences(mode === 'text' ? sentences.length : 0);
    setRevealedWords(new Set());
  };

  const toggleWord = (index: number) => {
    setRevealedWords((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleGrade = (score: number) => {
    gradeParagraph(oral.id, paragraph.id, score, reviewMode);
    onGraded?.(score);
  };

  // Definit la plage audio [debut, fin] (en indices de phrases). Normalise les
  // bornes, persiste le reglage et relance la lecture si ce paragraphe joue.
  const commitAudioRange = (nextStart: number, nextEnd: number) => {
    let s = Math.min(Math.max(0, nextStart), lastIndex);
    let e = Math.min(Math.max(0, nextEnd), lastIndex);
    if (e < s) e = s; // la fin ne precede jamais le debut
    // Convention de stockage : 0 = depuis le debut, derniere phrase = jusqu'a la
    // fin. On stocke `undefined` dans ces cas (robuste si le texte est edite).
    const startVal = s > 0 ? s : undefined;
    const endVal = e < lastIndex ? e : undefined;
    setParagraphAudioRange(oral.id, paragraph.sectionId, paragraph.id, startVal, endVal);
    if (playingId === paragraph.id) {
      const next = sentences.slice(s, e + 1).join(' ');
      play(paragraph.id, next || paragraph.text);
    }
  };

  // Deplace une borne ; l'autre "suit" si elle la depasse (plage toujours valide).
  const setAudioStart = (index: number) => commitAudioRange(index, Math.max(index, audioEnd));
  const setAudioEnd = (index: number) => commitAudioRange(Math.min(index, audioStart), index);
  const resetAudioRange = () => commitAudioRange(0, lastIndex);

  const REVEAL_TABS: Array<{ mode: RevealMode; label: string }> = [
    { mode: 'text', label: 'Texte' },
    { mode: 'hidden', label: 'Cache' },
    { mode: 'cloze', label: 'Trous' },
  ];

  return (
    <article className="card space-y-4">
      {/* ---------------- En-tete ---------------- */}
      {showHeader && (
        <header className="flex flex-wrap items-center gap-2">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: masteryColor(paragraph.masteryScore) }}
            title={SCORE_INFO[Math.max(0, Math.min(5, paragraph.masteryScore))].label}
          />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {oral.title}
          </span>
          {section && (
            <span className="badge-muted">
              {detectedTypeLabel(section.detectedType)}
              {section.movementNumber ? ` ${section.movementNumber}` : ''}
            </span>
          )}
          <span className="ml-auto text-xs text-slate-400">
            {formatMinutes(paragraph.estimatedMinutes)}
          </span>
        </header>
      )}

      {section && showHeader && section.originalHeading && (
        <p className="text-sm font-medium italic text-slate-500 dark:text-slate-400">
          {section.originalHeading}
        </p>
      )}

      {/* ---------------- Selecteur de mode ---------------- */}
      <div className="inline-flex rounded-xl border border-slate-200 p-0.5 dark:border-slate-700">
        {REVEAL_TABS.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            onClick={() => switchReveal(tab.mode)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
              reveal === tab.mode
                ? 'bg-brand text-white'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---------------- Contenu ---------------- */}
      <div className="min-h-[3rem]">
        {reveal === 'text' && <p className="reading-text">{paragraph.text}</p>}

        {reveal === 'hidden' && (
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
                    title={shown ? undefined : 'Cliquer pour reveler'}
                  >
                    {shown ? `${sentence} ` : `${'\u2588'.repeat(Math.min(40, sentence.length))} `}
                  </span>
                );
              })}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-outline"
                disabled={revealedSentences >= sentences.length}
                onClick={() => setRevealedSentences((n) => Math.min(sentences.length, n + 1))}
              >
                Phrase suivante
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setRevealedSentences(sentences.length)}
              >
                Tout afficher
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setRevealedSentences(0)}
              >
                Masquer
              </button>
            </div>
          </div>
        )}

        {reveal === 'cloze' && (
          <div className="space-y-3">
            <p className="reading-text leading-loose">
              {clozeSegments.map((seg, idx) => {
                if (!seg.masked) return <span key={idx}>{seg.text}</span>;
                const revealedWord = revealedWords.has(idx);
                return (
                  <span
                    key={idx}
                    onClick={() => toggleWord(idx)}
                    className="cloze-blank"
                    style={revealedWord ? undefined : { color: 'transparent' }}
                    title={revealedWord ? 'Cliquer pour re-masquer' : 'Cliquer pour reveler'}
                  >
                    {revealedWord ? seg.text : '\u00A0'.repeat(Math.max(2, seg.text.length))}
                  </span>
                );
              })}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setRevealedWords(new Set(clozeSegments.map((_, i) => i)))}
              >
                Tout reveler
              </button>
              <button type="button" className="btn-ghost" onClick={() => setRevealedWords(new Set())}>
                Tout masquer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------------- Procedes / citations ---------------- */}
      {(paragraph.literaryDevices.length > 0 || paragraph.quotes.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {paragraph.literaryDevices.map((d, i) => (
            <span key={`d-${i}`} className="badge-brand">
              {d}
            </span>
          ))}
          {paragraph.quotes.map((q, i) => (
            <span key={`q-${i}`} className="badge-muted" title={q}>
              &laquo; {q.length > 40 ? `${q.slice(0, 40)}\u2026` : q} &raquo;
            </span>
          ))}
        </div>
      )}

      {/* ---------------- Actions ---------------- */}
      <footer className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <AudioLoopButton id={paragraph.id} text={audioText} />

        {sentences.length > 1 && (
          <button
            type="button"
            onClick={() => setRangePanelOpen((o) => !o)}
            className={`btn-ghost text-xs ${
              isCustomRange ? '!text-brand-700 dark:!text-brand-100' : ''
            }`}
            aria-expanded={rangePanelOpen}
            title="Choisir la plage de phrases lue en boucle (debut et fin)"
          >
            <span>
              {isCustomRange
                ? `Plage : phrases ${audioStart + 1}-${audioEnd + 1}/${sentences.length}`
                : 'Plage audio'}
            </span>
            <span aria-hidden>{rangePanelOpen ? '\u25B4' : '\u25BE'}</span>
          </button>
        )}

        {gradable && (
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <span className="label mr-1 hidden sm:inline">Note</span>
            {SCORE_INFO.map((info) => (
              <button
                key={info.score}
                type="button"
                onClick={() => handleGrade(info.score)}
                className="h-9 w-9 rounded-lg text-sm font-bold text-white transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{ backgroundColor: masteryColor(info.score) }}
                title={`${info.label} - ${info.description}`}
                aria-label={`Noter ${info.score} : ${info.label}`}
              >
                {info.score}
              </button>
            ))}
          </div>
        )}
      </footer>

      {/* ---------------- Plage audio (debut + fin, par phrase) ---------------- */}
      {rangePanelOpen && sentences.length > 1 && (
        <div className="card-soft space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="label">
              Lire de la phrase {audioStart + 1} a la phrase {audioEnd + 1}
            </span>
            {isCustomRange && (
              <button
                type="button"
                className="btn-ghost !px-2.5 !py-1 text-xs"
                onClick={resetAudioRange}
              >
                Tout le paragraphe
              </button>
            )}
          </div>
          <ol className="space-y-1">
            {sentences.map((sentence, idx) => {
              const inRange = idx >= audioStart && idx <= audioEnd;
              const isStart = idx === audioStart;
              const isEnd = idx === audioEnd;
              return (
                <li
                  key={idx}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                    isStart || isEnd ? 'bg-brand/10 ring-1 ring-brand/40' : ''
                  }`}
                >
                  <span
                    aria-hidden
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold ${
                      inRange
                        ? 'bg-brand text-white'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      inRange
                        ? 'text-slate-600 dark:text-slate-300'
                        : 'text-slate-400 line-through decoration-slate-300 dark:text-slate-500 dark:decoration-slate-600'
                    }`}
                    title={sentence}
                  >
                    {sentence}
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setAudioStart(idx)}
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-colors ${
                        isStart
                          ? 'bg-brand text-white'
                          : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'
                      }`}
                      title="Commencer la lecture a cette phrase"
                      aria-pressed={isStart}
                    >
                      Debut
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudioEnd(idx)}
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-colors ${
                        isEnd
                          ? 'bg-brand text-white'
                          : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'
                      }`}
                      title="Terminer la lecture a cette phrase"
                      aria-pressed={isEnd}
                    >
                      Fin
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="text-xs text-slate-400">
            La lecture en boucle ira de la phrase &laquo; Debut &raquo; a la phrase
            &laquo; Fin &raquo; (incluses).
          </p>
        </div>
      )}

      {gradable && (
        <div className="text-right">
          <span className="badge" style={masterySoftStyle(paragraph.masteryScore)}>
            Maitrise : {SCORE_INFO[Math.max(0, Math.min(5, paragraph.masteryScore))].label}
          </span>
        </div>
      )}
    </article>
  );
}
