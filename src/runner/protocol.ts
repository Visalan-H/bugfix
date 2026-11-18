import type { Files, TestResult } from './sandbox/types';

/** Page → worker: run the tests in `path`, starting at test `startAt`. */
export interface WorkerIn {
  files: Files;
  path: string;
  startAt: number;
}

/** Worker → page. */
export type WorkerOut =
  | { type: 'alive' }
  | { type: 'list'; names: string[] }
  | { type: 'start'; name: string; index: number }
  | { type: 'result'; result: TestResult }
  | { type: 'done' }
  | { type: 'crash'; error: string };
