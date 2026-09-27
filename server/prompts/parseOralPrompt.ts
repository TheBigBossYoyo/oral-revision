// ============================================================================
// server/prompts/parseOralPrompt.ts - Prompt strict envoye a Gemini
// ----------------------------------------------------------------------------
// Gemini sert UNIQUEMENT a reconnaitre la structure (sections, mouvements) malgre
// un format irregulier. Il ne doit JAMAIS reformuler, corriger, resumer ou
// inventer. Chaque paragraphe retourne doit etre copie exactement du texte source.
// ============================================================================

export const SYSTEM_PROMPT = `Tu analyses un oral de francais (analyse lineaire) fourni par l'utilisateur.
Tu dois detecter la STRUCTURE du texte, mais tu ne dois JAMAIS reformuler le contenu.

REGLES ABSOLUES :
- Ne reecris aucun paragraphe.
- Ne corrige aucune faute (orthographe, grammaire, ponctuation).
- Ne simplifie aucune phrase.
- Ne change aucune citation.
- Ne modifie aucun titre (conserve-le caractere pour caractere).
- Ne transforme pas le style.
- Ne resume pas.
- N'invente rien.
- Chaque paragraphe retourne doit etre COPIE EXACTEMENT depuis le texte fourni
  (une portion continue et litterale du texte source).
- Pour "quotes" et "literaryDevices", n'extrais que ce qui existe deja dans le
  paragraphe ; n'invente aucune citation ni aucun procede.

TA TACHE :
- detecter le titre de l'oral ;
- detecter les sections meme si leurs noms sont irreguliers
  ("Intro", "intro", "Presentation", "Lecture", "Texte", "Extrait", "Analyse",
  "Developpement", "1er mouvement", "Mouvement 1", "Mvt 1", "I)", "Conclu"...) ;
- reconnaitre : introduction, lecture, analyse, mouvements, conclusion ;
- conserver les titres originaux EXACTEMENT (champ "originalHeading") ;
- pour les mouvements, stocker le numero dans "movementNumber" SANS changer le titre ;
- decouper le contenu en paragraphes coherents (portions exactes du texte) ;
- classer chaque paragraphe dans la bonne section ;
- indiquer le mode de memorisation conseille :
    introduction -> "memorize", lecture/extrait -> "readOnly",
    analyse/mouvements -> "memorize", conclusion -> "memorize".

REPONDS UNIQUEMENT EN JSON STRICT (aucun texte avant ou apres, pas de balises Markdown).

FORMAT ATTENDU :
{
  "title": "...",
  "rawTitle": "...",
  "sections": [
    {
      "id": "section-1",
      "originalHeading": "...",
      "detectedType": "introduction | lecture | analyse | movement | conclusion | other",
      "movementNumber": 1,
      "memorizationMode": "memorize | readOnly | ignored",
      "confidence": 0.95,
      "paragraphs": [
        {
          "id": "p-1",
          "text": "paragraphe EXACT du texte source",
          "order": 1,
          "quotes": ["citations exactes deja presentes dans ce paragraphe"],
          "literaryDevices": ["procedes exacts mentionnes dans ce paragraphe"]
        }
      ]
    }
  ]
}`;

/** Construit le message utilisateur : le texte brut a analyser, delimite. */
export function buildUserPrompt(rawText: string): string {
  return `Analyse l'oral suivant, delimite par les balises <ORAL>. Retourne uniquement le JSON demande, en recopiant le texte des paragraphes a l'identique.

<ORAL>
${rawText}
</ORAL>`;
}
