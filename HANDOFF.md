# Handoff: port bug/drill into a real project (`Visalan-H/bugfix`)

You're picking up a working prototype and turning it into a proper app. Read this whole file before changing anything.

## What this is

**bug/drill** is a practice site for the new **Amazon online test bug-fixing round**. In that round you get a small app someone else wrote, some failing tests, and about 60 minutes to fix the bugs. Hidden tests also check your fix.

The site gives you 40 small Node/Express apps (14 easy, 14 medium, 12 hard), each with planted bugs. The user reads a task, edits the code in the browser, runs Jest-style tests **in the browser**, and submits to run hidden tests too. There's a hint system, an answers page per level, a timer, an interview mode, and a guide page that teaches the method.

- Live prototype: public link (the owner has it)
- Prototype source: `prototype/` in this repo (see `prototype/README.md`)
- Built single-file version: `prototype/dist/index.html` (open it in a browser to see everything working)

## Goal of this port

1. Vite + **React + TypeScript** app at the repo root.
2. Replace the hand-made textarea editor with **Monaco** (`@monaco-editor/react`).
3. Run user code + tests in a **Web Worker** with a hard timeout, so an infinite loop can't freeze the tab.
4. Move levels from `.bundle` text files into **real folders** (one folder per level).
5. Keep **every feature** of the prototype (list below). Nothing gets dropped.
6. CI that proves every level is valid: buggy code fails, reference fix passes visible + hidden tests.
7. Deploy (Vercel or GitHub Pages; ask the owner which).

Spring Boot levels are the next phase after this port. Don't start them here, but design the level format so a `stack: "spring"` level can be added later.

## How the prototype works (read `prototype/` for detail)

### `prototype/runtime.js`: the in-browser Node sandbox (keep this logic, port it to TS)
- **`memdb`**: a Mongoose-like in-memory store. Every call is async with a small delay (reads 1 ms, writes 15 ms), so missing `await`s and race conditions actually show up. It returns **copies**, and filters **drop `undefined` keys** (like Mongoose, so `{ owner: undefined }` matches everything). It supports `$gte $gt $lte $lt $ne $in $regex/$options`, and `findOneAndUpdate` with `$inc $set $push` that runs in **one step** (atomic).
- **Mini Express**: `express()`, `Router()`, `use(prefix, router)`, params, error middleware (4 args), Express-5 style async error catching. Double `res.json` throws `ERR_HTTP_HEADERS_SENT` and gets reported on the test. Also `res.redirect`, `res.set`, `res.end`, `sendStatus`.
- **Mini supertest**: `request(app).post(url).set(h, v).send(body)`, which returns `{ status, body, headers }`.
- **Mini Jest**: `describe / test / it / beforeEach / expect` with the usual matchers (`toBe`, `toEqual`, `toMatchObject`, `toHaveLength`, `toContain`, `toBeCloseTo`, `.not`, …).
- **Module loader**: CommonJS `require` over an in-memory `{ path: source }` map. Built-ins are `express`, `supertest`, `memdb`. Code runs with `new Function` plus a `//# sourceURL=` so stack traces have real file names. `WRAP_OFFSET` fixes the line numbers.
- **Every test runs in a fresh module registry** (fresh DB, fresh module state), so tests are isolated.
- **Console capture**: every `console.log/info/warn/error` is recorded per test with `where` (file:line of the call) and `thrownAt` (file:line where an Error argument was created). Errors print as `Name: message`. A logged Promise prints a "did you forget await?" note.

### `prototype/levels/*.bundle`: level format today
One text file per level, split into parts by `@@@ <name>` lines:
- `meta.json`: id, difficulty, title, minutes, tags, `bugs[]` (symptom, file, hints[], cause, fix, pattern), lookFor[]
- `ticket.md`: the task the user reads
- `repo/...`: the buggy app files (tests in `repo/tests/` are read-only to the user)
- `hidden.test.js`: hidden tests (run on Submit)
- `solution/...`: only the files the reference fix changes

`prototype/levels/simple-{easy,medium,hard}.json` hold **plain-English rewrites** of tagline, lookFor and each bug's pattern/hints/cause/fix. `pack.js` merges them **over** meta.json. **The simple text is the one to keep.** When you migrate, write the merged result into each level's final `meta.json` and delete the override files.

### `prototype/verify.js`: the level checker
For every level it checks that the buggy code **fails** at least one visible test, and that buggy + solution **passes all** visible and hidden tests. Run it with `node verify.js` (or `node verify.js m3 -v`). Today: 40/40 pass. **This must become a CI job.**

