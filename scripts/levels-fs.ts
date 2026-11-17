import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { buildLevel, compareLevels, type Level } from '../src/levels/types.ts';

export const LEVELS_DIR = join(import.meta.dirname, '..', 'levels');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Reads every `levels/<id>/` folder from disk. */
export function readLevels(dir = LEVELS_DIR): { folder: string; level: Level }[] {
  const out: { folder: string; level: Level }[] = [];
  for (const folder of readdirSync(dir)) {
    const root = join(dir, folder);
    if (!statSync(root).isDirectory()) continue;
    const entries: Record<string, string> = {};
    for (const f of walk(root)) entries[relative(root, f).split('\\').join('/')] = readFileSync(f, 'utf8');
    out.push({ folder, level: buildLevel(entries) });
  }
  return out.sort((a, b) => compareLevels(a.level, b.level));
}
