# OralRevision

A local web app / PWA for memorising the linear analyses ("oraux") I have to recite for the French bac. The app's interface is in French, since that's the language of the exam it's built for, but this README is in English.

## Why I built it

For the bac oral, you write out a full literary analysis for each text on your list and then have to recite it from memory, word for word, on the day. Learning ten-plus pages of prose by heart is a different problem from understanding it, and I wanted something built specifically for that: read the text out loud on a loop, get tested on it with a fill-in-the-blanks mode, and have the app tell me which paragraphs I'm about to forget based on an actual schedule rather than my own guess.

## What it does

- **Paste in your text**, and the app automatically detects its structure (introduction, "mouvements", conclusion) using Gemini. A validation screen shows you the proposed split so you can fix anything before saving.
- **A full editor** to reword paragraph boundaries, merge or split sections, rename "mouvements", and change how a section is memorised.
- **Active recall reading**: text hidden and revealed sentence by sentence, or a fill-in-the-blanks mode.
- **Looped audio** using the browser's built-in speech synthesis (Web Speech API), with a choice of voice, speed, and pause between repeats.
- **Spaced repetition**: each paragraph has a mastery level (0–5) that drives its next review date, and the intervals compress automatically as the exam gets closer.
- **A daily session**: a prioritised review queue mixing paragraphs never seen, overdue ones, and weak spots.
- **Special modes**: weak paragraphs only, mock exam (random draw), full recitation, fill-in-the-blanks, plan-only (structure recall).
- **A dashboard** with a countdown, whether you're ahead or behind schedule, and a study streak.
- **Import/export** of all your data as a JSON file, and it works offline once a text has been imported.

## How it works

**The text never gets rewritten. That's the whole point.** The one rule the project is built around is that Gemini is only allowed to *cut and label* the text I pasted in, never rephrase it, since the entire exercise is reciting my own words. This is enforced at three layers, not just a prompt:
1. The backend prompt (`server/prompts/parseOralPrompt.ts`) explicitly tells Gemini not to correct, simplify, summarise or rephrase anything, and to return only a JSON structure where each text fragment is copied verbatim from the original.
2. The request forces a JSON response (`responseMimeType: application/json`), which rules out free-form prose coming back.
3. On the client, `isExactSubstring` (in `src/api/geminiParser.ts`) re-checks every paragraph Gemini returns against the original text. Anything that isn't an exact substring gets flagged as a warning on the validation screen rather than silently accepted.

If the backend isn't running or has no API key, import falls back to a local parser (`src/utils/parseOralFallback.ts`) that splits on headings and blank lines instead. The app still works, just with a cruder split you then fix by hand.

**Spaced repetition with exam-date compression.** Each paragraph has a mastery score from 0 to 5, and after each review you rate yourself, which recalculates the next review date (`src/scheduleAlgorithm.ts`). The "ideal" interval per mastery level ranges from same-day at 0 up to about two weeks at 5, but the interval actually applied is `min(idealInterval, max(1, floor(daysRemaining / 2)))`. In practice that means as the exam approaches, reviews get pulled closer together automatically: even a "mastered" paragraph gets revisited once more before the exam, and daily load rises mechanically in the last stretch instead of me having to notice and compensate manually. The daily session (`buildDailySession`) mixes never-seen paragraphs, overdue ones, and weak spots, alternating between different texts and sections to avoid drilling the same one repeatedly.

**Architecture.** It's a React/Vite/Zustand frontend that does all the actual learning (and works standalone), plus a thin Express backend whose only job is to keep the Gemini API key off the client and apply the strict prompt. The frontend calls `POST /api/parse-oral` only at import time; everything else (reading, audio, scheduling, storage) runs entirely client-side against `localStorage`, which is also why the app keeps working offline once your texts are in.

## Data and privacy

Everything stays in your browser's `localStorage`. The only thing that ever leaves your machine is the pasted text sent to Gemini at import time, and only if you're running the backend with a key configured. Every change is saved automatically; you can export your entire dataset to a JSON file from Settings and reimport it later or on another device.

## Running it locally

Requires Node 18+ (tested on Node 24).

```bash
npm install
npm run dev
```

This starts the Vite frontend on `http://localhost:5173` and the Express backend on `http://localhost:8787` together (the frontend proxies `/api` to it automatically). You can also run them separately with `npm run dev:client` / `npm run dev:server`, or build for production with `npm run build` / `npm run preview`.

Gemini-based import is optional. Without a key, the app falls back to the local parser described above. To enable it:

```bash
cp server/.env.example server/.env   # Windows: Copy-Item server\.env.example server\.env
```

Then edit `server/.env`:

```ini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=8787
```

`server/.env` is git-ignored, so the key never gets committed. A free key is available at https://aistudio.google.com/apikey. Once your texts are imported, you can close the backend entirely; the app keeps working offline from `localStorage`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Frontend + backend together (development) |
| `npm run dev:client` / `dev:server` | Just the frontend (Vite) / just the backend (Express, hot reload) |
| `npm run server` | Backend only, no hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc --noEmit` over the whole project |

## Limitations / what I'd do next

- Speech synthesis quality depends entirely on the browser and the voices installed on the machine. It's noticeably better on Chrome/Edge than elsewhere, and there's no bundled TTS fallback.
- The local fallback parser is much cruder than the Gemini-based one; if your text doesn't use clear headings or blank lines between "mouvements", you'll end up fixing the split by hand on the validation screen.
- There's no sync between devices beyond manual JSON export/import, which is fine for my own use but wouldn't scale to sharing a set of texts with classmates.
- I'd like to tune the spaced-repetition intervals with real usage data rather than the fixed table I started with, and add a way to compare recitation attempts against the reference text automatically instead of just self-rating.
