/** A level's files, keyed by path (e.g. `src/app.js`). */
export type Files = Record<string, string>;

export type LogType = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  type: LogType;
  text: string;
  /** `file:line` of the console call. */
  where: string | null;
  /** `file:line` where an Error argument was created. */
  thrownAt?: string | null;
}

export interface TestResult {
  name: string;
  pass: boolean;
  error?: string;
  logs: LogEntry[];
  ms?: number;
}

/** Any function written by the user. We only know it is callable. */
export type AnyFn = (...args: unknown[]) => unknown;

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Deep copy through JSON, like a value going over the wire or into a database. */
export const clone = <T>(x: T): T => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
