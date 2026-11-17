import type { Files } from '../runner/sandbox/types';

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Which kind of app a level is. Only `node` exists today; `spring` comes later. */
export type Stack = 'node' | 'spring';

export interface Bug {
  /** What goes wrong, as the user sees it. Starts with "Hidden test:" if only a hidden test catches it. */
  symptom: string;
  file: string;
  hints: string[];
  cause: string;
  fix: string;
  pattern: string;
}

/** Contents of `levels/<id>/meta.json`. */
export interface LevelMeta {
  id: string;
  stack: Stack;
  difficulty: Difficulty;
  title: string;
  minutes: number;
  tagline: string;
  tags: string[];
  lookFor: string[];
  bugs: Bug[];
}

/** A level with all its files loaded. */
export interface Level extends LevelMeta {
  ticket: string;
  /** The buggy app the user starts from (`repo/**`), keyed by path inside the repo. */
  files: Files;
  /** Hidden tests, run on Submit. */
  hidden: string;
  /** Only the files the reference fix changes (`solution/**`). */
  solution: Files;
}

/** Where the hidden test file sits while it runs, so `require('../src/app')` works. */
export const HIDDEN_TEST_PATH = 'tests/__hidden__.test.js';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export const isTestFile = (p: string) => p.startsWith('tests/');

/** Easy → medium → hard, then by number (e2 before e10). */
export function compareLevels(a: LevelMeta, b: LevelMeta): number {
  return (
    DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty) ||
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );
}

/**
 * Builds a level from the files in its folder, keyed by path inside the folder
 * (`meta.json`, `repo/src/app.js`, …). Shared by the app and the Node scripts.
 */
export function buildLevel(entries: Record<string, string>): Level {
  const meta = JSON.parse(entries['meta.json']) as LevelMeta;
  const files: Files = {};
  const solution: Files = {};
  for (const k of Object.keys(entries).sort()) {
    if (k.startsWith('repo/')) files[k.slice(5)] = entries[k];
    else if (k.startsWith('solution/')) solution[k.slice(9)] = entries[k];
  }
  return { ...meta, ticket: entries['ticket.md'], files, hidden: entries['hidden.test.js'], solution };
}

/** Problems with a level's shape. Empty means fine. */
export function checkLevelShape(L: Level, folder: string): string[] {
  const p: string[] = [];
  if (L.id !== folder) p.push(`meta id "${L.id}" does not match folder "${folder}"`);
  if (!['node', 'spring'].includes(L.stack)) p.push(`unknown stack "${L.stack}"`);
  if (!DIFFICULTIES.includes(L.difficulty)) p.push(`unknown difficulty "${L.difficulty}"`);
  if (!(L.minutes > 0)) p.push('minutes must be a positive number');
  for (const k of ['title', 'tagline'] as const) if (!L[k]?.trim()) p.push(`${k} is empty`);
  if (!L.tags?.length) p.push('no tags');
  if (!L.lookFor?.length) p.push('no lookFor tips');
  if (!L.bugs?.length) p.push('no bugs');
  L.bugs?.forEach((b, i) => {
    for (const k of ['symptom', 'file', 'cause', 'fix', 'pattern'] as const)
      if (!b[k]?.trim()) p.push(`bug ${i + 1}: ${k} is empty`);
    if (!b.hints?.length) p.push(`bug ${i + 1}: no hints`);
    // `file` may add a note after the path, e.g. "src/repo.js + controller".
    const path = b.file?.split(/\s/)[0];
    if (path && L.files[path] === undefined) p.push(`bug ${i + 1}: file ${path} is not in repo/`);
  });
  if (!L.ticket?.trim()) p.push('ticket.md is missing or empty');
  if (!L.hidden?.trim()) p.push('hidden.test.js is missing or empty');
  if (!Object.keys(L.files).some(isTestFile)) p.push('no visible tests in repo/tests/');
  if (!Object.keys(L.solution).length) p.push('solution/ is empty');
  for (const s of Object.keys(L.solution)) {
    if (L.files[s] === undefined) p.push(`solution/${s} has no matching repo/${s}`);
    else if (L.files[s] === L.solution[s]) p.push(`solution/${s} is the same as the buggy file`);
  }
  return p;
}
