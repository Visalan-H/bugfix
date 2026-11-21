// After `npm run build`: makes sure no answer can be found by searching the built
// site. Every hidden test, fix and answer text must only exist scrambled.
//
//   npm run build && npm run check:leaks
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { splitLevel } from '../src/levels/secret.ts';
import { readLevels } from './levels-fs.ts';

const DIST = join(import.meta.dirname, '..', process.argv[2] ?? 'dist');

const walk = (d: string): string[] =>
  readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const site = walk(DIST)
  .filter((f) => /\.(js|html|css|json|txt|map)$/.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

// Runs of plain characters (no quotes or slashes), so escaping in the bundle can't hide a match.
const pieces = (text: string) => text.match(/[A-Za-z0-9 _.,:;=()<>+\-*!?{}[\]]{24,}/g) ?? [];

const levels = readLevels().map((x) => x.level);
// Text anyone may see. Shared lines like `expect(res.status).toBe(400);` are not leaks.
// The Guide teaches the common bugs with bad/good code on purpose, so it counts as public too.
const guide = readFileSync(join(import.meta.dirname, '..', 'src', 'pages', 'guide-content.html'), 'utf8')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&');
const pub = [
  guide,
  ...levels.flatMap((L) => [JSON.stringify(splitLevel(L).meta), L.ticket, ...Object.values(L.files)]),
].join('\n');

let leaks = 0;
for (const level of levels) {
  const { secrets } = splitLevel(level);
  const secretTexts = [
    secrets.hidden,
    ...Object.values(secrets.solution),
    ...secrets.lookFor,
    ...secrets.bugs.flatMap((b) => [...b.hints, b.cause, b.fix, b.pattern, b.symptom]),
  ];
  const found = new Set<string>();
  for (const t of secretTexts)
    for (const p of pieces(t)) {
      const s = p.trim();
      if (s.length >= 24 && !pub.includes(s) && site.includes(s)) found.add(s);
    }
  if (found.size) {
    leaks++;
    console.log(`✗ ${level.id}: ${found.size} secret piece(s) readable in the build, e.g. "${[...found][0]}"`);
  }
}
console.log(leaks ? `\n${leaks} level(s) leak answers` : 'No answers readable in the build');
process.exit(leaks ? 1 : 0);
