# bugfix

Practice site for the Amazon online test **bug-fixing round**: 40 small Node/Express apps with planted bugs, tests that run in the browser, hidden tests, hints, a timer and a guide.

## Run it

```bash
npm install
npm run dev        # local site
npm run build      # production build in dist/
```

## Check the levels

Every level must fail on the buggy code and pass with the reference fix (visible and hidden tests). CI runs this on every push.

```bash
npm run verify            # all levels
npm run verify -- m3 -v   # one level, every test
npm run test:sandbox      # checks the in-browser Node sandbox itself
npm run check:leaks       # after a build: no answer is readable in dist/
```

## How answers are kept out of sight

Hidden tests, fixes, hints and answer text are scrambled into a separate small file per level. The site fetches that file only when you press Submit or open Hints or Answers. So you can't find an answer by searching the site's code. This stops casual peeking, not a determined cheater. The repo itself must stay private.

## Layout

| Path                  | What it is                                                                             |
| --------------------- | -------------------------------------------------------------------------------------- |
| `levels/<id>/`        | One folder per level: `meta.json`, `ticket.md`, `repo/`, `hidden.test.js`, `solution/` |
| `src/runner/sandbox/` | The Node-like sandbox: memdb, mini Express, supertest, Jest, `require`                 |
| `scripts/`            | `verify-levels.ts` (level check) and `migrate-bundles.ts` (one-off migration)          |
| `prototype/`          | The old single-file version, kept as the reference until the port is done              |
| `HANDOFF.md`          | The port plan                                                                          |
