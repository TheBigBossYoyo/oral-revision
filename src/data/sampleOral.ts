// ============================================================================
// sampleOral.ts - Oral d'exemple prechargé (pour tester l'application)
// ----------------------------------------------------------------------------
// Les en-tetes sont volontairement IRREGULIERS ("Intro", "Mvt 1", "III)"...)
// afin de demontrer la detection de structure. Le contenu reste un exemple ;
// remplacez-le par vos vrais oraux via la page d'import.
// ============================================================================

import type { Oral } from '../types';
import { parseOralFallback } from '../utils/parseOralFallback';
import { buildOralFromParsed } from '../utils/oralFactory';

export const SAMPLE_ORAL_RAW = `Analyse linéaire — Le Mariage de Figaro, Beaumarchais (1784), Acte I scène 1

Intro
Le Mariage de Figaro de Beaumarchais, créé en 1784, est une comédie qui prolonge Le Barbier de Séville. Dès la première scène, le dramaturge installe l'intrigue dans l'espace même du conflit : la chambre que le comte destine aux futurs époux. Nous verrons comment cette scène d'exposition, sous des dehors légers, met en place une mécanique de la rivalité et de la révolte.

Lecture
FIGARO. — Dix-neuf pieds sur vingt-six. SUZANNE. — Tiens, Figaro, voilà mon petit chapeau : le trouves-tu mieux ainsi ? FIGARO. — Sans doute, ma charmante. Oh ! que ce joli bouquet de fleurs d'oranger posé ce matin sur la tête d'une jolie fille est doux à l'œil d'un époux !

Mvt 1 — les 4 premières répliques : Le quiproquo aveugle
Figaro ouvre la scène en mesurant la chambre : « Dix-neuf pieds sur vingt-six. » Cette didascalie chiffrée ancre l'action dans le concret et révèle un personnage pragmatique, tourné vers l'avenir matériel du couple. La prose mathématique contraste avec l'élan amoureux de Suzanne.
Suzanne, elle, se préoccupe de sa parure : « le trouves-tu mieux ainsi ? » L'opposition entre les deux préoccupations crée un comique de situation : Figaro ne voit pas encore le danger que cette chambre représente. Son aveuglement est souligné par l'ironie dramatique, car le spectateur, lui, pressent le piège.

2ème mouvement : la révélation du piège
Le dialogue bascule lorsque Suzanne dévoile les intentions du comte. La chambre, si commode, devient le symbole de la menace seigneuriale. Le champ lexical de la proximité — « à deux pas », « sonnette » — transforme l'espace domestique en espace de surveillance.
Figaro comprend alors la stratégie d'Almaviva. Sa repartie vive, faite de phrases brèves, traduit le passage de l'insouciance à la lucidité. Le rythme s'accélère, marquant l'éveil de l'esprit critique du valet.

III) Le renversement : un valet qui défie son maître
La célèbre apostrophe « Si vous voulez, monsieur le Comte, cessez de me la faire désirer » inaugure la révolte. Figaro n'est plus le serviteur docile : il devient l'égal rusé de son maître. Beaumarchais esquisse ici la critique sociale qui fera scandale.
Le monologue intérieur, par ses questions oratoires, donne au valet une profondeur inédite. Le rire se charge d'une portée politique : derrière la comédie se dessine la contestation des privilèges.

Conclu
Cette scène d'exposition remplit sa fonction tout en dépassant le cadre du simple comique : elle installe le conflit, dessine des personnages vifs et amorce une satire sociale. Ouverture : on peut la rapprocher du monologue de l'acte V, où Figaro pousse la critique jusqu'à sa pleine mesure.`;

/** Construit l'oral d'exemple complet (utilise le decoupage local). */
export function createSampleOral(): Oral {
  const parsed = parseOralFallback(SAMPLE_ORAL_RAW);
  return buildOralFromParsed(parsed, SAMPLE_ORAL_RAW);
}
