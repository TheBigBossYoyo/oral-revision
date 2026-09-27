// ============================================================================
// components/Settings.tsx - Reglages de l'application
// ----------------------------------------------------------------------------
// Apparence (theme), parametres d'examen (date, objectif quotidien), audio
// (voix humaine Edge TTS, voix Web Speech de repli, vitesse, volume, hauteur,
// pause) et gestion des donnees (export / import JSON, exemple, reinitialisation).
// ============================================================================

import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { useVoices } from '../audio/useSpeechLoop';
import { EDGE_FR_VOICES } from '../audio/edgeVoices';
import { downloadBackup, parseBackup } from '../storage';
import AudioLoopButton from './AudioLoopButton';

const AUDIO_TEST_TEXT =
  'Ceci est un essai de la voix de synthese. Le rythme et la hauteur peuvent etre ajustes ci-dessus.';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const HEALTH_URL = `${API_BASE}/api/health`;

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const orals = useStore((s) => s.orals);
  const streak = useStore((s) => s.streak);
  const setTheme = useStore((s) => s.setTheme);
  const setExamDate = useStore((s) => s.setExamDate);
  const setDailyNewTarget = useStore((s) => s.setDailyNewTarget);
  const setAudioSettings = useStore((s) => s.setAudioSettings);
  const importBackup = useStore((s) => s.importBackup);
  const resetAll = useStore((s) => s.resetAll);
  const loadSample = useStore((s) => s.loadSample);

  const voices = useVoices();
  const audio = settings.audio;

  // Sonde de disponibilite du backend (voix humaine). null = en cours de test.
  const [ttsAvailable, setTtsAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(HEALTH_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setTtsAvailable(Boolean(d?.tts));
      })
      .catch(() => {
        if (!cancelled) setTtsAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ttsStatusLabel =
    ttsAvailable === null
      ? 'Verification du backend en cours...'
      : ttsAvailable
        ? 'Backend detecte : la voix humaine est disponible.'
        : 'Backend non detecte : la voix du navigateur sera utilisee.';
  const ttsStatusClass =
    ttsAvailable === null
      ? 'text-slate-500 dark:text-slate-400'
      : ttsAvailable
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-amber-600 dark:text-amber-400';

  const handleExport = () => downloadBackup({ orals, settings, streak });

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const state = parseBackup(text);
      importBackup(state);
      window.alert('Sauvegarde importee avec succes.');
    } catch (err) {
      window.alert(`Import impossible : ${(err as Error).message}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleReset = () => {
    if (window.confirm('Tout effacer (oraux, reglages, progression) ? Pensez a exporter avant.')) {
      resetAll();
    }
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold">Reglages</h2>

      {/* -------- Apparence -------- */}
      <div className="card space-y-3">
        <h3 className="font-semibold">Apparence</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={settings.theme === 'light' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setTheme('light')}
          >
            Clair
          </button>
          <button
            type="button"
            className={settings.theme === 'dark' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setTheme('dark')}
          >
            Sombre
          </button>
        </div>
      </div>

      {/* -------- Examen -------- */}
      <div className="card grid gap-4 sm:grid-cols-2">
        <h3 className="col-span-full font-semibold">Examen et objectifs</h3>
        <label className="space-y-1">
          <span className="label">Date de l'examen</span>
          <input
            type="date"
            className="input"
            value={settings.examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="label">Nouveaux paragraphes / jour (minimum)</span>
          <input
            type="number"
            min={1}
            max={50}
            className="input"
            value={settings.dailyNewTarget}
            onChange={(e) => setDailyNewTarget(Number(e.target.value))}
          />
        </label>
      </div>

      {/* -------- Audio -------- */}
      <div className="card space-y-4">
        <h3 className="font-semibold">Audio (lecture en boucle)</h3>

        {/* Voix humaine (Edge TTS) : rendu tres naturel, gratuit, sans cle API. */}
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-brand"
            checked={audio.useHumanVoice}
            onChange={(e) => setAudioSettings({ useHumanVoice: e.target.checked })}
          />
          <span className="space-y-0.5">
            <span className="label block">Voix humaine (recommandee)</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Voix neuronale tres naturelle, gratuite et sans cle API. Necessite le
              backend local et une connexion Internet ; repli automatique sur la voix
              du navigateur sinon.
            </span>
            <span className={`block text-xs font-medium ${ttsStatusClass}`}>{ttsStatusLabel}</span>
          </span>
        </label>

        {audio.useHumanVoice && (
          <label className="space-y-1">
            <span className="label">Voix humaine francaise</span>
            <select
              className="select"
              value={audio.edgeVoice}
              onChange={(e) => setAudioSettings({ edgeVoice: e.target.value })}
            >
              {EDGE_FR_VOICES.map((v) => (
                <option key={v.shortName} value={v.shortName}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="space-y-1">
          <span className="label">
            Voix du navigateur{audio.useHumanVoice ? ' (repli hors-ligne)' : ''}
          </span>
          <select
            className="select"
            value={audio.voiceURI ?? ''}
            onChange={(e) => setAudioSettings({ voiceURI: e.target.value || null })}
          >
            <option value="">Automatique (meilleure voix francaise)</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang}){v.default ? ' - defaut' : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="label">Vitesse : {audio.rate.toFixed(2)}x</span>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              className="w-full accent-brand"
              value={audio.rate}
              onChange={(e) => setAudioSettings({ rate: Number(e.target.value) })}
            />
          </label>
          <label className="space-y-1">
            <span className="label">Volume : {Math.round(audio.volume * 100)} %</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              className="w-full accent-brand"
              value={audio.volume}
              onChange={(e) => setAudioSettings({ volume: Number(e.target.value) })}
            />
          </label>
          <label className="space-y-1">
            <span className="label">Hauteur : {audio.pitch.toFixed(1)}</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              className="w-full accent-brand"
              value={audio.pitch}
              onChange={(e) => setAudioSettings({ pitch: Number(e.target.value) })}
            />
          </label>
        </div>

        <label className="space-y-1">
          <span className="label">Pause entre deux boucles : {audio.loopPauseMs} ms</span>
          <input
            type="range"
            min={0}
            max={2000}
            step={100}
            className="w-full accent-brand"
            value={audio.loopPauseMs}
            onChange={(e) => setAudioSettings({ loopPauseMs: Number(e.target.value) })}
          />
        </label>

        <AudioLoopButton id="settings-audio-test" text={AUDIO_TEST_TEXT} label="Tester la voix" />
      </div>

      {/* -------- Donnees -------- */}
      <div className="card space-y-3">
        <h3 className="font-semibold">Donnees (100 % locales)</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Vos oraux sont stockes uniquement dans ce navigateur. Exportez regulierement une sauvegarde.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={handleExport}>
            Exporter (JSON)
          </button>
          <label className="btn-outline cursor-pointer">
            Importer (JSON)
            <input type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />
          </label>
          <button type="button" className="btn-outline" onClick={loadSample}>
            Ajouter l'oral d'exemple
          </button>
          <button type="button" className="btn-danger ml-auto" onClick={handleReset}>
            Tout effacer
          </button>
        </div>
      </div>
    </section>
  );
}
