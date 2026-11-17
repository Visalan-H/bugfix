import type { Files, TestResult } from './sandbox/types';
import type { WorkerIn, WorkerOut } from './protocol';

// Runs test files in a Web Worker, off the page's main thread.
// If the worker goes quiet (an infinite loop blocks it), it is killed, the
// test that hung is marked failed, and a fresh worker carries on with the rest.

/** No heartbeat for this long means the code is stuck. */
export const HANG_MS = 3000;
/** Hard cap for a whole run. */
export const RUN_LIMIT_MS = 60_000;

export interface TestFileRun {
  path: string;
  group: 'visible' | 'hidden';
}

export interface RunHandle {
  done: Promise<void>;
  cancel(): void;
}

const hangError = (secs: number) =>
  `Your code didn't finish in ${secs} seconds, so it was stopped.\n` +
  'Is there a loop that never ends? (for example a while loop whose condition never becomes false)';

export function runInWorker(
  files: Files,
  plan: TestFileRun[],
  onResult: (group: 'visible' | 'hidden', r: TestResult) => void,
  makeWorker: () => Worker = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
): RunHandle {
  let worker: Worker | null = null;
  let cancelled = false;
  const started = Date.now();

  const kill = () => {
    worker?.terminate();
    worker = null;
  };

  /** Runs one file from `startAt`. Resolves with the index to resume from, or null when the file is finished. */
  const runFile = (step: TestFileRun, startAt: number) =>
    new Promise<number | null>((resolve) => {
      const w = makeWorker();
      worker = w;
      let current = { name: '', index: startAt };
      let names: string[] = [];
      let lastBeat = Date.now();
      const finish = (next: number | null) => {
        clearInterval(watch);
        if (worker === w) kill();
        resolve(next);
      };
      const watch = setInterval(() => {
        if (cancelled) return finish(null);
        const now = Date.now();
        const overLimit = now - started > RUN_LIMIT_MS;
        if (now - lastBeat < HANG_MS && !overLimit) return;
        onResult(step.group, {
          name: current.name || names[current.index] || `${step.path} (test ${current.index + 1})`,
          pass: false,
          error: overLimit
            ? `The whole run took longer than ${RUN_LIMIT_MS / 1000} seconds, so it was stopped.`
            : hangError(HANG_MS / 1000),
          logs: [],
        });
        finish(overLimit || current.index + 1 >= names.length ? null : current.index + 1);
      }, 250);
      w.onmessage = (e: MessageEvent<WorkerOut>) => {
        lastBeat = Date.now();
        const m = e.data;
        if (m.type === 'list') names = m.names;
        else if (m.type === 'start') current = { name: m.name, index: m.index };
        else if (m.type === 'result') {
          current = { name: '', index: current.index + 1 };
          onResult(step.group, m.result);
        } else if (m.type === 'done') finish(null);
        else if (m.type === 'crash') {
          onResult(step.group, { name: 'The test runner crashed', pass: false, error: m.error, logs: [] });
          finish(null);
        }
      };
      w.onerror = (e) => {
        e.preventDefault();
        onResult(step.group, { name: 'The test runner crashed', pass: false, error: e.message, logs: [] });
        finish(null);
      };
      const msg: WorkerIn = { files, path: step.path, startAt };
      w.postMessage(msg);
    });

  const done = (async () => {
    for (const step of plan) {
      let next: number | null = 0;
      while (next !== null && !cancelled) next = await runFile(step, next);
      if (cancelled || Date.now() - started > RUN_LIMIT_MS) break;
    }
    kill();
  })();

  return {
    done,
    cancel() {
      cancelled = true;
      kill();
    },
  };
}
