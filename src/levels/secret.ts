import type { Files } from '../runner/sandbox/types';
import type { Bug, Level, LevelMeta } from './types';

// Answers are not sent as plain text. Each level's secret part is scrambled into
// its own file and fetched only when needed (Submit, Hints, Answers), so nobody
// finds an answer by searching the site's code. This is not real security:
// someone set on cheating can still unscramble it.

/** Bug fields that give the answer away. */
export type BugSecret = Pick<Bug, 'file' | 'hints' | 'cause' | 'fix'>;
export type PublicBug = Omit<Bug, keyof BugSecret>;

export interface PublicMeta extends Omit<LevelMeta, 'bugs'> {
  bugs: PublicBug[];
}

export interface LevelSecrets {
  hidden: string;
  solution: Files;
  bugs: BugSecret[];
}

export function splitLevel(L: Level): { meta: PublicMeta; secrets: LevelSecrets } {
  const { ticket: _t, files: _f, hidden, solution, bugs, ...rest } = L;
  return {
    meta: { ...rest, bugs: bugs.map(({ symptom, pattern }) => ({ symptom, pattern })) },
    secrets: { hidden, solution, bugs: bugs.map(({ file, hints, cause, fix }) => ({ file, hints, cause, fix })) },
  };
}

function keyFor(id: string): Uint8Array {
  // Small per-level key stream. Enough to stop text search, nothing more.
  const out = new Uint8Array(64);
  let h = 2166136261;
  const seed = 'bug/drill:' + id;
  for (let i = 0; i < out.length; i++) {
    h ^= seed.charCodeAt(i % seed.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    out[i] = h & 0xff;
  }
  return out;
}

function xor(bytes: Uint8Array, id: string): Uint8Array {
  const k = keyFor(id);
  return bytes.map((b, i) => b ^ k[i % k.length]);
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function scramble(id: string, secrets: LevelSecrets): string {
  return toBase64(xor(new TextEncoder().encode(JSON.stringify(secrets)), id));
}

export function unscramble(id: string, data: string): LevelSecrets {
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(xor(bytes, id)));
}
