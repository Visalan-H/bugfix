# Prototype (single-file version)

This is the working version that's live today. It's kept as the reference for the port. See `../HANDOFF.md`.

| File | What it is |
|---|---|
| `runtime.js` | In-browser Node sandbox: memdb, mini Express, mini supertest, mini Jest, CommonJS loader, console capture |
| `ui.js` | The whole UI (home, level page, editor tabs/split, console, panels, guide routing) |
| `style.css` | Styles |
| `playbook.html` | The Guide page content |
| `levels/*.bundle` | 40 levels, one file each, split by `@@@ <part>` lines |
| `levels/simple-*.json` | Plain-English text that `pack.js` merges over each level's meta |
| `pack.js` | Reads bundles + simple text → level objects |
| `verify.js` | Checks every level: buggy fails, fix passes visible + hidden |
| `build.js` | Builds `dist/index.html` (one self-contained file) |

```bash
node verify.js          # all levels
node verify.js m3 -v    # one level, every test
node build.js           # rebuild dist/index.html
```
