/// <reference lib="webworker" />
import { runTests } from './sandbox';
import type { WorkerIn, WorkerOut } from './protocol';

// Runs one test file in a Web Worker. Sends a heartbeat so the page can tell
// a slow test from an infinite loop (a loop stops the heartbeat too).

const post = (m: WorkerOut) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m);

setInterval(() => post({ type: 'alive' }), 200);

self.onmessage = async (e: MessageEvent<WorkerIn>) => {
  const { files, path, startAt } = e.data;
  try {
    await runTests(files, path, {
      startAt,
      onList: (names) => post({ type: 'list', names }),
      onStart: (name, index) => post({ type: 'start', name, index }),
      onResult: (result) => post({ type: 'result', result }),
    });
    post({ type: 'done' });
  } catch (err) {
    post({ type: 'crash', error: String((err as Error)?.stack || err) });
  }
};
