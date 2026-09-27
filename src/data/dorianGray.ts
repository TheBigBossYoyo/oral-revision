// ============================================================================
// data/dorianGray.ts - Banque de questions pour l'entretien (2e partie de l'oral)
// ----------------------------------------------------------------------------
// Entrainement a la presentation et a la defense de l'oeuvre :
//   « Le Portrait de Dorian Gray » d'Oscar Wilde (1890/1891).
// Chaque question fournit des points-cles (a mobiliser) et une reponse modele
// (proposition de developpement). Contenu statique, hors-ligne.
//
// Rappel : a l'entretien, l'examinateur attend une presentation personnelle et
// argumentee de l'oeuvre choisie, puis un echange. Les reponses ci-dessous sont
// des supports a s'approprier, pas un texte a reciter mot pour mot.
// ============================================================================

export type OeuvreCategory =
  | 'auteur'
  | 'oeuvre'
  | 'personnages'
  | 'themes'
  | 'art'
  | 'style'
  | 'mythes'
  | 'personnel';

export interface OeuvreQuestion {
  id: string;
  category: OeuvreCategory;
  /** 1 = accessible, 2 = intermediaire, 3 = exigeant / question piege. */
  difficulty: 1 | 2 | 3;
  question: string;
  /** Points-cles a ne pas oublier dans la reponse. */
  keyPoints: string[];
  /** Reponse modele a s'approprier. */
  modelAnswer: string;
}

export interface CategoryMeta {
  id: OeuvreCategory;
  label: string;
  description: string;
}

export const OEUVRE_CATEGORIES: CategoryMeta[] = [
  { id: 'auteur', label: "L'auteur et le contexte", description: 'Oscar Wilde, l\'esthetisme, la fin du XIXe siecle.' },
  { id: 'oeuvre', label: "L'oeuvre : genre et intrigue", description: 'Genre, structure, resume, publication.' },
  { id: 'personnages', label: 'Les personnages', description: 'Dorian, Lord Henry, Basil, Sibyl Vane...' },
  { id: 'themes', label: 'Les themes', description: 'Beaute, jeunesse, hedonisme, double, peche.' },
  { id: 'art', label: "L'art et la preface", description: "L'art pour l'art, la preface, l'esthetisme." },
  { id: 'mythes', label: 'Mythes et intertextualite', description: 'Faust, Narcisse, le roman gothique.' },
  { id: 'style', label: "Le style et l'ecriture", description: 'Paradoxe, epigramme, dandysme, decadence.' },
  { id: 'personnel', label: 'Avis personnel et ouverture', description: 'Pourquoi cette oeuvre ? Rapprochements.' },
];

export const OEUVRE_TITLE = 'Le Portrait de Dorian Gray';
export const OEUVRE_AUTHOR = 'Oscar Wilde';

