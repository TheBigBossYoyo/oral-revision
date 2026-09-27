# OralRevision

Application web **locale / PWA** pour apprendre par coeur ses analyses lineaires de francais
(les "oraux") avant l'examen. Vous collez le texte de vos oraux, l'application detecte
automatiquement leur structure (introduction, mouvements, conclusion) grace a Gemini, puis vous
aide a les memoriser par la lecture active, l'ecoute en boucle et la repetition espacee.

> **Regle d'or du projet :** Gemini ne reecrit jamais votre texte. Il sert uniquement a
> **decouper et classer** ce que vous avez ecrit. Le contenu affiche, appris et lu a voix haute
> reste **mot pour mot** celui que vous avez colle - titres des mouvements compris.

---

## Sommaire

1. [Fonctionnalites](#fonctionnalites)
2. [Prerequis](#prerequis)
3. [Installation](#installation)
4. [Configuration de la cle Gemini](#configuration-de-la-cle-gemini)
5. [Lancer l'application](#lancer-lapplication)
6. [Architecture](#architecture)
7. [Le principe anti-reformulation](#le-principe-anti-reformulation)
8. [La repetition espacee et le planning](#la-repetition-espacee-et-le-planning)
9. [Les modes d'etude](#les-modes-detude)
10. [Structure des fichiers](#structure-des-fichiers)
11. [Donnees et confidentialite](#donnees-et-confidentialite)
12. [Oral d'exemple preinstalle](#oral-dexemple-preinstalle)
13. [Scripts npm](#scripts-npm)
14. [Depannage](#depannage)

---

## Fonctionnalites

- **Import intelligent** : collez un oral en texte brut, la structure (intro / mouvements /
  conclusion / lecture) est detectee automatiquement.
- **Validation avant enregistrement** : une page de relecture vous montre le decoupage propose,
  signale les avertissements et vous laisse tout corriger avant de sauvegarder.
- **Editeur complet** : modifier le texte, fusionner / diviser des paragraphes, renommer les
  mouvements, changer le mode de memorisation d'une section.
- **Lecture active** : texte cache puis devoile phrase par phrase, ou mode "texte a trous".
- **Audio en boucle** : ecoute repetee d'un paragraphe via la synthese vocale du navigateur
  (Web Speech API), avec choix de la voix, de la vitesse et de la pause entre repetitions.
- **Repetition espacee** : chaque paragraphe possede un niveau de maitrise (0 a 5) qui pilote sa
  prochaine date de revision ; les intervalles se compressent a l'approche de l'examen.
- **Session du jour** : une file de revision priorisee (jamais vus, en retard, points faibles).
- **Modes speciaux** : Points faibles, Examen blanc, Recitation complete, Texte a trous, Plan seul.
- **Tableau de bord** : compte a rebours, avance / retard sur le planning, statistiques, serie de
  jours d'etude.
- **Import / export** : sauvegarde de toutes vos donnees dans un fichier JSON.
- **Fonctionne hors-ligne** : apres l'import, plus besoin d'Internet ni du backend (PWA).
- **Theme clair / sombre**.

---

## Prerequis

- **Node.js 18 ou plus** (teste avec Node 24).
- Un navigateur moderne (Chrome, Edge ou Safari recommandes pour la synthese vocale).
- **Optionnel** : une cle API Google Gemini pour l'import automatique. Sans cle, l'application
  bascule sur un analyseur local (decoupage par titres / lignes vides).

---

## Installation

```bash
# 1. Se placer dans le dossier du projet
cd OralRevision

# 2. Installer toutes les dependances (frontend + backend)
npm install
```

Une seule commande suffit : le frontend et le backend partagent le meme `package.json`.

---

## Configuration de la cle Gemini

Le backend local sert uniquement a **cacher votre cle API** (elle ne doit jamais se retrouver dans
le code du navigateur). Cette etape est **facultative** : sans elle, l'import utilise l'analyseur
local de secours.

1. Obtenez une cle sur https://aistudio.google.com/apikey
2. Copiez le fichier d'exemple :

   ```bash
   # Windows (PowerShell)
   Copy-Item server\.env.example server\.env

   # macOS / Linux
   cp server/.env.example server/.env
   ```

3. Ouvrez `server/.env` et renseignez votre cle :

   ```ini
   GEMINI_API_KEY=votre_cle_ici
   GEMINI_MODEL=gemini-2.5-flash
   PORT=8787
   ```

> `server/.env` est ignore par Git : votre cle ne sera jamais committee.

---

## Lancer l'application

### Tout lancer d'un coup (recommande)

Demarre le frontend (Vite) **et** le backend (Express) en parallele :

```bash
npm run dev
```

- Frontend : http://localhost:5173
- Backend  : http://localhost:8787 (le frontend l'appelle automatiquement via un proxy `/api`)

### Lancer separement

```bash
npm run dev:client   # uniquement le frontend (Vite)
npm run dev:server   # uniquement le backend (Express, rechargement a chaud)
```

### Version de production

```bash
npm run build        # genere le site statique optimise dans dist/
npm run preview      # sert le build de production en local
npm run server       # lance le backend seul (sans rechargement)
```

> **Usage sans backend :** une fois vos oraux importes, vous pouvez fermer le backend.
> L'application continue de fonctionner entierement hors-ligne avec les donnees deja enregistrees.

---

## Architecture

L'application est decoupee en deux parties independantes : un **frontend React** (toute
l'experience d'apprentissage, qui fonctionne seul) et un **mince backend Express** (un simple
relais securise vers Gemini).

```
                      +-------------------------------------------------+
                      |                   NAVIGATEUR                    |
                      |                                                 |
   Vous collez        |   React + Vite + Zustand + Tailwind             |
   un oral  --------> |                                                 |
                      |   App.tsx (coquille : nav, theme, routeur)      |
                      |     |                                           |
                      |     v                                           |
                      |   Vues (Dashboard, Import, Session, ...)        |
                      |     |                 |                         |
                      |     v                 v                         |
                      |   store (donnees) +  scheduleAlgorithm (SRS)    |
                      |     |                                           |
                      |     v                                           |
                      |   localStorage  <--- persistance automatique    |
                      +-------------------|-----------------------------+
                                          |  (uniquement a l'import)
                                          v  POST /api/parse-oral
                      +-------------------------------------------------+
                      |             BACKEND LOCAL (Express)             |
                      |   server/index.ts  ->  server/gemini.ts         |
                      |   - garde la cle API secrete                    |
                      |   - applique le prompt strict (parseOralPrompt) |
                      |   - renvoie un JSON de structure (pas de texte   |
                      |     reecrit)                                     |
                      +-------------------|-----------------------------+
                                          v
                                    Google Gemini
```

### Couches du frontend

| Couche                | Fichiers                                  | Role                                                        |
| --------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| Types                 | `src/types.ts`                            | Modele de donnees (Oral, Section, Paragraph, reglages...)   |
| Persistance           | `src/storage.ts`                          | Lecture / ecriture localStorage, export / import JSON       |
| Etat global           | `src/store.ts`                            | Source de verite (Zustand), sauvegarde auto a chaque action |
| Navigation            | `src/uiStore.ts`                          | Routeur interne base sur l'etat (non persiste)              |
| Logique d'apprentissage | `src/scheduleAlgorithm.ts`              | Repetition espacee, planning, statistiques, session du jour |
| Traitement texte      | `src/utils/textProcessing.ts`             | Decoupage en phrases, texte a trous, estimations            |
| Import                | `src/api/geminiParser.ts`                 | Appel backend + verification anti-reformulation             |
| Secours               | `src/utils/parseOralFallback.ts`          | Analyseur local quand le backend / Gemini est indisponible  |
| Audio                 | `src/audio/useSpeechLoop.ts`              | Lecture en boucle via Web Speech API                        |
| Interface             | `src/App.tsx`, `src/components/*`          | Coquille + toutes les vues et composants                    |

### Flux d'import

1. Vous collez le texte dans **OralImporter**.
2. `geminiParser` envoie le texte au backend (`POST /api/parse-oral`).
3. Le backend interroge Gemini avec un **prompt strict** qui impose un JSON de structure.
4. Chaque paragraphe renvoye est **verifie** : il doit etre une portion exacte du texte original.
   Sinon, un avertissement est ajoute.
5. La page **OralValidation** affiche le decoupage pour relecture / correction.
6. Apres validation, l'oral est enregistre dans le store (et donc dans localStorage).

Si le backend n'est pas lance ou n'a pas de cle, l'etape 2-3 est remplacee par
`parseOralFallback` (decoupage local par titres et lignes vides) : l'import reste possible.

---

## Le principe anti-reformulation

C'est la contrainte centrale du projet. Apprendre un oral par coeur n'a de sens que si le texte
n'est **jamais** modifie par la machine. Le projet l'applique a plusieurs niveaux :

1. **Prompt strict** (`server/prompts/parseOralPrompt.ts`) : Gemini recoit l'ordre explicite de
   ne pas corriger, ameliorer, simplifier, resumer ni reformuler ; de conserver les titres de
   mouvements exactement ; et de repondre **uniquement** par un JSON de structure dont chaque
   fragment de texte est copie tel quel depuis l'original.
2. **Sortie JSON imposee** : le backend demande une reponse au format JSON (`responseMimeType:
   application/json`), ce qui empeche toute prose libre.
3. **Verification cote client** (`src/api/geminiParser.ts` + `isExactSubstring`) : chaque
   paragraphe renvoye est compare au texte source. S'il n'en est pas une portion exacte, il est
   signale par un avertissement dans la page de validation - rien n'est accepte en silence.
4. **Aucun nettoyage destructif** : la preparation du texte pour l'audio ne touche ni au texte
   affiche ni au texte sauvegarde.

Autrement dit : Gemini ne fait que **poser des frontieres** (ou commence un mouvement, ou finit un
paragraphe) et **coller des etiquettes** (intro, mouvement 1, conclusion...). Le contenu reste le
votre, a la lettre.

---

## La repetition espacee et le planning

Chaque paragraphe possede un **niveau de maitrise** de 0 a 5. Apres chaque revision, vous notez
votre aisance et l'algorithme (`src/scheduleAlgorithm.ts`) recalcule la prochaine date.

| Score | Libelle        | Intervalle ideal      |
| ----- | -------------- | --------------------- |
| 0     | Inconnu        | aujourd'hui + demain  |
| 1     | Tres faible    | 1 jour                |
| 2     | Fragile        | 2 jours               |
| 3     | Correct        | ~4 jours              |
| 4     | Presque acquis | ~6 jours              |
| 5     | Maitrise       | ~14 jours             |

**Compression a l'approche de l'examen.** L'intervalle reel applique est :

```
intervalle = min(intervalle_ideal, max(1, floor(jours_restants / 2)))
```

Resultat : plus l'examen approche, plus les revisions se rapprochent automatiquement. Meme un
paragraphe "maitrise" sera revu une derniere fois avant le jour J ; la charge quotidienne
augmente mecaniquement dans la derniere ligne droite.

**Session du jour.** `buildDailySession` construit une file priorisee en melangeant :
paragraphes **jamais vus** (selon votre objectif quotidien), paragraphes **en retard**, et
**points faibles**, en alternant les oraux et les sections pour eviter la monotonie. Le tableau de
bord indique en permanence si vous etes **en avance ou en retard** sur le rythme necessaire pour
tout maitriser a temps.

---

## Les modes d'etude

| Mode                  | A quoi il sert                                                              |
| --------------------- | -------------------------------------------------------------------------- |
| **Session du jour**   | La file de revision priorisee, calculee pour tenir le planning.            |
| **Points faibles**    | Concentre la revision sur les paragraphes les moins maitrises.             |
| **Examen blanc**      | Tire des paragraphes au hasard pour se mettre en situation.                |
| **Recitation complete** | Affiche un oral en entier pour le reciter d'un trait.                     |
| **Texte a trous**     | Masque des mots-cles a retrouver (rappel actif).                           |
| **Plan seul**         | N'affiche que la structure (titres des mouvements) pour memoriser le plan. |

Chaque paragraphe se travaille avec : texte masque puis devoile progressivement, bouton d'**ecoute
en boucle**, et boutons de notation **0 a 5** qui alimentent la repetition espacee.

---

## Structure des fichiers

```
OralRevision/
├── index.html                      Point d'entree HTML
├── package.json                    Dependances + scripts (frontend & backend)
├── vite.config.ts                  Config Vite + PWA + proxy /api -> backend
├── tailwind.config.js              Theme Tailwind (couleurs, police de lecture)
├── postcss.config.js               PostCSS (Tailwind + autoprefixer)
├── tsconfig.json                   Config TypeScript
│
├── public/
│   └── icon.svg                    Icone de l'application (PWA)
│
├── src/
│   ├── main.tsx                    Montage de React
│   ├── App.tsx                     Coquille : barre laterale, theme, routeur de vues
│   ├── index.css                   Styles de base + classes reutilisables (Tailwind)
│   ├── vite-env.d.ts               Types d'environnement Vite / PWA
│   │
│   ├── types.ts                    Modele de donnees central
│   ├── storage.ts                  Persistance localStorage + export / import
│   ├── store.ts                    Etat global (Zustand) + sauvegarde auto
│   ├── uiStore.ts                  Navigation interne (non persistee)
│   ├── scheduleAlgorithm.ts        Repetition espacee, planning, statistiques
│   │
│   ├── api/
│   │   └── geminiParser.ts         Appel backend + verification anti-reformulation
│   │
│   ├── audio/
│   │   └── useSpeechLoop.ts        Lecture audio en boucle (Web Speech API)
│   │
│   ├── data/
│   │   └── sampleOral.ts           Oral d'exemple preinstalle
│   │
│   ├── utils/
│   │   ├── oralFactory.ts          Construction / reindexation des oraux
│   │   ├── parseOralFallback.ts    Analyseur local de secours
│   │   ├── textProcessing.ts       Phrases, texte a trous, estimations
│   │   └── masteryUi.ts            Couleurs et libelles d'interface
│   │
│   └── components/
│       ├── Dashboard.tsx           Tableau de bord
│       ├── OralImporter.tsx        Import d'un oral (collage de texte)
│       ├── OralValidation.tsx      Page de validation du decoupage
│       ├── OralEditor.tsx          Edition complete d'un oral
│       ├── OralList.tsx            Liste de tous les oraux
│       ├── OralCard.tsx            Vignette d'un oral
│       ├── ParagraphCard.tsx       Unite d'apprentissage (lecture / trous / audio / note)
│       ├── AudioLoopButton.tsx     Bouton d'ecoute en boucle
│       ├── ProgressStats.tsx       Barres de progression / maitrise
│       ├── StudySession.tsx        Mode "session du jour"
│       ├── WeakParagraphsMode.tsx  Mode "points faibles"
│       ├── ExamMode.tsx            Mode "examen blanc"
│       ├── FullOralMode.tsx        Mode "recitation complete"
│       ├── PlanOnlyMode.tsx        Mode "plan seul"
│       └── Settings.tsx            Reglages (date d'examen, objectif, audio, theme, donnees)
│
└── server/
    ├── index.ts                    Serveur Express (GET /api/health, POST /api/parse-oral)
    ├── gemini.ts                   Appel au SDK @google/genai
    ├── prompts/
    │   └── parseOralPrompt.ts      Prompt strict (structure uniquement, zero reformulation)
    └── .env.example                Modele de configuration (a copier en server/.env)
```

---

## Donnees et confidentialite

- **Tout reste dans votre navigateur.** Vos oraux et vos progres sont enregistres dans le
  `localStorage` de votre machine. Rien n'est envoye sur un serveur distant... a l'exception du
  texte transmis a Gemini **au moment de l'import** (et uniquement si vous utilisez le backend).
- **Sauvegarde auto.** Chaque modification est immediatement persistee.
- **Export / import.** Depuis les Reglages, exportez l'integralite de vos donnees dans un fichier
  JSON (pour sauvegarde ou transfert vers un autre appareil), et reimportez-le quand vous voulez.
- **Hors-ligne.** Grace a la PWA et au localStorage, l'application fonctionne sans connexion une
  fois chargee.

---

## Oral d'exemple preinstalle

Au tout premier lancement, un oral complet est preinstalle : **un extrait du Mariage de Figaro
(Beaumarchais)**, deja decoupe en mouvements. Il sert a decouvrir l'interface, tester les modes
d'etude et l'audio sans rien importer.

Vous pouvez le supprimer a tout moment, ou le recharger depuis le tableau de bord / les reglages.

---

## Scripts npm

| Script              | Action                                                            |
| ------------------- | ----------------------------------------------------------------- |
| `npm run dev`       | Lance frontend **et** backend en parallele (developpement).       |
| `npm run dev:client`| Lance uniquement le frontend (Vite).                              |
| `npm run dev:server`| Lance uniquement le backend (Express, rechargement a chaud).      |
| `npm run server`    | Lance le backend seul (sans rechargement).                        |
| `npm run build`     | Construit la version de production dans `dist/`.                  |
| `npm run preview`   | Sert localement le build de production.                           |
| `npm run typecheck` | Verifie tout le projet avec TypeScript (`tsc --noEmit`).          |

---

## Depannage

**L'import ne detecte pas bien la structure.**
Verifiez que le backend tourne (`npm run dev:server`) et que `server/.env` contient une cle valide.
Sinon, l'analyseur local prend le relais : separez clairement vos mouvements par des titres ou des
lignes vides. Dans tous les cas, la page de validation vous laisse tout corriger a la main.

**Aucun son lors de l'ecoute en boucle.**
La synthese vocale depend du navigateur. Chrome, Edge et Safari fonctionnent le mieux. Verifiez
qu'une voix francaise est disponible dans les Reglages et que le volume du systeme est actif.

**Le port 8787 est deja utilise.**
Changez `PORT` dans `server/.env` (et, si besoin, l'URL cible du proxy dans `vite.config.ts`).

**Je veux repartir de zero.**
Reglages -> reinitialiser les donnees. Pensez a exporter une sauvegarde JSON avant.

**`npm run dev` n'ouvre rien.**
Ouvrez manuellement http://localhost:5173. Verifiez qu'aucune autre application n'occupe ce port.
