import { expect } from './expect';
import type { AnyFn, LogEntry } from './types';

// Collects the tests, hooks and logs of one test file while it loads and runs.

interface TestCase {
  name: string;
  scope: string[];
  fn: AnyFn;
}

interface Hook {
  scope: string[];
  fn: AnyFn;
}

export interface RunCtx {
  tests: TestCase[];
  hooks: Hook[];
  logs: LogEntry[];
  runtimeErrors: Error[];
  stack: string[];
  globals: {
    describe(name: string, fn: () => void): void;
    it(name: string, fn: AnyFn): void;
    beforeEach(fn: AnyFn): void;
    expect: typeof expect;
  };
}

export function makeCtx(): RunCtx {
  const ctx: RunCtx = {
    tests: [],
    hooks: [],
    logs: [],
    runtimeErrors: [],
    stack: [],
    globals: {
      describe(name, fn) {
        ctx.stack.push(name);
        try {
          fn();
        } finally {
          ctx.stack.pop();
        }
      },
      it(name, fn) {
        ctx.tests.push({ name: [...ctx.stack, name].join(' › '), scope: [...ctx.stack], fn });
      },
      beforeEach(fn) {
        ctx.hooks.push({ scope: [...ctx.stack], fn });
      },
      expect,
    },
  };
  return ctx;
}
