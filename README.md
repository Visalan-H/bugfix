# bugfix

Practice site for the Amazon online test **bug-fixing round**: 40 small Node/Express apps with planted bugs, tests that run in the browser, hidden tests, hints, a timer and a guide.

- `prototype/`: the working single-file version (open `prototype/dist/index.html` in a browser).
- `HANDOFF.md`: the plan for porting it into a Vite + React + TypeScript app with Monaco.

Check that every level is valid (buggy code fails, reference fix passes):

```bash
cd prototype
node verify.js
```
