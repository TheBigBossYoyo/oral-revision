// ============================================================================
// data/grammar.ts - Programme de grammaire (theorie) + banque de QCM
// ----------------------------------------------------------------------------
// Contenu statique, fonctionne hors-ligne. Couvre le programme de grammaire sur
// lequel on peut etre interroge a l'oral de francais (question de grammaire de
// l'EAF) en seconde et en premiere : nature et fonction des mots, types et
// formes de phrase, interrogation, negation, subordonnees, expression des
// circonstances, valeurs des temps et des modes, voix et emphase.
//
// Le texte (theorie + exemples + corriges) est redige en francais accentue
// car il s'agit du contenu pedagogique affiche a l'utilisateur.
// ============================================================================

export type GrammarLevel = 'seconde' | 'premiere' | 'transversal';

export interface GrammarExample {
  /** Phrase d'exemple (la partie analysee peut etre signalee par l'enseignant). */
  text: string;
  /** Commentaire grammatical bref sur l'exemple. */
  note?: string;
}

export interface GrammarSubsection {
  heading: string;
  /** Un ou plusieurs paragraphes d'explication. */
  content: string[];
  examples?: GrammarExample[];
}

export interface GrammarChapter {
  id: string;
  title: string;
  level: GrammarLevel;
  /** Resume en une phrase, affiche dans la liste des chapitres. */
  summary: string;
  /** Pourquoi/Comment ce point tombe a l'oral (encadre methode). */
  oralTip?: string;
  subsections: GrammarSubsection[];
}

export interface QuizQuestion {
  id: string;
  /** Chapitre rattache (pour le score par chapitre). */
  chapterId: string;
  question: string;
  options: string[];
  /** Index (0-based) de la bonne reponse. */
  correctIndex: number;
  explanation: string;
}

// ----------------------------------------------------------------------------
// Theorie
// ----------------------------------------------------------------------------

