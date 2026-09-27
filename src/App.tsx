// ============================================================================
// App.tsx - Coquille de l'application (mise en page + routeur interne + theme)
// ----------------------------------------------------------------------------
// Responsabilites volontairement limitees :
//   1. Appliquer le theme clair/sombre (classe `.dark` sur <html>).
//   2. Afficher la barre laterale de navigation et l'en-tete (compte a rebours,
//      serie en cours, bascule de theme).
//   3. Router vers la vue active en fonction de `uiStore.view`.
// Toute la logique metier vit dans les vues elles-memes, qui lisent directement
// les stores. App ne fait que les assembler.
// ============================================================================

import { useEffect, type ReactNode } from 'react';
import { useStore } from './store';
import { useUiStore, type View } from './uiStore';
import { daysUntilExam } from './scheduleAlgorithm';

import Dashboard from './components/Dashboard';
import OralList from './components/OralList';
import OralImporter from './components/OralImporter';
import OralValidation from './components/OralValidation';
import OralEditor from './components/OralEditor';
import StudySession from './components/StudySession';
import ExamMode from './components/ExamMode';
import WeakParagraphsMode from './components/WeakParagraphsMode';
import FullOralMode from './components/FullOralMode';
import PlanOnlyMode from './components/PlanOnlyMode';
import GrammarSection from './components/GrammarSection';
import OeuvreSection from './components/OeuvreSection';
import Settings from './components/Settings';

// ---------------------------------------------------------------------------
// Icones (SVG en ligne, style « trait » - aucune dependance, aucun emoji)
// ---------------------------------------------------------------------------

type IconName =
  | 'home'
  | 'layers'
  | 'play'
  | 'alert'
  | 'check'
  | 'sliders'
  | 'sun'
  | 'moon'
  | 'plus'
  | 'flame'
  | 'book'
  | 'feather';

const ICON_PATHS: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  layers: (
    <>
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </>
  ),
  play: <path d="M5 3l14 9-14 9z" />,
  alert: (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  check: (
    <>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M2 14h4" />
      <path d="M10 8h4" />
      <path d="M18 16h4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </>
  ),
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  flame: <path d="M12 2s5 4 5 9a5 5 0 0 1-10 0c0-1.5.6-2.8 1.3-3.7C8 8.5 8 7 8 7s1.5 1 2 2c.5-2 2-4 2-7z" />,
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  feather: (
    <>
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <path d="M16 8 2 22" />
      <path d="M17.5 15H9" />
    </>
  ),
};

