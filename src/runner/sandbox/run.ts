import { makeCtx } from './context';
import { AssertionError } from './expect';
import { makeRegistry } from './loader';
import { cleanStack } from './stack';
import type { Files, TestResult } from './types';

const TEST_TIMEOUT_MS = 5000;

/**
 * Runs test number `index` of `testPath`. Every test gets a fresh module registry
 * (fresh database, fresh module state), so tests can't leak into each other.
 */
async function runOne(files: Files, testPath: string, index: number): Promise<TestResult> {
  const ctx = makeCtx();
  const reg = makeRegistry(files, ctx);
  const t0 = Date.now();
  try {
    reg.load(testPath);
  } catch (e) {
    return { name: '(failed to load)', pass: false, error: cleanStack(e), logs: ctx.logs, ms: 0 };
  }
  const t = ctx.tests[index];
  const hooks = ctx.hooks.filter((h) => h.scope.every((s, i) => t.scope[i] === s));
  let to: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      (async () => {
        for (const h of hooks) await h.fn();
        await t.fn();
      })(),
      new Promise((_, rej) => {
        to = setTimeout(() => rej(new Error(`Test timed out after ${TEST_TIMEOUT_MS}ms`)), TEST_TIMEOUT_MS);
      }),
    ]);
    clearTimeout(to);
    if (ctx.runtimeErrors.length) throw ctx.runtimeErrors[0];
    return { name: t.name, pass: true, logs: ctx.logs, ms: Date.now() - t0 };
  } catch (e) {
    clearTimeout(to);
    const msg = e instanceof AssertionError ? e.message : cleanStack(e);
    return { name: t.name, pass: false, error: msg, logs: ctx.logs, ms: Date.now() - t0 };
  }
}

/** Loads a test file once just to list its tests. */
export function listTests(files: Files, testPath: string): { names: string[]; error?: string } {
  const ctx = makeCtx();
  try {
    makeRegistry(files, ctx).load(testPath);
  } catch (e) {
    return { names: [], error: cleanStack(e) };
  }
  return { names: ctx.tests.map((t) => t.name) };
}

export interface RunHooks {
  /** Skip the tests before this index. Lets the runner carry on after a test that hung. */
  startAt?: number;
  /** Called once with every test name in the file, before any test runs. */
  onList?: (names: string[]) => void;
  /** Called just before each test starts. */
  onStart?: (name: string, index: number) => void;
  /** Called as soon as each test finishes. */
  onResult?: (r: TestResult) => void;
}

/** Runs every test in `testPath`, one by one. */
export async function runTests(files: Files, testPath: string, hooks: RunHooks = {}): Promise<TestResult[]> {
  const { names, error } = listTests(files, testPath);
  const results: TestResult[] = [];
  if (error) {
    const r: TestResult = { name: `${testPath} failed to load`, pass: false, error, logs: [] };
    results.push(r);
    hooks.onResult?.(r);
    return results;
  }
  hooks.onList?.(names);
  for (let i = hooks.startAt ?? 0; i < names.length; i++) {
    hooks.onStart?.(names[i], i);
    const r = await runOne(files, testPath, i);
    results.push(r);
    hooks.onResult?.(r);
  }
  return results;
}
