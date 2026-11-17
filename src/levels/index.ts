import { fileLoaders, metas, secretLoaders } from 'virtual:levels';
import type { Files } from '../runner/sandbox/types';
import { unscramble, type LevelSecrets, type PublicMeta } from './secret';

// Level data for the app. The list loads up front; a level's files load when it
// opens; the secret part (hidden tests, fix, answers) loads only when asked for.

export interface LevelSummary extends PublicMeta {
  fileCount: number;
}

/** Every level, in order (easy → hard). */
export const LEVELS: LevelSummary[] = metas;

export const getLevel = (id: string) => LEVELS.find((l) => l.id === id);

export interface LoadedLevel extends LevelSummary {
  ticket: string;
  /** The buggy app, keyed by path inside the repo (`src/app.js`). */
  files: Files;
}

/** The ticket and the buggy files of one level. */
export async function loadLevel(id: string): Promise<LoadedLevel | null> {
  const meta = getLevel(id);
  if (!meta) return null;
  const { ticket, files } = (await fileLoaders[id]()).default;
  return { ...meta, ticket, files };
}

const secretCache = new Map<string, Promise<LevelSecrets>>();

/** Hidden tests, the reference fix and the answer text. Fetch only when needed. */
export function loadSecrets(id: string): Promise<LevelSecrets> {
  let p = secretCache.get(id);
  if (!p) {
    p = secretLoaders[id]().then((m) => unscramble(id, m.default));
    secretCache.set(id, p);
  }
  return p;
}