### `prototype/ui.js`: features that must survive the port
- **Home**: hero, 4 facts about the test, levels grouped by difficulty, filters (difficulty / solved / text search), "Random unsolved", progress counter.
- **Level page**:
  - Header: back, file-list toggle, difficulty, title, **timer** (counts down from `minutes`, goes red with +overtime, auto-starts on first edit), Diff, Reset file, Run tests (⌘/Ctrl+Enter), Submit, side-panel toggle.
  - File tree (read-only files marked, changed files get a dot).
  - **Editor tabs + split view** (two panes), with per-level tabs/split remembered. Shortcuts: Alt+W close, Alt+[ ] switch tab, Alt+\ split, Ctrl+` console.
  - **Console panel** under the editor: logs grouped by test with ✓/✗, file:line links that open the file and flash that line, a "thrown at" link, line/error counters, filter, clear, resizable, opens automatically when a run prints something.
  - Right panel tabs: **Task** (ticket markdown, suggested timing bar, tips), **Results** (visible + hidden tests, each with errors and its console output), **Hints** (per bug: hints one at a time, then "Show the answer"), **Notes** (saved per level), **Answers** (locked until solved, or "show the answer" which marks the level as not counting; shows each bug's cause/fix and a diff of the reference fix, plus "load the fix into the editor").
  - **Diff modal**: your changes vs the original, plus reset all.
- **Interview mode** (global toggle): hides hints, tips, hidden-test names and answers until solved.
- **Guide page** (`playbook.html`): plain-English method, 60-minute plan, common-bug catalogue with bad/good code, hidden-test checklist, AI-helper tips, Spring Boot mapping table, sources.
- **Persistence**: `localStorage` key `bugdrill:v1` (edits, notes, solved, best time, hints used, layout, filters). Keep the key or migrate it, so existing users keep their progress.
- **Mobile**: three tabs (Files / Code / Task-Results), no split view.

## Target architecture (suggested; push back if you see better)

```
/                       Vite + React + TS app
src/
  app/                  routes: /, /level/:id, /guide (hash router is fine)
  editor/               Monaco setup, tabs, split panes
  runner/
    worker.ts           runs a test file in a Worker; posts results one by one
    sandbox/            runtime.js ported to TS (memdb, express, supertest, expect, loader)
  levels/               level loader (import.meta.glob over /levels/**)
  ui/                   console, results, hints, answers, diff, timer, filters
levels/
  e1/ meta.json ticket.md hidden.test.js repo/** solution/**
  ...
scripts/
  migrate-bundles.ts    one-off: prototype/levels/*.bundle + simple-*.json → levels/<id>/
  verify-levels.ts      CI check (port of verify.js; run in Node, same sandbox code)
.github/workflows/ci.yml   typecheck, lint, verify-levels, build
```

### Monaco notes
- Create one Monaco **model per file** with URIs like `file:///src/services/x.js`, so go-to-definition and find-references work across files. Mark test files read-only.
- JavaScript language service: `allowJs`, `module: CommonJS`. Add `extraLibs` with small `.d.ts` stubs for `express`, `supertest`, `memdb` and the Jest globals, so autocomplete works and `require('memdb')` isn't flagged red.
- Set up Vite workers the official way (`?worker` imports for `editor.worker` and `ts.worker`).
- Keep the editor theme close to the current dark look (`prototype/style.css` has the palette).
- Clicking a console file:line link must open the file and `revealLineInCenter` + a decoration that flashes the line.

### Runner notes
- Run each test file in a **Web Worker**. Post each test result as it finishes (the UI updates live). Kill the worker after a hard timeout (about 10 s total) and report "your code didn't finish (infinite loop?)".
- Keep **one fresh registry per test**, exactly as the prototype does. Tests depend on this.
- The same sandbox code must run in **Node** for `verify-levels` (no DOM in the sandbox).
- Line numbers: the prototype measures `WRAP_OFFSET` at startup. Keep that approach, or switch to a different wrapper and re-check that `where` lines match the editor.

## Writing rules (the owner asked for this)
All UI text, hints, tickets and the guide use **plain, simple English**: short sentences, one idea each, no jargon. If a technical word is needed (e.g. "await"), keep the code word but explain it in plain words. Code inside levels stays realistic.

## Milestones
1. Scaffold Vite/React/TS + lint/format + CI skeleton.
2. Port the sandbox to TS; port `verify.js` → `scripts/verify-levels.ts`; migrate the bundles into `levels/<id>/`. **Gate: 40/40 levels pass in CI.**
3. Level page with Monaco (models, tabs, split, read-only tests), the Worker runner, Results and Console.
4. Remaining panels (Task, Hints, Notes, Answers, Diff), timer, interview mode, persistence (same localStorage key).
5. Home, filters, Guide page, mobile layout.
6. Deploy. Compare side by side with `prototype/dist/index.html` and confirm nothing is missing (use the feature list above as the checklist).

## Done means
- `npm run verify` (and CI) shows **40/40** levels valid.
- Every feature in the list above works, on desktop and phone width.
- An infinite loop in user code shows an error and the page stays responsive.
- Console file:line links land on the right line in Monaco.
- Existing progress in `bugdrill:v1` still loads.

## Working with the owner
- The owner is Visalan, a full-stack developer preparing for this exact Amazon round. He wants direct, plain answers and real opinions (push back if something's a bad idea).
- Commit in small, clear steps. Ask before deploying, or before deleting `prototype/` (keep it until the port is confirmed complete).