export const OEUVRE_QUESTIONS: OeuvreQuestion[] = [
  // ===================== AUTEUR / CONTEXTE =====================
  {
    id: 'd-auteur-1',
    category: 'auteur',
    difficulty: 1,
    question: 'Pouvez-vous presenter rapidement Oscar Wilde et situer l\'oeuvre dans son epoque ?',
    keyPoints: [
      'Ecrivain irlandais, 1854-1900',
      'Figure de proue de l\'esthetisme / du dandysme',
      'Fin de l\'epoque victorienne (Angleterre, fin XIXe)',
      'Unique roman de Wilde, publie en 1890 puis 1891',
    ],
    modelAnswer:
      "Oscar Wilde (1854-1900) est un ecrivain irlandais, dramaturge, poete et romancier, figure majeure de l'esthetisme et du dandysme de la fin du XIXe siecle. Le Portrait de Dorian Gray, son unique roman, parait d'abord en 1890 dans une revue, puis dans une version remaniee et augmentee en 1891, accompagnee d'une preface manifeste. L'oeuvre s'inscrit dans l'Angleterre victorienne, marquee par une morale rigide et une hypocrisie sociale que Wilde, dandy provocateur, prend plaisir a railler. Sa fin tragique (proces et emprisonnement pour homosexualite en 1895) eclaire retrospectivement les tensions du roman entre liberte, beaute et condamnation morale.",
  },
  {
    id: 'd-auteur-2',
    category: 'auteur',
    difficulty: 2,
    question: 'Qu\'est-ce que l\'esthetisme, et en quoi Wilde en est-il le representant ?',
    keyPoints: [
      'Mouvement « l\'art pour l\'art » (Art for Art\'s Sake)',
      'L\'art n\'a pas de but moral ni utilitaire',
      'Culte de la beaute, du raffinement, de la sensation',
      'Wilde dandy : vie comme oeuvre d\'art',
    ],
    modelAnswer:
      "L'esthetisme est un mouvement de la fin du XIXe siecle qui defend la formule « l'art pour l'art » : l'art ne doit servir aucune cause morale, politique ou utilitaire ; sa seule fin est la beaute. Wilde en est l'incarnation, en tant que dandy qui fait de sa propre vie, de son apparence et de son esprit une oeuvre d'art. Dans le roman, ce credo est porte a la fois par la preface (« Tout art est parfaitement inutile ») et par le personnage de Lord Henry, qui erige la sensation et la beaute en valeurs supremes. Mais le roman interroge aussi les limites de cette doctrine : l'esthetisme pousse a l'extreme par Dorian devient amoralite destructrice.",
  },
  {
    id: 'd-auteur-3',
    category: 'auteur',
    difficulty: 3,
    question: 'Le roman a fait scandale a sa parution. Pourquoi, selon vous ?',
    keyPoints: [
      'Morale victorienne choquee par l\'hedonisme et l\'amoralite',
      'Sous-entendus sur l\'homosexualite / les relations entre hommes',
      'Wilde accuse de defendre une oeuvre « immorale »',
      'Le roman cite plus tard a charge lors de son proces (1895)',
    ],
    modelAnswer:
      "A sa parution en 1890, le roman heurte la morale victorienne par sa peinture de l'hedonisme, de la corruption et d'un personnage qui jouit sans remords. La critique l'accuse d'immoralite ; Wilde repond en ajoutant en 1891 une preface qui affirme qu'« il n'y a pas de livre moral ou immoral : un livre est bien ou mal ecrit ». Le scandale tient aussi aux relations ambigues entre les personnages masculins (l'adoration de Basil pour Dorian) que l'epoque lit comme une evocation de l'homosexualite. Ironie tragique : ce roman sera utilise contre Wilde lors de ses proces de 1895, comme preuve supposee de son immoralite.",
  },

  // ===================== OEUVRE / GENRE / INTRIGUE =====================
  {
    id: 'd-oeuvre-1',
    category: 'oeuvre',
    difficulty: 1,
    question: 'Pouvez-vous resumer l\'intrigue du roman en quelques phrases ?',
    keyPoints: [
      'Basil peint le portrait du beau Dorian',
      'Voeu de Dorian : rester jeune, que le portrait vieillisse a sa place',
      'Dorian reste intact, le portrait porte ses vices et son age',
      'Il finit par poignarder le tableau et meurt a sa place',
    ],
    modelAnswer:
      "Le peintre Basil Hallward realise le portrait d'un jeune homme d'une beaute parfaite, Dorian Gray. Sous l'influence de Lord Henry Wotton, qui lui vante le culte de la jeunesse et du plaisir, Dorian formule un voeu : que le portrait vieillisse a sa place et qu'il garde, lui, sa beaute eternelle. Le voeu se realise. Dorian traverse les annees sans vieillir ni porter la trace de ses fautes, tandis que le tableau, cache, devient de plus en plus hideux a mesure qu'il sombre dans le vice et le crime, jusqu'au meurtre de Basil. A la fin, voulant detruire ce temoin de sa conscience, Dorian poignarde le portrait : on le retrouve mort, vieilli et defigure, tandis que le tableau a retrouve sa beaute d'origine.",
  },
  {
    id: 'd-oeuvre-2',
    category: 'oeuvre',
    difficulty: 2,
    question: 'A quel genre rattachez-vous cette oeuvre ?',
    keyPoints: [
      'Roman, mais hybride',
      'Roman fantastique / gothique (le portrait surnaturel)',
      'Roman philosophique / a these (esthetisme)',
      'Roman d\'apprentissage inverse (descente, et non elevation)',
    ],
    modelAnswer:
      "Le roman est hybride. Il releve du fantastique et du gothique par son element surnaturel central : un portrait qui se modifie a la place de son modele, dans une atmosphere d'inquietude et de secret. C'est aussi un roman philosophique, presque un roman a these, qui met en scene et discute les idees de l'esthetisme. On peut enfin le lire comme un roman d'apprentissage inverse : au lieu de s'elever en se formant, le heros se corrompt, le savoir et l'experience le menant non a la sagesse mais a la dechéance. Cette hybridite fait sa richesse.",
  },
  {
    id: 'd-oeuvre-3',
    category: 'oeuvre',
    difficulty: 2,
    question: 'Quel role joue la structure du roman, et notamment le chapitre 11 ?',
    keyPoints: [
      'Construction sur les annees qui passent',
      'Chapitre 11 : longue enumeration des plaisirs et collections de Dorian',
      'Ralentissement, catalogue decadent (pierres, parfums, etoffes)',
      'Symbolise la fuite dans l\'esthetisme pour echapper a la conscience',
    ],
    modelAnswer:
      "Le roman suit le passage des annees, marque par les transformations du portrait. Le chapitre 11 occupe une place a part : c'est une longue enumeration des passions et collections de Dorian, qui amasse pierres precieuses, parfums, etoffes, instruments rares. Ce catalogue decadent ralentit l'action et illustre la fuite de Dorian dans la sensation et la possession des belles choses, pour fuir sa conscience. Cette page est tres representative de l'ecriture esthetisante de Wilde, ou l'accumulation de beautes materielles masque le vide moral du personnage.",
  },

  // ===================== PERSONNAGES =====================
  {
    id: 'd-perso-1',
    category: 'personnages',
    difficulty: 1,
    question: 'Presentez les trois personnages masculins principaux et leurs relations.',
    keyPoints: [
      'Dorian Gray : jeune homme d\'une beaute parfaite, modele',
      'Basil Hallward : le peintre, qui voue un culte a Dorian',
      'Lord Henry Wotton : le mentor cynique, mauvais genie',
      'Triangle : l\'art (Basil), la beaute (Dorian), l\'idee (Henry)',
    ],
    modelAnswer:
      "Trois figures forment le coeur du roman. Dorian Gray est un jeune homme d'une beaute exceptionnelle, d'abord innocent. Basil Hallward, le peintre, voue a Dorian une admiration quasi amoureuse : il voit en lui un ideal artistique et puise en lui son inspiration. Lord Henry Wotton, aristocrate brillant et cynique, devient le mentor de Dorian et lui inocule sa philosophie hedoniste. On peut lire ce trio symboliquement : Basil incarne l'art et la conscience, Dorian la beaute, et Lord Henry l'idee corruptrice. La rencontre de ces trois forces declenche toute la tragedie.",
  },
  {
    id: 'd-perso-2',
    category: 'personnages',
    difficulty: 2,
    question: 'En quoi Lord Henry peut-il etre vu comme un tentateur, une figure de Mephistophele ?',
    keyPoints: [
      'Il seduit Dorian par ses paradoxes et son eloquence',
      'Il prone le plaisir, la jeunesse, le rejet de la morale',
      'Influence par les mots plus que par les actes',
      'Parallele avec le pacte faustien',
    ],
    modelAnswer:
      "Lord Henry agit comme un tentateur : par son eloquence faite de paradoxes, il seduit l'esprit de Dorian et lui presente une nouvelle morale fondee sur le plaisir, la jeunesse et la beaute, en rejetant les interdits victoriens. Il n'agit jamais lui-meme : il corrompt par les mots, en empoisonnant lentement la pensee du jeune homme. C'est ce qui justifie le rapprochement avec Mephistophele dans la legende de Faust : Lord Henry est le mauvais genie qui pousse Dorian a desirer la jeunesse eternelle. Wilde a d'ailleurs dit que Lord Henry etait l'image que les autres avaient de lui.",
  },
  {
    id: 'd-perso-3',
    category: 'personnages',
    difficulty: 2,
    question: 'Quel role joue Sibyl Vane dans le parcours de Dorian ?',
    keyPoints: [
      'Jeune actrice dont Dorian tombe amoureux',
      'Il l\'aime pour son art ; quand elle joue mal, il la rejette',
      'Son suicide marque le premier crime moral de Dorian',
      'Premiere alteration du portrait (un pli de cruaute)',
    ],
    modelAnswer:
      "Sibyl Vane est une jeune actrice dont Dorian tombe amoureux. Mais il l'aime surtout pour son talent, pour les heroines qu'elle incarne : il aime l'art, pas la personne. Lorsque l'amour reel la rend incapable de bien jouer la comedie, Dorian, decu, la rejette cruellement. Sibyl se suicide. Cet episode est decisif : c'est la premiere faute morale de Dorian, et c'est apres elle que le portrait se modifie pour la premiere fois, marque d'un pli de cruaute. Lord Henry pousse alors Dorian a considerer ce drame comme une experience esthetique, ce qui acheve de l'endurcir.",
  },
  {
    id: 'd-perso-4',
    category: 'personnages',
    difficulty: 3,
    question: 'Dorian est-il un personnage purement coupable, ou aussi une victime ?',
    keyPoints: [
      'Coupable : ses actes, le meurtre de Basil, sa froideur',
      'Victime : de son influence (Lord Henry), de sa propre beaute',
      'Tentatives de remords a la fin (la jeune Hetty)',
      'Ambiguite : Wilde refuse une morale simpliste',
    ],
    modelAnswer:
      "On peut le defendre dans les deux sens, et c'est la sa richesse. Dorian est coupable : il rejette Sibyl, assassine Basil, fait chanter Alan Campbell, et corrompt ceux qui l'approchent. Mais on peut aussi le voir comme une victime : victime de Lord Henry qui l'a faconne, et victime de sa propre beaute, qui l'a persuade que rien ne pouvait l'atteindre. A la fin, il tente d'etre bon (il epargne la jeune Hetty) et il est ronge par la peur et le remords. Wilde refuse une morale simpliste : son personnage est a la fois bourreau et proie, ce qui le rend tragique plutot que seulement detestable.",
  },

  // ===================== THEMES =====================
  {
    id: 'd-theme-1',
    category: 'themes',
    difficulty: 1,
    question: 'Quels sont, selon vous, les grands themes du roman ?',
    keyPoints: [
      'La beaute et la jeunesse',
      'L\'hedonisme et la quete du plaisir',
      'Le double et la dissimulation',
      'Le peche, la conscience et la culpabilite',
    ],
    modelAnswer:
      "Le roman entrelace plusieurs grands themes. D'abord la beaute et la jeunesse, eriges en valeurs absolues, et l'angoisse de leur perte. Ensuite l'hedonisme : la recherche du plaisir et de la sensation comme but de l'existence, incarnee par Lord Henry. Le theme du double est central, avec le portrait qui devient la part cachee et veritable de Dorian. Enfin, le peche, la conscience et la culpabilite : le portrait est une conscience exteriorisee, qui rend visible ce que Dorian voudrait dissimuler. A travers eux, le roman interroge le rapport entre l'apparence et la realite morale.",
  },
  {
    id: 'd-theme-2',
    category: 'themes',
    difficulty: 2,
    question: 'En quoi le portrait fonctionne-t-il comme un double, ou comme une conscience ?',
    keyPoints: [
      'Le portrait porte l\'ame, Dorian garde le masque',
      'Inversion : l\'objet vieillit, l\'etre reste fige',
      'Miroir de l\'ame, conscience exteriorisee',
      'Theme du Doppelganger romantique et gothique',
    ],
    modelAnswer:
      "Le portrait est le double de Dorian : il porte tout ce que Dorian dissimule. Wilde opere une inversion saisissante : d'habitude c'est l'etre qui vieillit et l'oeuvre qui demeure ; ici, c'est l'inverse. Dorian garde le visage d'un ange tandis que le tableau enregistre chaque faute, chaque annee, chaque cruaute. Le portrait devient ainsi une conscience exteriorisee, un miroir de l'ame que Dorian cache dans le grenier comme on refoule un remords. Ce motif du double, ou Doppelganger, est typique de la litterature romantique et gothique (on pense a L'Etrange Cas du Dr Jekyll et de M. Hyde de Stevenson, paru peu avant).",
  },
  {
    id: 'd-theme-3',
    category: 'themes',
    difficulty: 3,
    question: 'Le roman defend-il l\'hedonisme, ou le condamne-t-il ?',
    keyPoints: [
      'Lord Henry seduit, mais ses idees menent au desastre',
      'Fin tragique : l\'hedonisme sans morale detruit Dorian',
      'Wilde laisse une ambiguite : seduction ET avertissement',
      'Eviter une lecture trop moralisatrice imposee a Wilde',
    ],
    modelAnswer:
      "La reponse est ambigue, et c'est volontaire. D'un cote, le roman donne a l'hedonisme ses pages les plus brillantes, par la voix de Lord Henry, dont les paradoxes seduisent le lecteur autant que Dorian. De l'autre, l'intrigue montre que cet hedonisme, coupe de toute morale, conduit a la corruption et a la mort : la fin tragique fonctionne comme un avertissement. Mais il faut se garder d'une lecture trop moralisatrice, que Wilde refuse dans sa preface : il ne s'agit pas de condamner mais de montrer. Le roman tient en tension la fascination pour la beaute et la sensation, et la conscience de leur revers destructeur.",
  },
  {
    id: 'd-theme-4',
    category: 'themes',
    difficulty: 2,
    question: 'Quel rapport le roman etablit-il entre apparence et realite ?',
    keyPoints: [
      'Dorian beau au-dehors, monstrueux au-dedans',
      'La societe juge sur l\'apparence et se laisse tromper',
      'Le portrait dit la verite que le visage masque',
      'Critique de l\'hypocrisie victorienne',
    ],
    modelAnswer:
      "Tout le roman repose sur l'ecart entre apparence et realite. Dorian conserve un visage d'une beaute angelique alors qu'il devient un monstre moral : son apparence ment. La societe, qui juge sur les apparences, continue de l'admirer et refuse de croire les rumeurs. Seul le portrait dit la verite, mais il reste cache. A travers ce dispositif, Wilde adresse une critique a la societe victorienne, obsedee par la respectabilite de facade et l'hypocrisie : on y soigne l'apparence du bien plus que le bien lui-meme. Le portrait est la verite refoulee qui ne demande qu'a remonter.",
  },

  // ===================== ART / PREFACE =====================
  {
    id: 'd-art-1',
    category: 'art',
    difficulty: 2,
    question: 'Que dit la preface du roman, et pourquoi est-elle importante ?',
    keyPoints: [
      'Serie d\'aphorismes sur l\'art ajoutee en 1891',
      '« Tout art est parfaitement inutile »',
      '« Il n\'y a pas de livre moral ou immoral »',
      'Manifeste de l\'art pour l\'art, reponse aux critiques',
    ],
    modelAnswer:
      "La preface, ajoutee en 1891, est une suite d'aphorismes qui forment un veritable manifeste de l'art pour l'art. Wilde y affirme que « l'artiste est le createur de belles choses », qu'« il n'y a pas de livre moral ou immoral : un livre est bien ou mal ecrit », et il conclut que « tout art est parfaitement inutile ». Elle est essentielle pour deux raisons : elle repond directement aux accusations d'immoralite portees contre la premiere version, et elle propose une grille de lecture, en separant l'art de la morale. C'est aussi un paradoxe, car le roman lui-meme semble bien porter une reflexion morale.",
  },
  {
    id: 'd-art-2',
    category: 'art',
    difficulty: 3,
    question: 'Le roman illustre-t-il vraiment la formule « l\'art pour l\'art » de la preface ?',
    keyPoints: [
      'Preface : l\'art separe de la morale',
      'Pourtant l\'intrigue a une portee morale visible',
      'Tension/contradiction assumee chez Wilde',
      'Le portrait : un art qui devient justement moral',
    ],
    modelAnswer:
      "Il y a une tension feconde entre la theorie de la preface et la pratique du roman. La preface defend un art detache de toute morale, mais l'intrigue, elle, montre clairement les consequences desastreuses d'une vie sans morale : elle semble donc porter une lecon. Plus encore, le portrait est une oeuvre d'art qui, loin d'etre « inutile », devient le lieu meme de la conscience morale de Dorian. On peut y voir une contradiction, ou bien le jeu d'un Wilde qui aime les paradoxes et refuse de trancher : il pose la question du rapport entre l'art et la morale sans y apporter de reponse univoque.",
  },

  // ===================== MYTHES / INTERTEXTUALITE =====================
  {
    id: 'd-mythe-1',
    category: 'mythes',
    difficulty: 2,
    question: 'En quoi le roman reecrit-il le mythe de Faust ?',
    keyPoints: [
      'Pacte implicite : la jeunesse eternelle contre l\'ame',
      'Lord Henry en figure de Mephistophele',
      'Le voeu de Dorian comme contrat surnaturel',
      'Chute finale : on paie toujours le pacte',
    ],
    modelAnswer:
      "Le roman reecrit le mythe de Faust : Dorian formule un voeu — garder sa jeunesse et sa beaute pendant que le portrait vieillit a sa place — qui fonctionne comme un pacte surnaturel ou il echange, en quelque sorte, son ame. Lord Henry tient le role du tentateur, le Mephistophele qui souffle ce desir. Comme dans toute variante de Faust, le pacte se paie : Dorian profite des annees sans payer en apparence, mais la dette s'accumule sur le portrait, et le denouement la fait soudain echoir. La mort finale est le prix differe de ce marche.",
  },
  {
    id: 'd-mythe-2',
    category: 'mythes',
    difficulty: 2,
    question: 'Quel rapport voyez-vous avec le mythe de Narcisse ?',
    keyPoints: [
      'Dorian fascine par sa propre image (le portrait)',
      'Amour de soi, vanite, culte de sa beaute',
      'Narcisse meurt de son reflet ; Dorian meurt par son portrait',
      'Le portrait comme miroir / source d\'auto-fascination',
    ],
    modelAnswer:
      "Le mythe de Narcisse est tout aussi present. Devant son portrait, Dorian prend conscience de sa beaute et en tombe amoureux : c'est cette fascination pour sa propre image qui declenche son voeu. Comme Narcisse, qui se laisse mourir devant son reflet, Dorian est prisonnier de l'amour de soi et de sa jeunesse. Le portrait joue le role du miroir d'eau : source d'auto-contemplation, il devient aussi l'instrument de sa perte. On peut donc lire le roman comme une variation moderne sur la vanite et le piege de l'amour de soi.",
  },
  {
    id: 'd-mythe-3',
    category: 'mythes',
    difficulty: 3,
    question: 'A quelles traditions litteraires (gothique, decadence) rattachez-vous le roman ?',
    keyPoints: [
      'Roman gothique : portrait surnaturel, secret, atmosphere',
      'Le double (cf. Jekyll et Hyde de Stevenson)',
      'Decadence fin-de-siecle : le « livre jaune » (cf. A rebours)',
      'Esthetisme et symbolisme europeens',
    ],
    modelAnswer:
      "Le roman puise dans plusieurs traditions. Par son portrait surnaturel, son atmosphere de secret et son grenier interdit, il prolonge le roman gothique et le motif du double, dont L'Etrange Cas du Dr Jekyll et de M. Hyde de Stevenson (1886) est un proche cousin. Il s'inscrit aussi dans la decadence fin-de-siecle : le « livre jaune » que Lord Henry offre a Dorian, et qui le fascine, est souvent identifie a A rebours de Huysmans, bible de l'esthetisme decadent. Le gout des sensations rares, des objets precieux, du raffinement morbide, rattache enfin l'oeuvre au symbolisme et a l'esthetisme europeens de la fin du XIXe siecle.",
  },

  // ===================== STYLE =====================
  {
    id: 'd-style-1',
    category: 'style',
    difficulty: 2,
    question: 'Comment caracteriseriez-vous le style et l\'ecriture de Wilde dans ce roman ?',
    keyPoints: [
      'Art du paradoxe et de l\'epigramme (surtout Lord Henry)',
      'Esprit, ironie, formules brillantes',
      'Descriptions esthetisantes, riches et sensorielles',
      'Dialogues etincelants, proches du theatre',
    ],
    modelAnswer:
      "Le style de Wilde est immediatement reconnaissable a son art du paradoxe et de l'epigramme : des formules brillantes, souvent dans la bouche de Lord Henry, qui renversent le sens commun (« Je peux resister a tout, sauf a la tentation »). L'ecriture est spirituelle, ironique, et donne aux dialogues un eclat presque theatral, ce qui n'etonne pas chez un grand dramaturge. A cote de cet esprit, Wilde deploie des descriptions esthetisantes, riches et sensorielles, notamment dans les passages sur les collections de Dorian. Cette double tonalite — l'esprit mordant et le luxe des images — fait la signature stylistique du roman.",
  },
  {
    id: 'd-style-2',
    category: 'style',
    difficulty: 2,
    question: 'Pouvez-vous citer et commenter un aphorisme ou une formule paradoxale ?',
    keyPoints: [
      'Ex. « Tout art est parfaitement inutile »',
      'Ex. « La seule facon de se debarrasser d\'une tentation, c\'est d\'y ceder »',
      'Le paradoxe : provoquer, renverser la morale commune',
      'Lien avec l\'esprit dandy et l\'esthetisme',
    ],
    modelAnswer:
      "On peut citer la formule de Lord Henry : « La seule facon de se debarrasser d'une tentation, c'est d'y ceder. » Elle est typique du procede de Wilde : un paradoxe qui renverse la morale commune sous une apparence de logique imparable. Au lieu de resister a la tentation (morale traditionnelle), on est invite a y succomber. Cette provocation spirituelle resume la philosophie hedoniste qui corrompt Dorian, et elle illustre l'esprit dandy de Wilde : briller, surprendre, et detacher l'art de tout devoir moral. Derriere le brillant de la formule se cache donc le poison qui agira sur Dorian.",
  },

  // ===================== PERSONNEL / OUVERTURE =====================
  {
    id: 'd-perso-choix-1',
    category: 'personnel',
    difficulty: 1,
    question: 'Pourquoi avez-vous choisi cette oeuvre ? Qu\'est-ce qui vous a plu ?',
    keyPoints: [
      'Donner une raison sincere et personnelle',
      'Appuyer sur un theme ou un personnage precis',
      'Citer un passage ou une idee marquante',
      'Montrer que l\'oeuvre fait reflechir (apparence, beaute...)',
    ],
    modelAnswer:
      "J'ai choisi ce roman parce qu'il m'a marque par la force de son idee de depart : un homme qui reste eternellement jeune tandis que son portrait porte le poids de ses fautes. Cette image, a la fois fantastique et profondement morale, m'a fait reflechir a notre propre rapport a l'apparence et a la beaute, qui resonne fortement aujourd'hui avec l'image de soi sur les reseaux. J'ai aussi ete seduit par le personnage de Lord Henry et par l'esprit etincelant de Wilde, dont les paradoxes sont a la fois droles et inquietants. (A adapter avec votre raison personnelle reelle et un passage precis qui vous a touche.)",
  },
  {
    id: 'd-perso-choix-2',
    category: 'personnel',
    difficulty: 2,
    question: 'En quoi cette oeuvre vous parait-elle encore actuelle ?',
    keyPoints: [
      'Culte de la jeunesse et de l\'image (reseaux sociaux)',
      'Le filtre, le portrait retouche, le double numerique',
      'La quete du plaisir, le rapport a la celebrite',
      'Le decalage apparence/realite morale',
    ],
    modelAnswer:
      "L'oeuvre me parait tres actuelle. Le culte de la jeunesse et de la beaute qu'elle decrit fait directement echo a notre epoque des reseaux sociaux, ou l'on soigne son image et ou l'on diffuse une version retouchee de soi : Dorian, qui garde une apparence parfaite pendant que son vrai visage se cache, ressemble a un portrait filtre face a une realite dissimulee. La quete permanente du plaisir et de la sensation, le rapport a la celebrite, l'angoisse de vieillir : tout cela reste d'une grande modernite. Le roman invite a interroger le decalage entre l'image que l'on montre et ce que l'on est reellement.",
  },
  {
    id: 'd-perso-choix-3',
    category: 'personnel',
    difficulty: 3,
    question: 'Avec quelle autre oeuvre pourriez-vous mettre ce roman en relation ?',
    keyPoints: [
      'Stevenson, Dr Jekyll et M. Hyde (le double)',
      'Balzac, La Peau de chagrin (objet surnaturel, pacte)',
      'Maupassant, Le Horla / fantastique',
      'Justifier le rapprochement par un point commun precis',
    ],
    modelAnswer:
      "Je le rapprocherais de L'Etrange Cas du Dr Jekyll et de M. Hyde de Stevenson, qui explore lui aussi le theme du double et de la part cachee, monstrueuse, dissimulee derriere une facade respectable. On pourrait aussi penser a La Peau de chagrin de Balzac, ou un objet surnaturel scelle un pacte fatal entre desir et duree de vie : comme le portrait, la peau materialise le prix a payer pour ses jouissances. Ces rapprochements eclairent ce qui est propre a Wilde : il deplace le double non dans le corps, mais dans une oeuvre d'art, ce qui lui permet d'y greffer toute sa reflexion sur l'esthetisme. (Choisissez l'oeuvre que vous connaissez le mieux pour justifier le lien.)",
  },
];

/** Renvoie les questions d'une categorie donnee. */
export function questionsForCategory(category: OeuvreCategory): OeuvreQuestion[] {
  return OEUVRE_QUESTIONS.filter((q) => q.category === category);
}

/** Libelle court d'un niveau de difficulte. */
export function difficultyLabel(d: 1 | 2 | 3): string {
  return d === 1 ? 'Accessible' : d === 2 ? 'Intermediaire' : 'Exigeant';
}
