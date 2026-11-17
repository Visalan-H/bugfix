import { isTestFile } from '../levels/types';
import type { Files } from '../runner/sandbox/types';

/** Files the user can't change: tests, package.json and docs. */
export const isReadOnly = (p: string) => isTestFile(p) || p === 'package.json' || p.endsWith('.md');

/** Folders first, then by name (like the prototype's file list). */
export function sortPaths(paths: string[]): string[] {
  return [...paths].sort((a, b) => {
    const da = a.includes('/');
    const db = b.includes('/');
    if (da !== db) return da ? -1 : 1;
    return a.localeCompare(b);
  });
}

/** The file to open first: a route or controller, else the first source file. */
export const defaultFile = (files: Files) =>
  Object.keys(files).find((f) => /routes|controllers/.test(f)) ??
  Object.keys(files).find((f) => f.startsWith('src/')) ??
  Object.keys(files)[0];

export const firstTestFile = (files: Files) => Object.keys(files).find(isTestFile);
