// ============================================================================
// audio/useSpeechLoop.ts - Lecture audio en boucle (double moteur)
// ----------------------------------------------------------------------------
// Un SEUL paragraphe peut etre lu a la fois (controleur singleton au niveau du
// module). Lancer un nouveau paragraphe arrete automatiquement le precedent.
// Le texte affiche/sauvegarde n'est JAMAIS modifie : on applique uniquement un
// nettoyage LEGER (`cleanForSpeech`) a la chaine envoyee a la synthese.
//
// Deux moteurs, selectionnes automatiquement :
//
//  1. VOIX HUMAINE (Edge TTS, par defaut) - quand `useHumanVoice` est actif et
//     que l'appareil est en ligne. Le backend renvoie un MP3 neuronal tres
//     naturel (POST /api/tts) ; on le lit en boucle via un <audio>. Gratuit,
//     sans cle API.
//
//  2. NAVIGATEUR (Web Speech API) - repli AUTOMATIQUE si la voix humaine est
//     desactivee, indisponible, hors-ligne ou en cas d'erreur reseau. Selection
//     de la meilleure voix francaise et lecture phrase par phrase.
//
// Dans les deux cas : lecture en BOUCLE INFINIE (pause `loopPauseMs` entre deux
// passages) jusqu'a ce que l'utilisateur reappuie sur le bouton (toggle -> stop).
// ============================================================================

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useStore } from '../store';
import type { AudioSettings } from '../types';
import { cleanForSpeech, splitSentences } from '../utils/textProcessing';
import { resolveEdgeVoice } from './edgeVoices';

/** Les options de lecture sont directement les reglages audio de l'application. */
export type SpeakOptions = AudioSettings;

const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const TTS_URL = `${API_BASE}/api/tts`;

type Listener = () => void;

/** Etat de lecture expose aux composants. */
interface PlaybackState {
  /** Id de la source active (en chargement OU en lecture), ou null si arret. */
  id: string | null;
  /** true tant que l'on telecharge l'audio humain avant le debut de la lecture. */
  loading: boolean;
}

/** Etat "au repos" (reference stable pour useSyncExternalStore). */
const IDLE: PlaybackState = { id: null, loading: false };

/** Delai max d'attente du backend avant repli sur la voix du navigateur (ms). */
const TTS_TIMEOUT_MS = 15_000;

/** Taille cible d'un morceau envoye au backend TTS. */
const TTS_CHUNK_TARGET_CHARS = 1_800;

/** Taille maximale absolue d'un morceau envoye au backend TTS. */
const TTS_CHUNK_MAX_CHARS = 2_200;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Decoupe les longs textes en morceaux assez courts pour Edge TTS.
 * Un gros mouvement peut depasser le temps de reponse du backend ; plusieurs
 * petits MP3 sont beaucoup plus fiables et gardent la voix API sur tout le texte.
 */
function splitForRemoteTts(text: string): string[] {
  const sentences = splitSentences(text);
  const units = sentences.length > 0 ? sentences : text.split(/(?<=\s)/u);
  const chunks: string[] = [];
  let current = '';

  const pushCurrent = () => {
    const trimmed = current.trim();
    if (trimmed) chunks.push(trimmed);
    current = '';
  };

  for (const unit of units) {
    const part = unit.trim();
    if (!part) continue;

    if (part.length > TTS_CHUNK_MAX_CHARS) {
      pushCurrent();
      for (let start = 0; start < part.length; start += TTS_CHUNK_MAX_CHARS) {
        const slice = part.slice(start, start + TTS_CHUNK_MAX_CHARS).trim();
        if (slice) chunks.push(slice);
      }
      continue;
    }

    const candidate = current ? `${current} ${part}` : part;
    if (candidate.length > TTS_CHUNK_TARGET_CHARS) {
      pushCurrent();
      current = part;
    } else {
      current = candidate;
    }
  }

  pushCurrent();
  return chunks;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ----------------------------------------------------------------------------
// Selection automatique de la voix la plus naturelle (moteur navigateur)
// ----------------------------------------------------------------------------

/**
 * Note une voix : plus le score est eleve, plus la voix est susceptible de
 * sonner naturelle. On privilegie le francais, les moteurs "haute qualite"
 * (Natural / Neural / Online / Google / Apple) et on penalise les voix
 * robotiques connues (eSpeak, voix "compact").
 */
function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  const lang = v.lang.toLowerCase();
  let score = 0;

  if (lang.startsWith('fr')) score += 100;
  if (lang === 'fr-fr') score += 20;

  // Moteurs modernes de haute qualite.
  if (/natural|neural|enhanced|premium|online|wavenet|studio/.test(name)) score += 60;
  if (/google/.test(name)) score += 40;
  // Voix Apple francaises reputees naturelles.
  if (/amelie|amélie|thomas|audrey|aurelie|aurélie|chantal|marie|virginie/.test(name)) score += 30;
  // Voix Microsoft "Online (Natural)".
  if (/microsoft/.test(name) && /natural|online/.test(name)) score += 25;

  // Penalites pour les moteurs robotiques.
  if (/espeak|e-speak|compact|pico|festival|robot/.test(name)) score -= 60;

  // Les voix distantes (serveur) sont generalement de meilleure qualite.
  if (!v.localService) score += 15;
  if (v.default) score += 5;

  return score;
}