export const GRAMMAR_CHAPTERS: GrammarChapter[] = [
  // ===== 1. Classes grammaticales =====
  {
    id: 'classes',
    title: 'Les classes grammaticales (la nature des mots)',
    level: 'seconde',
    summary: 'Identifier la nature de chaque mot : variable ou invariable.',
    oralTip:
      "Avant d'analyser une fonction, donnez toujours la classe grammaticale du mot. Distinguez bien la NATURE (ce qu'est le mot, ex. un nom) de la FONCTION (le role du mot dans la phrase, ex. sujet).",
    subsections: [
      {
        heading: 'Les classes variables (elles changent de forme)',
        content: [
          "Le nom (commun ou propre) designe un etre, une chose, une idee. Le determinant precede le nom et en precise le genre et le nombre (articles, possessifs, demonstratifs, indefinis, numeraux).",
          "L'adjectif qualificatif exprime une qualite et s'accorde avec le nom. Le pronom remplace un nom ou un groupe nominal (personnel, possessif, demonstratif, relatif, interrogatif, indefini). Le verbe exprime une action ou un etat et se conjugue.",
        ],
        examples: [
          { text: "Cette vieille maison lui appartient.", note: "determinant (cette), adjectif (vieille), nom (maison), pronom (lui), verbe (appartient)." },
        ],
      },
      {
        heading: 'Les classes invariables (elles ne changent jamais de forme)',
        content: [
          "L'adverbe modifie un verbe, un adjectif ou un autre adverbe (vite, tres, hier). La preposition introduit un complement (a, de, pour, sans, par, chez...). La conjonction relie : de coordination (mais, ou, et, donc, or, ni, car) ou de subordination (que, quand, comme, si, parce que...).",
          "L'interjection exprime une emotion (helas !, oh !).",
        ],
        examples: [
          { text: "Il marche lentement vers la porte, mais il hesite.", note: "adverbe (lentement), preposition (vers), conjonction de coordination (mais)." },
        ],
      },
    ],
  },

  // ===== 2. Fonctions =====
  {
    id: 'fonctions',
    title: 'Les fonctions dans la phrase',
    level: 'seconde',
    summary: 'Le role joue par un mot ou un groupe : sujet, COD, COI, attribut, complements.',
    oralTip:
      "Pour trouver une fonction, posez la bonne question au verbe : « qui est-ce qui ? » pour le sujet, « quoi ? / qui ? » pour le COD, « a qui ? / de quoi ? » pour le COI, « ou ? quand ? comment ? pourquoi ? » pour les complements circonstanciels.",
    subsections: [
      {
        heading: 'Les fonctions liees au verbe',
        content: [
          "Le SUJET commande l'accord du verbe (« qui est-ce qui + verbe ? »). Le COD complete un verbe transitif direct, sans preposition. Le COI est introduit par une preposition (a, de). L'attribut du sujet exprime, via un verbe d'etat (etre, paraitre, sembler, devenir, rester...), une qualite attribuee au sujet.",
        ],
        examples: [
          { text: "Le capitaine offre une recompense a ses hommes.", note: "sujet (le capitaine), COD (une recompense), COI (a ses hommes)." },
          { text: "Cette nouvelle paraissait incroyable.", note: "attribut du sujet (incroyable) introduit par le verbe d'etat paraissait." },
        ],
      },
      {
        heading: 'Les complements circonstanciels (CC)',
        content: [
          "Le complement circonstanciel precise les circonstances de l'action : temps, lieu, maniere, cause, but, moyen... Il est en general deplacable et supprimable, contrairement aux complements essentiels (COD, COI).",
        ],
        examples: [
          { text: "Le matin, il travaille en silence dans son bureau.", note: "CC de temps (le matin), de maniere (en silence), de lieu (dans son bureau)." },
        ],
      },
      {
        heading: 'Les expansions du nom',
        content: [
          "Trois fonctions enrichissent le nom : l'epithete (adjectif lie directement au nom), le complement du nom (introduit par une preposition), et l'apposition (separee par une virgule, elle designe la meme realite que le nom).",
        ],
        examples: [
          { text: "Le vieux marin, capitaine du navire, scrutait l'horizon de fer.", note: "epithete (vieux), apposition (capitaine du navire), complement du nom (de fer)." },
        ],
      },
    ],
  },

  // ===== 3. Types et formes de phrase =====
  {
    id: 'phrase',
    title: 'Les types et les formes de phrase',
    level: 'seconde',
    summary: 'Quatre types (declaratif, interrogatif, injonctif, exclamatif) et des formes qui se combinent.',
    oralTip:
      "On distingue le TYPE (un seul par phrase : declaratif, interrogatif, injonctif ou exclamatif) et les FORMES (qui se cumulent : affirmative/negative, active/passive, neutre/emphatique, personnelle/impersonnelle).",
    subsections: [
      {
        heading: 'Les quatre types de phrase',
        content: [
          "Le type declaratif enonce un fait (point final). Le type interrogatif pose une question (point d'interrogation). Le type injonctif (ou imperatif) donne un ordre, un conseil. Le type exclamatif exprime une emotion (point d'exclamation).",
        ],
        examples: [
          { text: "Tu pars. / Pars-tu ? / Pars ! / Comme tu pars vite !", note: "declaratif, interrogatif, injonctif, exclamatif." },
        ],
      },
      {
        heading: 'Les formes de phrase',
        content: [
          "Forme affirmative ou negative. Forme active ou passive (selon que le sujet fait ou subit l'action). Forme neutre ou emphatique (mise en relief par un presentatif « c'est... qui » ou par un detachement). Forme personnelle ou impersonnelle (« il pleut », « il faut »).",
        ],
        examples: [
          { text: "C'est ce silence qui l'effrayait.", note: "phrase declarative, de forme emphatique (presentatif c'est... qui)." },
        ],
      },
    ],
  },

  // ===== 4. Interrogation =====
  {
    id: 'interrogation',
    title: "L'interrogation",
    level: 'premiere',
    summary: 'Totale ou partielle, directe ou indirecte : un point classique de la question de grammaire.',
    oralTip:
      "Question type a l'oral : « Analysez l'interrogation dans cette phrase. » Precisez : totale ou partielle ? directe ou indirecte ? Quel est le marqueur (inversion, est-ce que, intonation, mot interrogatif) ? Quel niveau de langue cela traduit-il ?",
    subsections: [
      {
        heading: 'Interrogation totale et interrogation partielle',
        content: [
          "L'interrogation TOTALE porte sur l'ensemble de la phrase et appelle une reponse par oui ou non (« Viendras-tu ? »). L'interrogation PARTIELLE porte sur un element precis et utilise un mot interrogatif (qui, que, quoi, ou, quand, comment, pourquoi, combien, quel) : « Quand viendras-tu ? ».",
        ],
        examples: [
          { text: "As-tu compris la lecon ?", note: "interrogation totale (reponse oui/non)." },
          { text: "Pourquoi as-tu menti ?", note: "interrogation partielle, portant sur la cause (pourquoi)." },
        ],
      },
      {
        heading: 'Interrogation directe et interrogation indirecte',
        content: [
          "L'interrogation DIRECTE est une phrase autonome terminee par un point d'interrogation (« Ou vas-tu ? »). L'interrogation INDIRECTE est enchassee dans une proposition, sans point d'interrogation ni inversion : c'est une subordonnee interrogative indirecte (« Je me demande ou tu vas. »).",
        ],
        examples: [
          { text: "Il me demande si je viendrai.", note: "interrogation indirecte totale (subordonnee introduite par si)." },
          { text: "Dis-moi quand tu pars.", note: "interrogation indirecte partielle (subordonnee introduite par quand)." },
        ],
      },
      {
        heading: 'Les trois marqueurs de l\'interrogation directe',
        content: [
          "Trois constructions, du plus soutenu au plus familier : l'inversion du sujet (« Viens-tu ? », soutenu), la locution « est-ce que » (« Est-ce que tu viens ? », courant), la simple intonation a l'oral ou un point d'interrogation a l'ecrit (« Tu viens ? », familier). Le choix du marqueur est un indice de registre de langue, souvent revelateur d'un personnage.",
        ],
      },
    ],
  },

  // ===== 5. Negation =====
  {
    id: 'negation',
    title: 'La negation',
    level: 'premiere',
    summary: 'Totale ou partielle, syntaxique ou lexicale, exceptive et restrictive.',
    oralTip:
      "Question type : « Analysez la negation. » Reperez la negation syntaxique (deux mots : ne... pas) et son champ : totale (ne... pas), partielle (ne... rien/personne/jamais/plus), exceptive (ne... que = restriction). Attention : « ne... que » n'est pas une negation mais une restriction (= seulement).",
    subsections: [
      {
        heading: 'Negation totale et negation partielle',
        content: [
          "La negation TOTALE nie toute la phrase : ne... pas, ne... point. La negation PARTIELLE ne nie qu'une partie : ne... rien (l'objet), ne... personne (la personne), ne... jamais (le temps), ne... plus (la continuite), ne... nulle part (le lieu), ne... aucun (la quantite).",
        ],
        examples: [
          { text: "Il ne dort pas.", note: "negation totale." },
          { text: "Il ne dort jamais avant minuit.", note: "negation partielle (porte sur le temps)." },
        ],
      },
      {
        heading: 'La restriction (ne... que) et la negation exceptive',
        content: [
          "« Ne... que » n'exprime pas une negation mais une RESTRICTION equivalant a « seulement » : « Il ne lit que des romans » = il lit seulement des romans. La negation exceptive « ne... que... ne » introduit une exception (« Il ne fait que se plaindre »). Bien la distinguer en disant qu'il s'agit d'une tournure restrictive.",
        ],
        examples: [
          { text: "Elle ne pense qu'a partir.", note: "tournure restrictive (= elle pense seulement a partir), et non une negation." },
        ],
      },
      {
        heading: 'Negation syntaxique et negation lexicale',
        content: [
          "La negation SYNTAXIQUE passe par des mots de negation (ne... pas). La negation LEXICALE passe par un mot dont le sens est negatif, sans adverbe de negation : prefixes (im-possible, in-utile, mal-honnete, des-ordre) ou termes negatifs (refuser, nier, absence). On parle parfois de negation morphologique pour les prefixes.",
        ],
        examples: [
          { text: "Son geste etait inutile et maladroit.", note: "negation lexicale par les prefixes in- et mal-." },
        ],
      },
    ],
  },

  // ===== 6. Subordonnees relatives / expansions =====
  {
    id: 'relatives',
    title: 'Les propositions subordonnees relatives',
    level: 'premiere',
    summary: 'Une subordonnee qui complete un nom (l\'antecedent), introduite par un pronom relatif.',
    oralTip:
      "Question type : « Quelle est la nature et la fonction de cette proposition relative ? » Reponse : c'est une subordonnee relative, expansion du nom, complement de l'antecedent. Precisez le pronom relatif (qui, que, dont, ou, lequel...) et sa fonction dans la subordonnee, puis si la relative est determinative ou explicative.",
    subsections: [
      {
        heading: 'Definition et antecedent',
        content: [
          "La subordonnee relative est introduite par un pronom relatif (qui, que, quoi, dont, ou, lequel, duquel...). Elle complete un nom ou un pronom appele ANTECEDENT. Sa fonction est expansion du nom (complement de l'antecedent).",
        ],
        examples: [
          { text: "Le livre que je lis est passionnant.", note: "relative complement de l'antecedent « livre » ; « que » = COD de « lis »." },
        ],
      },
      {
        heading: 'La fonction du pronom relatif',
        content: [
          "Le pronom relatif a une double valeur : il relie la subordonnee a l'antecedent ET occupe une fonction dans la subordonnee. « Qui » est en general sujet, « que » COD, « dont » complement introduit par « de » (complement du nom, du verbe ou de l'adjectif), « ou » complement circonstanciel de lieu ou de temps.",
        ],
        examples: [
          { text: "La ville ou je suis ne a beaucoup change.", note: "« ou » = CC de lieu dans la subordonnee." },
          { text: "L'auteur dont je parle est anglais.", note: "« dont » = COI (parler de quelqu'un)." },
        ],
      },
      {
        heading: 'Relative determinative et relative explicative',
        content: [
          "La relative DETERMINATIVE (ou restrictive) est indispensable au sens : elle restreint l'antecedent (« Les eleves qui ont travaille reussiront »). La relative EXPLICATIVE (ou appositive), encadree de virgules, ajoute une information non essentielle (« Les eleves, qui etaient fatigues, partirent »). Cette distinction change le sens et tombe souvent a l'oral.",
        ],
      },
    ],
  },

  // ===== 7. Subordonnees conjonctives (completives) =====
  {
    id: 'completives',
    title: 'Les propositions subordonnees conjonctives completives',
    level: 'premiere',
    summary: 'Introduite par « que », elle est le plus souvent COD du verbe principal.',
    oralTip:
      "Ne confondez pas le « que » conjonction de subordination (introduit une completive) et le « que » pronom relatif (a un antecedent et une fonction dans la subordonnee). Test : si « que » remplace un nom proche, c'est un relatif ; s'il introduit toute une proposition apres un verbe de declaration/opinion, c'est une completive.",
    subsections: [
      {
        heading: 'La completive conjonctive',
        content: [
          "Introduite par la conjonction de subordination « que », elle complete un verbe (souvent un verbe de parole, de pensee, de volonte ou de sentiment) et a le plus souvent la fonction de COD. Elle peut aussi etre sujet ou complement de l'adjectif.",
        ],
        examples: [
          { text: "Je pense que tu as raison.", note: "completive COD du verbe « pense »." },
          { text: "Il est certain que tout ira bien.", note: "completive, ici sujet reel du verbe impersonnel." },
        ],
      },
      {
        heading: 'Indicatif ou subjonctif dans la completive',
        content: [
          "Le mode depend du verbe principal. Les verbes d'affirmation ou d'opinion (penser, croire, savoir, affirmer) entrainent l'INDICATIF (fait pose comme reel). Les verbes de volonte, de doute ou de sentiment (vouloir, falloir, douter, craindre, souhaiter) entrainent le SUBJONCTIF (fait envisage, non realise).",
        ],
        examples: [
          { text: "Je veux qu'il vienne.", note: "subjonctif apres un verbe de volonte." },
          { text: "Je sais qu'il viendra.", note: "indicatif apres un verbe de connaissance." },
        ],
      },
    ],
  },

  // ===== 8. Subordonnees circonstancielles + interrogative indirecte =====
  {
    id: 'circonstancielles',
    title: 'Les propositions subordonnees circonstancielles',
    level: 'premiere',
    summary: 'Elles expriment une circonstance (temps, cause, but, condition...) et sont des CC.',
    oralTip:
      "Identifiez la conjonction de subordination (quand, parce que, afin que, si, bien que...) : elle donne la valeur circonstancielle. La subordonnee circonstancielle a la fonction de complement circonstoriel de la principale.",
    subsections: [
      {
        heading: 'Les principales circonstancielles',
        content: [
          "Temps (quand, lorsque, des que, avant que, apres que), cause (parce que, puisque, comme, etant donne que), consequence (si bien que, de sorte que, au point que), but (afin que, pour que, de peur que), condition/hypothese (si, a condition que, pourvu que), opposition/concession (alors que, tandis que, bien que, quoique), comparaison (comme, ainsi que, de meme que).",
        ],
        examples: [
          { text: "Bien qu'il fut fatigue, il continua.", note: "circonstancielle de concession (bien que + subjonctif)." },
        ],
      },
      {
        heading: 'La subordonnee interrogative indirecte',
        content: [
          "Cousine des completives, elle resulte de la transformation d'une interrogation directe en subordonnee, apres un verbe interrogatif (demander, savoir, ignorer). Elle est introduite par « si » (interrogation totale) ou par un mot interrogatif (interrogation partielle). Elle a souvent la fonction de COD.",
        ],
        examples: [
          { text: "Je ne sais pas s'il acceptera.", note: "interrogative indirecte totale, COD de « sais »." },
        ],
      },
    ],
  },

  // ===== 9. Cause, consequence, but =====
  {
    id: 'cause-consequence-but',
    title: "L'expression de la cause, de la consequence et du but",
    level: 'premiere',
    summary: 'Trois rapports logiques a savoir reperer et distinguer.',
    oralTip:
      "Distinguez bien CAUSE (l'origine, ce qui precede : « pourquoi ? »), CONSEQUENCE (le resultat, ce qui suit : « avec quel effet ? ») et BUT (l'intention, le resultat vise, non encore realise : « dans quel but ? » + subjonctif).",
    subsections: [
      {
        heading: 'La cause',
        content: [
          "Elle exprime l'origine, la raison. Moyens : conjonctions (parce que, puisque, comme, car), prepositions (a cause de, grace a, en raison de, faute de), participe ou gerondif, juxtaposition. « Puisque » suppose une cause connue/admise ; « parce que » apporte une cause nouvelle.",
        ],
        examples: [
          { text: "Il est reste chez lui parce qu'il pleuvait.", note: "cause exprimee par une circonstancielle (parce que + indicatif)." },
        ],
      },
      {
        heading: 'La consequence',
        content: [
          "Elle exprime le resultat, l'effet. Moyens : si/tellement/tant... que, si bien que, de sorte que, au point que, donc, par consequent. La consequence se construit le plus souvent a l'indicatif (le resultat est reel).",
        ],
        examples: [
          { text: "Il faisait si froid que la riviere gela.", note: "consequence (si... que + indicatif)." },
        ],
      },
      {
        heading: 'Le but',
        content: [
          "Il exprime l'intention, le resultat recherche. Moyens : afin que, pour que, de peur que, de crainte que (+ subjonctif), ou afin de, pour, en vue de + infinitif. Le subjonctif s'impose car le but n'est pas encore realise.",
        ],
        examples: [
          { text: "Elle parle bas afin que nul ne l'entende.", note: "but (afin que + subjonctif)." },
        ],
      },
    ],
  },

  // ===== 10. Condition, opposition, concession =====
  {
    id: 'condition-concession',
    title: "L'expression de la condition, de l'opposition et de la concession",
    level: 'premiere',
    summary: 'Hypothese (si), opposition (mais, tandis que) et concession (bien que, malgre).',
    oralTip:
      "Opposition : deux faits coexistent et contrastent (« Il est riche, mais malheureux »). Concession : un obstacle attendu n'empeche PAS le fait (« Bien qu'il soit riche, il est malheureux » = on s'attendrait au contraire). C'est la nuance la plus piegeuse a l'oral.",
    subsections: [
      {
        heading: "La condition et l'hypothese",
        content: [
          "Elles posent une supposition dont depend la principale. Le systeme avec « si » a trois valeurs : potentiel (Si + present, futur : « Si tu viens, je serai content »), irreel du present (Si + imparfait, conditionnel present : « Si tu venais, je serais content »), irreel du passe (Si + plus-que-parfait, conditionnel passe : « Si tu etais venu, j'aurais ete content »).",
        ],
        examples: [
          { text: "Si j'avais su, je ne serais pas venu.", note: "irreel du passe (plus-que-parfait + conditionnel passe)." },
        ],
      },
      {
        heading: "L'opposition et la concession",
        content: [
          "L'opposition met en parallele deux faits contraires (mais, en revanche, tandis que, alors que). La concession admet un fait qui devrait empecher l'autre mais ne l'empeche pas (bien que, quoique + subjonctif ; malgre, en depit de + nom ; meme si + indicatif). « Quoique » (concession) ne doit pas etre confondu avec « quoi que » (= quelle que soit la chose que).",
        ],
        examples: [
          { text: "Malgre la pluie, ils sont sortis.", note: "concession (malgre + groupe nominal)." },
        ],
      },
    ],
  },

  // ===== 11. Valeurs des temps =====
  {
    id: 'temps',
    title: "Les valeurs des temps de l'indicatif",
    level: 'premiere',
    summary: 'Present, imparfait, passe simple, passe compose, futur : reperer leurs valeurs.',
    oralTip:
      "Ne donnez jamais seulement le nom du temps : donnez sa VALEUR dans le texte. Ex. : « présent de vérité générale », « imparfait de description / d'arrière-plan », « passé simple de premier plan / d'action ». C'est ce que l'examinateur attend.",
    subsections: [
      {
        heading: 'Le present',
        content: [
          "Au-dela du present d'enonciation (le moment ou l'on parle), il prend plusieurs valeurs : present de verite generale (les maximes, « L'eau bout a 100 degres »), present de narration (qui rend un recit plus vivant en plein passe), present d'habitude (action repetee).",
        ],
        examples: [
          { text: "Qui aime bien chatie bien.", note: "present de verite generale (proverbe)." },
        ],
      },
      {
        heading: "L'imparfait et le passe simple",
        content: [
          "Dans le recit au passe, l'imparfait exprime l'arriere-plan : description, duree, repetition, habitude (« Il pleuvait, les rues etaient desertes »). Le passe simple exprime le premier plan : les actions breves, soudaines, qui font avancer l'intrigue (« Soudain, il entra »). Leur opposition structure le recit.",
        ],
        examples: [
          { text: "Il lisait tranquillement quand on frappa.", note: "imparfait (cadre, duree) / passe simple (action de premier plan)." },
        ],
      },
      {
        heading: 'Le passe compose et le futur',
        content: [
          "Le passe compose exprime une action accomplie ayant un lien avec le present (et, dans le recit moderne, remplace le passe simple a l'oral et dans certains textes). Le futur exprime l'avenir, mais aussi l'ordre attenue (« Tu rangeras ta chambre ») ou la verite a venir.",
        ],
      },
    ],
  },

  // ===== 12. Valeurs des modes =====
  {
    id: 'modes',
    title: 'Les valeurs des modes',
    level: 'premiere',
    summary: 'Indicatif, subjonctif, conditionnel, imperatif, infinitif, participe.',
    oralTip:
      "Le mode traduit le point de vue de l'enonciateur sur l'action : reel (indicatif), envisage/souhaite (subjonctif), soumis a condition (conditionnel), ordre (imperatif). Reperez-le et donnez sa valeur.",
    subsections: [
      {
        heading: 'Indicatif et subjonctif',
        content: [
          "L'indicatif presente l'action comme reelle, situee dans le temps. Le subjonctif presente l'action comme envisagee, soumise a la volonte, au doute ou au sentiment ; on le trouve surtout en subordonnee (apres « que ») et dans quelques emplois autonomes (« Qu'il parte ! »).",
        ],
        examples: [
          { text: "Je doute qu'il reussisse.", note: "subjonctif : action envisagee, non posee comme reelle." },
        ],
      },
      {
        heading: 'Conditionnel et imperatif',
        content: [
          "Le conditionnel exprime une action soumise a une condition, mais aussi le futur dans le passe, l'hypothese, l'information non confirmee (« Le suspect serait en fuite ») ou la politesse (« Je voudrais »). L'imperatif exprime l'ordre, le conseil, la priere ; il n'a pas de sujet exprime.",
        ],
        examples: [
          { text: "On dirait un fantome.", note: "conditionnel d'attenuation / d'apparence." },
        ],
      },
      {
        heading: 'Infinitif et participe (modes impersonnels)',
        content: [
          "L'infinitif est la forme nominale du verbe : il peut etre sujet, COD, ou former une proposition infinitive. Le participe (present en -ant, passe) peut etre verbe ou adjectif ; le gerondif (en + participe present) exprime une circonstance simultanee (« en marchant »).",
        ],
        examples: [
          { text: "Partir, c'est mourir un peu.", note: "infinitifs employes comme noms (sujet et attribut)." },
        ],
      },
    ],
  },

  // ===== 13. Voix et emphase =====
  {
    id: 'voix-emphase',
    title: 'La voix passive et les tournures emphatiques',
    level: 'premiere',
    summary: 'Transformer actif/passif et mettre en relief un element de la phrase.',
    oralTip:
      "La voix passive deplace l'attention : le sujet subit l'action ; l'agent peut etre efface, ce qui est significatif (qui agit reellement ?). L'emphase met en relief un mot : reperez le presentatif (c'est... qui/que) ou le detachement avec reprise pronominale.",
    subsections: [
      {
        heading: 'La voix active et la voix passive',
        content: [
          "A la voix active, le sujet fait l'action. A la voix passive, le sujet la subit ; l'auteur de l'action devient complement d'agent (introduit par « par » ou « de »). Le passage au passif permet d'effacer l'agent : « La porte fut ouverte » (par qui ? on ne sait pas), effet souvent recherche en litterature.",
        ],
        examples: [
          { text: "Le jardin etait entoure de hauts murs.", note: "voix passive, complement d'agent introduit par « de »." },
        ],
      },
      {
        heading: 'Les tournures emphatiques (mise en relief)',
        content: [
          "Deux procedes : l'extraction par presentatif « c'est... qui / c'est... que » (« C'est lui qui a parle ») ; le detachement d'un element en tete ou en fin de phrase avec reprise ou annonce par un pronom (« Ce livre, je l'adore » ; « Je l'adore, ce livre »). La phrase neutre, elle, ne met aucun element en avant.",
        ],
        examples: [
          { text: "C'est dans ce silence qu'il trouva la paix.", note: "emphase par extraction (c'est... que), mise en relief du CC de lieu." },
        ],
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// Banque de QCM (partie pratique)
// ----------------------------------------------------------------------------

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // --- classes ---
  {
    id: 'q-classes-1',
    chapterId: 'classes',
    question: 'Dans « Cette maison est ancienne », quelle est la classe grammaticale de « Cette » ?',
    options: ['Un adjectif qualificatif', 'Un determinant demonstratif', 'Un pronom demonstratif', 'Une preposition'],
    correctIndex: 1,
    explanation: '« Cette » precede le nom « maison » et en precise le genre/nombre : c\'est un determinant demonstratif. « ancienne » est l\'adjectif.',
  },
  {
    id: 'q-classes-2',
    chapterId: 'classes',
    question: 'Quel mot est invariable ?',
    options: ['rapide', 'rapidement', 'rapidite', 'rapides'],
    correctIndex: 1,
    explanation: '« rapidement » est un adverbe : il ne s\'accorde jamais. Les trois autres varient (adjectif, nom, adjectif pluriel).',
  },
  {
    id: 'q-classes-3',
    chapterId: 'classes',
    question: 'Dans « Il parle mais personne n\'ecoute », « mais » est :',
    options: ['une conjonction de subordination', 'une preposition', 'une conjonction de coordination', 'un adverbe'],
    correctIndex: 2,
    explanation: '« mais » relie deux propositions de meme niveau : c\'est une conjonction de coordination (mais, ou, et, donc, or, ni, car).',
  },

  // --- fonctions ---
  {
    id: 'q-fonctions-1',
    chapterId: 'fonctions',
    question: 'Dans « Le jardinier offre des roses a sa voisine », quelle est la fonction de « des roses » ?',
    options: ['COI', 'Sujet', 'COD', 'Complement circonstanciel'],
    correctIndex: 2,
    explanation: 'Le jardinier offre QUOI ? des roses, sans preposition : c\'est le COD. « a sa voisine » est le COI.',
  },
  {
    id: 'q-fonctions-2',
    chapterId: 'fonctions',
    question: 'Dans « Cette histoire semble vraie », « vraie » est :',
    options: ['epithete', 'attribut du sujet', 'COD', 'apposition'],
    correctIndex: 1,
    explanation: '« sembler » est un verbe d\'etat : « vraie » exprime une qualite attribuee au sujet « histoire ». C\'est un attribut du sujet.',
  },
  {
    id: 'q-fonctions-3',
    chapterId: 'fonctions',
    question: 'Dans « Le chien de mon voisin aboie », « de mon voisin » est :',
    options: ['un complement du nom', 'une epithete', 'un COI', 'un complement circonstanciel'],
    correctIndex: 0,
    explanation: 'Le groupe prepositionnel « de mon voisin » complete le nom « chien » : c\'est un complement du nom (expansion du nom).',
  },
  {
    id: 'q-fonctions-4',
    chapterId: 'fonctions',
    question: 'Dans « Hier, il a beaucoup plu sur la ville », « Hier » est :',
    options: ['un COD', 'un sujet', 'un complement circonstanciel de temps', 'un attribut'],
    correctIndex: 2,
    explanation: '« Hier » indique quand a lieu l\'action ; il est deplacable et supprimable : c\'est un CC de temps.',
  },

  // --- phrase ---
  {
    id: 'q-phrase-1',
    chapterId: 'phrase',
    question: 'Quel est le TYPE de la phrase « Ferme la porte. » ?',
    options: ['Declaratif', 'Interrogatif', 'Injonctif', 'Exclamatif'],
    correctIndex: 2,
    explanation: 'La phrase donne un ordre, avec un verbe a l\'imperatif : c\'est le type injonctif (ou imperatif).',
  },
  {
    id: 'q-phrase-2',
    chapterId: 'phrase',
    question: '« C\'est toi qui as gagne » illustre une phrase de forme :',
    options: ['passive', 'negative', 'emphatique', 'impersonnelle'],
    correctIndex: 2,
    explanation: 'Le presentatif « c\'est... qui » met en relief « toi » : la phrase est de forme emphatique (mise en relief).',
  },

  // --- interrogation ---
  {
    id: 'q-interro-1',
    chapterId: 'interrogation',
    question: '« Quand reviendras-tu ? » est une interrogation :',
    options: ['totale et directe', 'partielle et directe', 'totale et indirecte', 'partielle et indirecte'],
    correctIndex: 1,
    explanation: 'Elle porte sur un element precis (le moment, « quand ») : partielle ; c\'est une phrase autonome avec point d\'interrogation : directe.',
  },
  {
    id: 'q-interro-2',
    chapterId: 'interrogation',
    question: 'Dans « Je me demande s\'il viendra », l\'interrogation est :',
    options: ['directe et totale', 'indirecte et totale', 'directe et partielle', 'indirecte et partielle'],
    correctIndex: 1,
    explanation: 'Elle est enchassee dans une subordonnee, sans inversion ni « ? » : indirecte ; introduite par « si », elle appelle oui/non : totale.',
  },
  {
    id: 'q-interro-3',
    chapterId: 'interrogation',
    question: 'Quel marqueur d\'interrogation appartient au registre le plus soutenu ?',
    options: ['Tu viens ? (intonation)', 'Est-ce que tu viens ?', 'Viens-tu ? (inversion)', 'Aucune difference de registre'],
    correctIndex: 2,
    explanation: 'L\'inversion du sujet (« Viens-tu ? ») releve du registre soutenu ; « est-ce que » est courant ; l\'intonation seule est familiere.',
  },

  // --- negation ---
  {
    id: 'q-nega-1',
    chapterId: 'negation',
    question: '« Il ne mange que des legumes » exprime :',
    options: ['une negation totale', 'une negation partielle', 'une restriction (= seulement)', 'une double negation'],
    correctIndex: 2,
    explanation: '« ne... que » n\'est pas une negation mais une tournure restrictive : il mange SEULEMENT des legumes.',
  },
  {
    id: 'q-nega-2',
    chapterId: 'negation',
    question: '« Personne n\'a rien compris » contient une negation :',
    options: ['totale', 'partielle (sur la personne et sur l\'objet)', 'lexicale', 'exceptive'],
    correctIndex: 1,
    explanation: '« ne... personne » nie l\'agent et « ne... rien » nie l\'objet : ce sont des negations partielles cumulees.',
  },
  {
    id: 'q-nega-3',
    chapterId: 'negation',
    question: 'Dans « un acte malhonnete et inutile », la negation est :',
    options: ['syntaxique', 'lexicale (par prefixes)', 'exceptive', 'totale'],
    correctIndex: 1,
    explanation: 'Aucun adverbe de negation : le sens negatif vient des prefixes « mal- » et « in- ». C\'est une negation lexicale (morphologique).',
  },

  // --- relatives ---
  {
    id: 'q-rel-1',
    chapterId: 'relatives',
    question: 'Dans « Le tableau que j\'admire est ancien », quelle est la fonction de « que » ?',
    options: ['Sujet de « admire »', 'COD de « admire »', 'Complement du nom', 'CC de lieu'],
    correctIndex: 1,
    explanation: 'On admire QUOI ? « que » (mis pour le tableau) : « que » est COD du verbe « admire » dans la subordonnee relative.',
  },
  {
    id: 'q-rel-2',
    chapterId: 'relatives',
    question: 'Quelle est la fonction de la proposition « qui dort » dans « L\'enfant qui dort sourit » ?',
    options: ['COD du verbe principal', 'Sujet de la principale', 'Expansion du nom « enfant »', 'Complement circonstanciel'],
    correctIndex: 2,
    explanation: 'La relative « qui dort » complete le nom « enfant » (son antecedent) : sa fonction est expansion / complement de l\'antecedent.',
  },
  {
    id: 'q-rel-3',
    chapterId: 'relatives',
    question: 'Dans « Les invites, qui etaient fatigues, partirent tot », la relative est :',
    options: ['determinative (restreint l\'antecedent)', 'explicative (ajoute une information)', 'une completive', 'une circonstancielle'],
    correctIndex: 1,
    explanation: 'Encadree de virgules, elle ajoute une information non essentielle sur tous les invites : c\'est une relative explicative (appositive).',
  },

  // --- completives ---
  {
    id: 'q-comp-1',
    chapterId: 'completives',
    question: 'Dans « J\'espere que tu viendras », la subordonnee est :',
    options: ['une relative', 'une completive COD', 'une circonstancielle de but', 'une interrogative indirecte'],
    correctIndex: 1,
    explanation: '« que » est ici conjonction de subordination ; la proposition complete le verbe « espere » et en est le COD.',
  },
  {
    id: 'q-comp-2',
    chapterId: 'completives',
    question: 'Quel verbe entraine le subjonctif dans la completive ?',
    options: ['Je sais que...', 'J\'affirme que...', 'Je veux que...', 'Je constate que...'],
    correctIndex: 2,
    explanation: 'Un verbe de volonte (« vouloir ») presente l\'action comme non realisee : « Je veux qu\'il vienne » (subjonctif).',
  },

  // --- circonstancielles ---
  {
    id: 'q-circ-1',
    chapterId: 'circonstancielles',
    question: '« Bien qu\'il pleuve, nous sortons » : la subordonnee exprime :',
    options: ['la cause', 'la concession', 'la consequence', 'le but'],
    correctIndex: 1,
    explanation: '« bien que » (+ subjonctif) introduit une concession : un obstacle (la pluie) qui n\'empeche pas l\'action.',
  },
  {
    id: 'q-circ-2',
    chapterId: 'circonstancielles',
    question: 'Dans « Il demande quand le train partira », la subordonnee est :',
    options: ['une relative', 'une completive', 'une interrogative indirecte', 'une circonstancielle de temps'],
    correctIndex: 2,
    explanation: 'Apres un verbe interrogatif (« demande »), introduite par le mot interrogatif « quand », c\'est une interrogative indirecte (partielle), COD du verbe.',
  },

  // --- cause-consequence-but ---
  {
    id: 'q-ccb-1',
    chapterId: 'cause-consequence-but',
    question: '« Il faisait si chaud que tout le monde suait » exprime :',
    options: ['la cause', 'le but', 'la consequence', 'la condition'],
    correctIndex: 2,
    explanation: '« si... que » introduit la consequence : le resultat (suer) decoule de l\'intensite (la chaleur).',
  },
  {
    id: 'q-ccb-2',
    chapterId: 'cause-consequence-but',
    question: 'Quelle phrase exprime le BUT ?',
    options: ['Il part parce qu\'il est tard.', 'Il part afin de ne pas rater son train.', 'Il est parti, si bien qu\'il a rate le debut.', 'Comme il etait tard, il partit.'],
    correctIndex: 1,
    explanation: '« afin de » + infinitif exprime le but, l\'intention visee. Les autres expriment la cause ou la consequence.',
  },
  {
    id: 'q-ccb-3',
    chapterId: 'cause-consequence-but',
    question: 'Quelle nuance distingue « puisque » de « parce que » ?',
    options: ['Aucune', '« puisque » introduit une cause connue/admise', '« puisque » exprime le but', '« puisque » exige le subjonctif'],
    correctIndex: 1,
    explanation: '« puisque » presente la cause comme deja connue ou admise par l\'interlocuteur, alors que « parce que » apporte une cause nouvelle.',
  },

  // --- condition-concession ---
  {
    id: 'q-cond-1',
    chapterId: 'condition-concession',
    question: '« Si tu etais venu, tu aurais compris » exprime :',
    options: ['un potentiel', 'un irreel du present', 'un irreel du passe', 'une simple hypothese future'],
    correctIndex: 2,
    explanation: 'Si + plus-que-parfait / conditionnel passe : c\'est l\'irreel du passe (le fait ne s\'est pas produit).',
  },
  {
    id: 'q-cond-2',
    chapterId: 'condition-concession',
    question: 'Laquelle de ces phrases exprime l\'OPPOSITION (et non la concession) ?',
    options: ['Bien qu\'il soit riche, il est triste.', 'Malgre sa richesse, il est triste.', 'Il est riche, tandis que son frere est pauvre.', 'Quoiqu\'il soit riche, il est triste.'],
    correctIndex: 2,
    explanation: '« tandis que » met en parallele deux faits contraires sans idee d\'obstacle : c\'est l\'opposition. Les autres expriment la concession.',
  },

  // --- temps ---
  {
    id: 'q-temps-1',
    chapterId: 'temps',
    question: 'Dans « La Terre tourne autour du Soleil », le present a une valeur de :',
    options: ['present de narration', 'present d\'enonciation', 'present de verite generale', 'present d\'habitude'],
    correctIndex: 2,
    explanation: 'Le fait est toujours vrai, independamment du moment : c\'est un present de verite generale.',
  },
  {
    id: 'q-temps-2',
    chapterId: 'temps',
    question: 'Dans « Il dormait quand l\'orage eclata », quelle est la valeur de l\'imparfait ?',
    options: ['Action de premier plan', 'Arriere-plan / cadre, action en cours', 'Verite generale', 'Action soudaine'],
    correctIndex: 1,
    explanation: 'L\'imparfait « dormait » pose le cadre, l\'action en cours (arriere-plan) ; le passe simple « eclata » marque l\'action soudaine de premier plan.',
  },
  {
    id: 'q-temps-3',
    chapterId: 'temps',
    question: 'Quel temps, dans un recit au passe, exprime typiquement les actions breves de premier plan ?',
    options: ['L\'imparfait', 'Le passe simple', 'Le plus-que-parfait', 'Le present'],
    correctIndex: 1,
    explanation: 'Le passe simple exprime les actions breves, ponctuelles, qui font progresser l\'intrigue (premier plan), par opposition a l\'imparfait.',
  },

  // --- modes ---
  {
    id: 'q-modes-1',
    chapterId: 'modes',
    question: 'Dans « Le voleur aurait pris la fuite », le conditionnel exprime :',
    options: ['une condition', 'une information non confirmee', 'un ordre', 'le futur'],
    correctIndex: 1,
    explanation: 'C\'est le conditionnel dit journalistique : il presente l\'information comme non verifiee, sous reserve.',
  },
  {
    id: 'q-modes-2',
    chapterId: 'modes',
    question: 'Dans « En marchant, il reflechissait », « en marchant » est :',
    options: ['un participe passe', 'un infinitif', 'un gerondif', 'un subjonctif'],
    correctIndex: 2,
    explanation: '« en + participe present » forme le gerondif, qui exprime ici une circonstance simultanee a l\'action principale.',
  },

  // --- voix-emphase ---
  {
    id: 'q-voix-1',
    chapterId: 'voix-emphase',
    question: 'Dans « La ville fut detruite par l\'incendie », « par l\'incendie » est :',
    options: ['un COD', 'un complement d\'agent', 'un CC de cause', 'un attribut'],
    correctIndex: 1,
    explanation: 'A la voix passive, l\'auteur de l\'action devient complement d\'agent, introduit ici par « par ».',
  },
  {
    id: 'q-voix-2',
    chapterId: 'voix-emphase',
    question: 'Quelle phrase est de forme emphatique ?',
    options: ['Il a trouve la solution.', 'C\'est lui qui a trouve la solution.', 'La solution a ete trouvee.', 'A-t-il trouve la solution ?'],
    correctIndex: 1,
    explanation: 'Le presentatif « c\'est... qui » extrait et met en relief « lui » : c\'est une tournure emphatique.',
  },
];

/** Renvoie les questions de quiz d'un chapitre donne. */
export function quizForChapter(chapterId: string): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter((q) => q.chapterId === chapterId);
}

/** Libelle lisible d'un niveau. */
export function levelLabel(level: GrammarLevel): string {
  switch (level) {
    case 'seconde':
      return 'Seconde';
    case 'premiere':
      return 'Premiere';
    default:
      return 'Transversal';
  }
}
