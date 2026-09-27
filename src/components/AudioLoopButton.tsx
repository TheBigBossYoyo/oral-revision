// ============================================================================
// components/AudioLoopButton.tsx - Bouton de lecture audio en boucle
// ----------------------------------------------------------------------------
// Lit un texte en boucle via la Web Speech API (voir useSpeechLoop). Un seul
// paragraphe est lu a la fois dans toute l'application : declencher un autre
// bouton arrete automatiquement le precedent. Le texte affiche/sauvegarde n'est
// jamais modifie (seul un nettoyage leger est applique a la synthese vocale).
// ============================================================================

import { useSpeechLoop } from '../audio/useSpeechLoop';

interface Props {
  /** Identifiant unique de la source audio (souvent l'id du paragraphe). */
  id: string;
  /** Texte EXACT a lire (le nettoyage audio est interne, non destructif). */
  text: string;
  /** Libelle facultatif (sinon "Ecouter" / "Stop"). */
  label?: string;
  /** Variante compacte (icone seule). */
  compact?: boolean;
  className?: string;
}

export default function AudioLoopButton({ id, text, label, compact = false, className = '' }: Props) {
  const { isPlaying, isLoading, toggle, supported } = useSpeechLoop();

  // Navigateur sans aucun moteur audio : on masque simplement le bouton.
  if (!supported) return null;

  const playing = isPlaying(id);
  const loading = isLoading(id);

  // Priorite a l'etat "chargement" (telechargement de la voix humaine).
  const icon = loading ? '\u231B' : playing ? '\u23F9' : '\uD83D\uDD0A';
  const defaultLabel = loading ? 'Chargement...' : playing ? 'Arreter' : 'Ecouter';

  return (
    <button
      type="button"
      onClick={() => toggle(id, text)}
      className={`${playing ? 'btn-primary' : 'btn-outline'} ${className}`}
      aria-pressed={playing}
      aria-busy={loading}
      title={playing ? 'Arreter la lecture en boucle' : 'Ecouter en boucle'}
    >
      <span aria-hidden className={loading ? 'animate-pulse' : ''}>{icon}</span>
      {!compact && <span>{label ?? defaultLabel}</span>}
    </button>
  );
}