/** Choisit la meilleure voix francaise disponible (ou la meilleure globale). */
function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const french = voices.filter((v) => v.lang.toLowerCase().startsWith('fr'));
  const pool = french.length > 0 ? french : voices;
  return [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null;
}

class SpeechLoopController {
  private state: PlaybackState = IDLE;
  private generation = 0;
  private listeners = new Set<Listener>();

  // Moteur navigateur (Web Speech).
  private keepAlive: ReturnType<typeof setInterval> | null = null;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  // Moteur voix humaine (Edge TTS via backend).
  private audioEl: HTMLAudioElement | null = null;
  private objectUrls = new Set<string>();
  private abort: AbortController | null = null;

  private get hasSpeech(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  private get hasAudio(): boolean {
    return typeof window !== 'undefined' && typeof window.Audio !== 'undefined';
  }

  /** L'audio est possible si au moins un moteur est disponible. */
  get supported(): boolean {
    return this.hasSpeech || this.hasAudio;
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): PlaybackState => this.state;
  getServerSnapshot = (): PlaybackState => IDLE;

  private setState(next: PlaybackState) {
    this.state = next;
    this.listeners.forEach((l) => l());
  }

  /** Vrai si la lecture (id/generation) a ete invalidee entre-temps. */
  private isStale(id: string, gen: number): boolean {
    return this.state.id !== id || this.generation !== gen;
  }

  /**
   * Resout la voix navigateur :
   *  - si l'utilisateur en a choisi une (URI) et qu'elle existe, on la prend ;
   *  - sinon, selection AUTOMATIQUE de la meilleure voix francaise disponible.
   */
  private pickVoice(uri: string | null): SpeechSynthesisVoice | null {
    if (!this.hasSpeech) return null;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;
    if (uri) {
      const exact = voices.find((v) => v.voiceURI === uri);
      if (exact) return exact;
    }
    return pickBestVoice(voices);
  }

  /** Demarre / arrete selon l'etat courant (utilise par le bouton audio). */
  toggle(id: string, text: string, opts: SpeakOptions) {
    if (this.state.id === id) this.stop();
    else this.play(id, text, opts);
  }

  /**
   * Lance la lecture en boucle d'un paragraphe (arrete tout le reste).
   * Choisit le moteur : voix humaine (Edge) si demandee + en ligne, sinon
   * synthese du navigateur.
   */
  play(id: string, text: string, opts: SpeakOptions) {
    if (!this.supported) return;
    this.teardown();
    const myGen = ++this.generation;

    const online = typeof navigator === 'undefined' || navigator.onLine !== false;
    const wantHuman = opts.useHumanVoice && this.hasAudio && online;

    if (wantHuman) {
      // En chargement : on telecharge le MP3 avant la lecture.
      this.setState({ id, loading: true });
      void this.playRemote(id, text, opts, myGen);
    } else {
      this.setState({ id, loading: false });
      this.playBrowser(id, text, opts, myGen);
    }
  }

  // -------------------------------------------------------------------------
  // Moteur 1 : voix humaine (Edge TTS via backend)
  // -------------------------------------------------------------------------

  private async playRemote(id: string, text: string, opts: SpeakOptions, gen: number) {
    const input = cleanForSpeech(text);
    if (!input) {
      this.stop();
      return;
    }

    const chunks = splitForRemoteTts(input);
    if (chunks.length === 0) {
      this.stop();
      return;
    }

    const urls: string[] = [];

    try {
      for (const chunk of chunks) {
        const url = await this.fetchRemoteChunk(chunk, opts);
        if (this.isStale(id, gen)) {
          URL.revokeObjectURL(url);
          return;
        }
        this.objectUrls.add(url);
        urls.push(url);
      }

      if (urls.length === 0) throw new Error('Aucun morceau audio genere.');

      this.playRemoteSequence(id, text, opts, gen, urls, 0);
      if (this.isStale(id, gen)) return;
      // Lecture demarree : on n'est plus en chargement.
      this.setState({ id, loading: false });
    } catch (err) {
      // Arret volontaire / nouvelle lecture : ne rien faire.
      if (this.isStale(id, gen)) return;
      // Echec reseau, backend absent ou timeout -> repli navigateur.
      this.fallbackToBrowser(id, text, opts, gen, `TTS distant indisponible : ${errorMessage(err)}`);
    }
  }

  private async fetchRemoteChunk(input: string, opts: SpeakOptions): Promise<string> {
    const controller = new AbortController();
    this.abort = controller;
    // Garde-fou : si le backend ne repond pas, on bascule sur le navigateur.
    const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

    try {
      const res = await fetch(TTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: input,
          voice: resolveEdgeVoice(opts.edgeVoice),
          rate: opts.rate,
          pitch: opts.pitch,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      if (blob.size === 0) throw new Error('Reponse audio vide.');

      const url = URL.createObjectURL(blob);
      if (this.abort === controller) this.abort = null;
      return url;
    } catch (err) {
      clearTimeout(timeout);
      if (this.abort === controller) this.abort = null;
      throw err;
    }
  }

  private playRemoteSequence(
    id: string,
    text: string,
    opts: SpeakOptions,
    gen: number,
    urls: string[],
    index: number,
  ) {
    if (this.isStale(id, gen)) return;
    const url = urls[index];
    if (!url) {
      this.fallbackToBrowser(id, text, opts, gen, 'Aucun morceau audio distant disponible.');
      return;
    }

    const audio = new Audio(url);
    audio.volume = clamp01(opts.volume);
    this.audioEl = audio;

    // Boucle infinie : on enchaine les morceaux, puis pause avant de repartir.
    audio.onended = () => {
      if (this.isStale(id, gen)) return;
      const nextIndex = index >= urls.length - 1 ? 0 : index + 1;
      const delay = nextIndex === 0 ? Math.max(0, opts.loopPauseMs) : 0;
      this.loopTimer = setTimeout(() => {
        if (this.isStale(id, gen)) return;
        this.playRemoteSequence(id, text, opts, gen, urls, nextIndex);
      }, delay);
    };
    audio.onerror = () => {
      if (this.isStale(id, gen)) return;
      this.fallbackToBrowser(id, text, opts, gen, 'Erreur de lecture du MP3 distant.');
    };

    void audio.play().catch((err) => {
      this.fallbackToBrowser(id, text, opts, gen, `Lecture MP3 distante refusee : ${errorMessage(err)}`);
    });
  }

  /** Bascule du moteur humain vers la synthese du navigateur (meme generation). */
  private fallbackToBrowser(id: string, text: string, opts: SpeakOptions, gen: number, reason: string) {
    if (this.isStale(id, gen)) return;
    console.warn('[audio] Repli sur la voix du navigateur.', { id, reason });
    this.clearRemote();
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    if (!this.hasSpeech) {
      this.stop();
      return;
    }
    this.setState({ id, loading: false });
    this.playBrowser(id, text, opts, gen);
  }

  // -------------------------------------------------------------------------
  // Moteur 2 : synthese du navigateur (Web Speech API)
  // -------------------------------------------------------------------------

  private playBrowser(id: string, text: string, opts: SpeakOptions, gen: number) {
    if (!this.hasSpeech) {
      this.stop();
      return;
    }

    // Decoupage en phrases (chaque phrase est nettoyee pour la synthese).
    const sentences = splitSentences(text)
      .map((s) => cleanForSpeech(s))
      .filter((s) => s.length > 0);
    const chunks = sentences.length > 0
      ? sentences
      : [cleanForSpeech(text)].filter((s) => s.length > 0);
    if (chunks.length === 0) {
      this.stop();
      return;
    }

    // Voix resolue UNE seule fois (auto-selection si aucune voix choisie).
    const voice = this.pickVoice(opts.voiceURI);
    const lang = voice?.lang || opts.lang || 'fr-FR';
    // Courte pause de respiration entre deux phrases (bornee).
    const sentencePause = Math.min(400, Math.max(80, Math.round(opts.loopPauseMs / 2)));

    const speakIndex = (index: number) => {
      if (this.isStale(id, gen)) return;
      const u = new SpeechSynthesisUtterance(chunks[index]);
      u.lang = lang;
      u.rate = opts.rate;
      u.volume = opts.volume;
      u.pitch = opts.pitch;
      if (voice) u.voice = voice;

      u.onend = () => {
        if (this.isStale(id, gen)) return;
        const isLast = index >= chunks.length - 1;
        // Fin du paragraphe -> pause de boucle puis reprise a la 1re phrase
        // (boucle infinie). Sinon -> pause de respiration + phrase suivante.
        const delay = isLast ? Math.max(0, opts.loopPauseMs) : sentencePause;
        const nextIndex = isLast ? 0 : index + 1;
        this.loopTimer = setTimeout(() => speakIndex(nextIndex), delay);
      };
      u.onerror = (e) => {
        // "interrupted"/"canceled" sont normaux quand on arrete volontairement.
        if (e.error && e.error !== 'interrupted' && e.error !== 'canceled') {
          if (!this.isStale(id, gen)) this.stop();
        }
      };
      window.speechSynthesis.speak(u);
    };

    this.startKeepAlive();
    speakIndex(0);
  }

  stop() {
    this.teardown();
    this.setState(IDLE);
  }

  /** Annule la lecture en cours sans notifier (usage interne). */
  private teardown() {
    this.generation += 1; // invalide les callbacks en attente (les deux moteurs)
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.abort) {
      this.abort.abort();
      this.abort = null;
    }
    this.stopKeepAlive();
    if (this.hasSpeech) window.speechSynthesis.cancel();
    this.clearRemote();
  }

  /** Libere l'element <audio> et l'URL objet du moteur humain. */
  private clearRemote() {
    if (this.audioEl) {
      this.audioEl.onended = null;
      this.audioEl.onerror = null;
      this.audioEl.pause();
      this.audioEl.src = '';
      this.audioEl = null;
    }
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls.clear();
  }

  /** Contournement du bug Chrome qui coupe les longues lectures (~15s). */
  private startKeepAlive() {
    this.stopKeepAlive();
    this.keepAlive = setInterval(() => {
      if (this.hasSpeech && window.speechSynthesis.speaking) {
        window.speechSynthesis.resume();
      }
    }, 10_000);
  }

  private stopKeepAlive() {
    if (this.keepAlive) {
      clearInterval(this.keepAlive);
      this.keepAlive = null;
    }
  }
}

export const speechController = new SpeechLoopController();

/**
 * Hook principal : expose l'etat de lecture et les actions toggle/stop.
 * Les reglages audio sont lus depuis le store (voix humaine, voix navigateur,
 * vitesse, volume...).
 */
export function useSpeechLoop() {
  const audio = useStore((s) => s.settings.audio);

  const state = useSyncExternalStore(
    speechController.subscribe,
    speechController.getSnapshot,
    speechController.getServerSnapshot,
  );

  const toggle = useCallback(
    (id: string, text: string) => speechController.toggle(id, text, audio),
    [audio],
  );
  const play = useCallback(
    (id: string, text: string) => speechController.play(id, text, audio),
    [audio],
  );
  const stop = useCallback(() => speechController.stop(), []);
  const isPlaying = useCallback((id: string) => state.id === id, [state.id]);
  const isLoading = useCallback(
    (id: string) => state.id === id && state.loading,
    [state.id, state.loading],
  );

  return {
    playingId: state.id,
    isPlaying,
    isLoading,
    toggle,
    play,
    stop,
    supported: speechController.supported,
  };
}

/** Hook utilitaire : liste des voix disponibles dans le navigateur. */
export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);

  return voices;
}
