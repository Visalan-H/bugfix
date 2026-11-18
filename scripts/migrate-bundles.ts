// One-off: turns prototype/levels/*.bundle + simple-*.json into levels/<id>/ folders.
// The plain-English text from simple-*.json wins over the bundle's meta.json.
//
//   npx tsx scripts/migrate-bundles.ts
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Bug, LevelMeta } from '../src/levels/types.ts';
import { LEVELS_DIR } from './levels-fs.ts';

const SRC = join(import.meta.dirname, '..', 'prototype', 'levels');

/** Splits a bundle into parts by `@@@ <name>` lines (same rules as prototype/pack.js). */
function parseBundle(text: string): Record<string, string> {
  const parts: Record<string, string[]> = {};
  let cur: string | null = null;
  for (const line of text.split('\n')) {
    const m = /^@@@ (.+)$/.exec(line);
    if (m) {
      cur = m[1].trim();
      parts[cur] = [];
      continue;
    }
    if (cur) parts[cur].push(line);
  }
  const out: Record<string, string> = {};
  // Every file ends with exactly one newline.
  for (const k in parts) out[k] = parts[k].join('\n').replace(/\n*$/, '\n');
  return out;
}

type Simple = Record<string, { tagline: string; lookFor: string[]; bugs: Partial<Bug>[] }>;
const simple: Simple = {};
for (const f of readdirSync(SRC).filter((x) => /^simple-.*\.json$/.test(x)))
  Object.assign(simple, JSON.parse(readFileSync(join(SRC, f), 'utf8')));

rmSync(LEVELS_DIR, { recursive: true, force: true });
let n = 0;
for (const f of readdirSync(SRC)
  .filter((x) => x.endsWith('.bundle'))
  .sort()) {
  const parts = parseBundle(readFileSync(join(SRC, f), 'utf8'));
  const old = JSON.parse(parts['meta.json']) as Omit<LevelMeta, 'stack'>;
  const s = simple[old.id];
  if (!s) throw new Error(`no simple text for ${old.id}`);
  if (s.bugs.length !== old.bugs.length) throw new Error(`bug count mismatch for ${old.id}`);
  const meta: LevelMeta = {
    id: old.id,
    stack: 'node',
    difficulty: old.difficulty,
    title: old.title,
    minutes: old.minutes,
    tagline: s.tagline,
    tags: old.tags,
    lookFor: s.lookFor,
    bugs: old.bugs.map((b, i) => {
      const m = { ...b, ...s.bugs[i] };
      return {
        symptom: b.symptom.replace(/^\(hidden\)\s*/, 'Hidden test: '),
        file: m.file,
        hints: m.hints,
        cause: m.cause,
        fix: m.fix,
        pattern: m.pattern,
      };
    }),
  };
  const dir = join(LEVELS_DIR, meta.id);
  const write = (rel: string, text: string) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  };
  write('meta.json', JSON.stringify(meta, null, 2) + '\n');
  for (const k in parts) if (k !== 'meta.json') write(k, parts[k]);
  n++;
}
console.log(`migrated ${n} levels into ${LEVELS_DIR}`);