function Icon({ name, className = 'h-[18px] w-[18px]' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tables de routage (libelles, icones, regroupement des vues contextuelles)
// ---------------------------------------------------------------------------

interface NavEntry {
  view: View;
  label: string;
  icon: IconName;
}

/** Entrees de navigation principales affichees dans la barre laterale. */
const NAV: NavEntry[] = [
  { view: 'dashboard', label: 'Tableau de bord', icon: 'home' },
  { view: 'orals', label: 'Mes oraux', icon: 'layers' },
  { view: 'session', label: 'Session du jour', icon: 'play' },
  { view: 'weak', label: 'Points faibles', icon: 'alert' },
  { view: 'exam', label: 'Examen blanc', icon: 'check' },
  { view: 'grammar', label: 'Grammaire', icon: 'book' },
  { view: 'oeuvre', label: "L'oeuvre", icon: 'feather' },
  { view: 'settings', label: 'Reglages', icon: 'sliders' },
];

/**
 * Les vues contextuelles (import, validation, editeur, recitation, plan) ne sont
 * pas dans la barre laterale : on les rattache visuellement a l'onglet « Mes
 * oraux » pour conserver un repere de navigation coherent.
 */
const VIEW_GROUP: Record<View, View> = {
  dashboard: 'dashboard',
  orals: 'orals',
  import: 'orals',
  validation: 'orals',
  editor: 'orals',
  full: 'orals',
  plan: 'orals',
  session: 'session',
  weak: 'weak',
  exam: 'exam',
  grammar: 'grammar',
  oeuvre: 'oeuvre',
  settings: 'settings',
};

/** Titre affiche dans l'en-tete pour chaque vue. */
const VIEW_TITLE: Record<View, string> = {
  dashboard: 'Tableau de bord',
  orals: 'Mes oraux',
  import: 'Importer un oral',
  validation: "Validation de l'analyse",
  editor: "Edition de l'oral",
  session: 'Session du jour',
  exam: 'Examen blanc',
  weak: 'Points faibles',
  full: "Reciter l'oral complet",
  plan: "Plan de l'oral",
  grammar: 'Grammaire',
  oeuvre: "Entretien sur l'oeuvre",
  settings: 'Reglages',
};

// ---------------------------------------------------------------------------
// Routeur de vue
// ---------------------------------------------------------------------------

function renderView(view: View): ReactNode {
  switch (view) {
    case 'dashboard':
      return <Dashboard />;
    case 'orals':
      return <OralList />;
    case 'import':
      return <OralImporter />;
    case 'validation':
      return <OralValidation />;
    case 'editor':
      return <OralEditor />;
    case 'session':
      return <StudySession />;
    case 'exam':
      return <ExamMode />;
    case 'weak':
      return <WeakParagraphsMode />;
    case 'full':
      return <FullOralMode />;
    case 'plan':
      return <PlanOnlyMode />;
    case 'grammar':
      return <GrammarSection />;
    case 'oeuvre':
      return <OeuvreSection />;
    case 'settings':
      return <Settings />;
    default:
      return <Dashboard />;
  }
}

// ---------------------------------------------------------------------------
// Petits composants de l'en-tete / barre laterale
// ---------------------------------------------------------------------------

/** Pastille « J-n » coloree selon l'urgence (rouge < 14 j, ambre < 30 j). */
function CountdownBadge({ daysLeft }: { daysLeft: number }) {
  let text: string;
  if (daysLeft > 0) text = `J-${daysLeft}`;
  else if (daysLeft === 0) text = 'Jour J';
  else text = 'Examen passe';

  const color =
    daysLeft <= 0
      ? '#64748b' // slate-500
      : daysLeft <= 14
        ? '#ef4444' // red-500
        : daysLeft <= 30
          ? '#f59e0b' // amber-500
          : '#0ea5e9'; // brand/sky-500

  return (
    <span
      className="badge tabular-nums"
      style={{ backgroundColor: `${color}1a`, color }}
      title="Jours restants avant l'examen"
    >
      {text}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Composant racine
// ---------------------------------------------------------------------------

export default function App() {
  const view = useUiStore((s) => s.view);
  const navigate = useUiStore((s) => s.navigate);

  const settings = useStore((s) => s.settings);
  const streak = useStore((s) => s.streak);
  const setTheme = useStore((s) => s.setTheme);

  // --- Application du theme : on (de)pose la classe `.dark` sur <html>. ---
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  const daysLeft = daysUntilExam(settings.examDate);
  const activeGroup = VIEW_GROUP[view];
  const isDark = settings.theme === 'dark';

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <div className="min-h-screen lg:flex">
      {/* ================= Barre laterale ================= */}
      <aside className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r lg:sticky lg:top-0">
        {/* Marque */}
        <button
          type="button"
          onClick={() => navigate('dashboard')}
          className="flex w-full items-center gap-2 px-5 py-4 text-left"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
            <Icon name="layers" className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-bold leading-tight">OralRevision</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Memorisation d'oraux</span>
          </span>
        </button>

        {/* Navigation principale */}
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-3 lg:py-2">
          {NAV.map((item) => {
            const active = activeGroup === item.view;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => navigate(item.view)}
                className={`nav-item shrink-0 ${active ? 'nav-item-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon name={item.icon} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bas de la barre laterale (desktop) : import + rappel cle. */}
        <div className="mt-auto hidden space-y-3 border-t border-slate-200 p-3 dark:border-slate-800 lg:block">
          <button type="button" className="btn-primary w-full" onClick={() => navigate('import')}>
            <Icon name="plus" className="h-4 w-4" />
            Importer un oral
          </button>
          <p className="px-1 text-[11px] leading-snug text-slate-400">
            Le texte de vos analyses n'est jamais reformule : il reste mot pour mot celui que vous collez.
          </p>
        </div>
      </aside>

      {/* ================= Zone principale ================= */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* En-tete */}
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 lg:px-8">
          <h1 className="truncate text-lg font-bold">{VIEW_TITLE[view]}</h1>

          <div className="ml-auto flex items-center gap-2">
            <CountdownBadge daysLeft={daysLeft} />

            {streak.count > 0 && (
              <span
                className="badge-brand hidden items-center sm:inline-flex"
                title={`Meilleure serie : ${streak.best} jour${streak.best > 1 ? 's' : ''}`}
              >
                <Icon name="flame" className="h-3.5 w-3.5" />
                {streak.count} j
              </span>
            )}

            {/* Import rapide (toujours visible, utile sur mobile). */}
            <button
              type="button"
              className="btn-outline !px-2.5"
              onClick={() => navigate('import')}
              title="Importer un oral"
              aria-label="Importer un oral"
            >
              <Icon name="plus" className="h-4 w-4" />
              <span className="hidden md:inline">Importer</span>
            </button>

            {/* Bascule clair / sombre. */}
            <button
              type="button"
              className="btn-ghost !px-2.5"
              onClick={toggleTheme}
              title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              <Icon name={isDark ? 'sun' : 'moon'} />
            </button>
          </div>
        </header>

        {/* Contenu de la vue active */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{renderView(view)}</main>

        {/* Pied de page discret */}
        <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-400 dark:border-slate-800 lg:px-8">
          OralRevision - application locale, vos donnees restent dans ce navigateur.
        </footer>
      </div>
    </div>
  );
}
