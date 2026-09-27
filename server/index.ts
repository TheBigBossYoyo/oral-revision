// ============================================================================
// server/index.ts - Backend local Express
// ----------------------------------------------------------------------------
// Role : appeler Gemini sans exposer la cle API au navigateur + servir une voix
// humaine (Edge TTS) sans cle API.
// Routes :
//   GET  /api/health      -> etat du backend (cle presente ? modele ? tts ?)
//   POST /api/parse-oral  -> { rawText } => ParseResult (Gemini ou fallback)
//   GET  /api/tts/voices  -> catalogue des voix humaines disponibles
//   POST /api/tts         -> { text, voice, rate, pitch } => flux audio MP3
// ============================================================================

import dotenv from 'dotenv';
// Charge en priorite server/.env, puis .env a la racine (sans ecraser).
dotenv.config({ path: './server/.env' });
dotenv.config();

import express from 'express';
import cors from 'cors';
import { MsEdgeTTS, OUTPUT_FORMAT, ProsodyOptions } from 'msedge-tts';
import { parseOral } from './gemini';
import { DEFAULT_EDGE_VOICE, EDGE_FR_VOICES, isKnownEdgeVoice } from '../src/audio/edgeVoices';

/** Borne une valeur dans l'intervalle [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convertit un multiplicateur de vitesse (0.5..1.5, 1 = normal) en variation
 * relative SSML attendue par Edge TTS, ex : 0.95 -> "-5%", 1.1 -> "+10%".
 */
function toRatePct(rate: number): string {
  const pct = Math.round((clamp(rate, 0.5, 1.5) - 1) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

/**
 * Convertit une hauteur (0..2, 1 = normal) en variation relative en Hertz,
 * ex : 1 -> "+0Hz", 1.2 -> "+10Hz", 0.8 -> "-10Hz".
 */
function toPitchHz(pitch: number): string {
  const hz = Math.round((clamp(pitch, 0, 2) - 1) * 50);
  return `${hz >= 0 ? '+' : ''}${hz}Hz`;
}

/**
 * Nettoyage defensif avant envoi a Edge TTS.
 * `msedge-tts` construit du SSML en interne : des caracteres XML bruts comme
 * `<` ou `&` peuvent produire un flux MP3 vide sans erreur explicite.
 */
function sanitizeTtsText(text: string): string {
  return text
    .replace(/&/g, ' et ')
    .replace(/[<>]/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    hasKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'ma_cle_api'),
    // La voix humaine (Edge TTS) ne necessite aucune cle : toujours disponible
    // tant que le backend tourne et a acces a Internet.
    tts: true,
  });
});

app.post('/api/parse-oral', async (req, res) => {
  const rawText = typeof req.body?.rawText === 'string' ? req.body.rawText : '';
  if (!rawText.trim()) {
    res.status(400).json({ error: 'Champ "rawText" manquant ou vide.' });
    return;
  }
  try {
    const result = await parseOral(rawText);
    res.json(result);
  } catch (err) {
    console.error('[server] Erreur /api/parse-oral :', err);
    res.status(500).json({ error: 'Erreur interne lors de l\'analyse.' });
  }
});

// --------------------------------------------------------------------------
// Voix humaine (Edge TTS) - gratuite, sans cle API.
// --------------------------------------------------------------------------

/** Catalogue statique des voix humaines proposees (aucun appel reseau). */
app.get('/api/tts/voices', (_req, res) => {
  res.json({ voices: EDGE_FR_VOICES, defaultVoice: DEFAULT_EDGE_VOICE });
});

/**
 * Synthese vocale "humaine" : renvoie un flux audio MP3 genere par Edge TTS.
 * Le texte recu sert UNIQUEMENT a la synthese (sortie jetable) : il n'est ni
 * stocke ni renvoye, et le texte affiche cote client n'est jamais modifie.
 */
app.post('/api/tts', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text : '';
  if (!text.trim()) {
    res.status(400).json({ error: 'Champ "text" manquant ou vide.' });
    return;
  }
  const voice = isKnownEdgeVoice(req.body?.voice) ? (req.body.voice as string) : DEFAULT_EDGE_VOICE;
  const rate = Number.isFinite(req.body?.rate) ? Number(req.body.rate) : 1;
  const pitch = Number.isFinite(req.body?.pitch) ? Number(req.body.pitch) : 1;
  // Borne la taille de l'entree pour eviter des syntheses interminables.
  const input = sanitizeTtsText(text).slice(0, 5000);
  if (!input) {
    res.status(400).json({ error: 'Champ "text" vide apres nettoyage audio.' });
    return;
  }

  const tts = new MsEdgeTTS();
  let closed = false;
  const closeTts = () => {
    if (closed) return;
    closed = true;
    try {
      tts.close();
    } catch {
      // Connexion deja fermee : rien a faire.
    }
  };

  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const options = new ProsodyOptions();
    options.rate = toRatePct(rate);
    options.pitch = toPitchHz(pitch);

    const { audioStream } = tts.toStream(input, options);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');

    audioStream.on('error', (err: unknown) => {
      console.error('[server] Erreur flux TTS :', err);
      closeTts();
      if (!res.headersSent) res.status(502).json({ error: 'Synthese vocale indisponible.' });
      else res.end();
    });
    audioStream.on('end', closeTts);
    // Client deconnecte (navigation, stop) -> on libere la connexion WebSocket.
    res.on('close', closeTts);

    audioStream.pipe(res);
  } catch (err) {
    console.error('[server] Erreur /api/tts :', err);
    closeTts();
    if (!res.headersSent) res.status(502).json({ error: 'Synthese vocale indisponible.' });
  }
});

const PORT = Number(process.env.PORT) || 8787;
app.listen(PORT, () => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'ma_cle_api');
  console.log(`[server] Backend Gemini sur http://localhost:${PORT}`);
  console.log(`[server] Modele : ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}`);
  console.log('[server] Voix humaine (Edge TTS) : POST /api/tts (sans cle API)');
  if (!hasKey) {
    console.warn('[server] ATTENTION : GEMINI_API_KEY non configuree -> le decoupage local sera utilise.');
  }
});
