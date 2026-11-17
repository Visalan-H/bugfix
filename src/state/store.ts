import { useSyncExternalStore } from 'react';
import type { Files } from '../runner/sandbox/types';

// Saved progress. Same localStorage key and shape as the prototype, so old
// progress still loads.
export const STORAGE_KEY = 'bugdrill:v1';

export interface PaneLayout {
  tabs: string[];
  active: string;
}

export interface LevelProgress {
  /** Changed files only, keyed by path. A file equal to the original is not stored. */
  edits: Files;
  notes: string;
  solved: boolean;
  /** Best solve time in seconds. */
  best: number | null;
  /** Hints opened per bug index. More than the bug's hint count means the answer was shown. */
  hints: Record<number, number>;
  /** Saw the answer before solving, so the level does not count. */
  revealed: boolean;
  started: boolean;
  /** Time spent so far, in milliseconds. */
  elapsed?: number;
  layout?: { panes: PaneLayout[] };
}

export interface Filter {
  diff: 'all' | 'easy' | 'medium' | 'hard';
  status: 'all' | 'unsolved' | 'solved';
  q: string;
}

export interface AppState {
  levels: Record<string, LevelProgress>;
  interview: boolean;
  filter?: Filter;
  hideFiles?: boolean;
  hidePanel?: boolean;
  consoleOpen?: boolean;
  consoleH?: number;
  consoleQ?: string;
}

export const emptyProgress = (): LevelProgress => ({
  edits: {},
  notes: '',
  solved: false,
  best: null,
  hints: {},
  revealed: false,
  started: false,
});

function read(): AppState {
  let s: Partial<AppState> = {};
  try {
    s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {};
  } catch {
    s = {};
  }
  const levels: Record<string, LevelProgress> = {};
  for (const [id, l] of Object.entries(s.levels || {})) levels[id] = { ...emptyProgress(), ...l };
  return { ...s, levels, interview: !!s.interview };
}

let state: AppState = typeof localStorage === 'undefined' ? { levels: {}, interview: false } : read();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

/** Writes to localStorage now. Runs on a short delay after each change, and before the page closes. */
export function flush() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage is off or full */
  }
}

if (typeof window !== 'undefined') {
  // Save only if a change is still waiting. Saving unchanged state would
  // overwrite progress made in another tab.
  window.addEventListener('beforeunload', () => {
    if (saveTimer !== undefined) flush();
  });
  // Another tab saved: load its progress, unless this tab has its own unsaved change.
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || saveTimer !== undefined) return;
    state = read();
    listeners.forEach((l) => l());
  });
}

export const getState = () => state;

/** Replaces top-level fields. */
export function update(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  listeners.forEach((l) => l());
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 300);
}

export const levelProgress = (id: string): LevelProgress => state.levels[id] ?? emptyProgress();

/** Changes one level's progress. */
export function updateLevel(
  id: string,
  patch: Partial<LevelProgress> | ((p: LevelProgress) => Partial<LevelProgress>),
) {
  update((s) => {
    const cur = s.levels[id] ?? emptyProgress();
    const p = typeof patch === 'function' ? patch(cur) : patch;
    return { levels: { ...s.levels, [id]: { ...cur, ...p } } };
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Reads part of the state in a component. The selector must return a stable value (no new objects). */
export function useStore<T>(select: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

const EMPTY = emptyProgress();
/** One level's progress, in a component. */
export const useLevelProgress = (id: string) => useStore((s) => s.levels[id] ?? EMPTY);
