// Jest-style `expect` with the matchers the levels use.

function fmt(v: unknown): string {
  if (typeof v === 'string') return JSON.stringify(v);
  if (v instanceof Promise) return 'Promise {<pending>}';
  try {
    const s = JSON.stringify(v);
    return s === undefined ? String(v) : s.length > 160 ? s.slice(0, 160) + '…' : s;
  } catch {
    return String(v);
  }
}

type Obj = Record<string, unknown>;

function deepEq(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const A = a as Obj;
  const B = b as Obj;
  const ka = Object.keys(A).filter((k) => A[k] !== undefined);
  const kb = Object.keys(B).filter((k) => B[k] !== undefined);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEq(A[k], B[k]));
}

function matchObj(a: unknown, b: unknown): boolean {
  if (typeof b !== 'object' || b === null) return Object.is(a, b);
  if (typeof a !== 'object' || a === null) return false;
  if (Array.isArray(b)) return Array.isArray(a) && a.length === b.length && b.every((x, i) => matchObj(a[i], x));
  return Object.keys(b).every((k) => matchObj((a as Obj)[k], (b as Obj)[k]));
}

export class AssertionError extends Error {
  constructor(m: string) {
    super(m);
    this.name = 'AssertionError';
  }
}

export function expect(actual: unknown) {
  // Loose view of `actual` for the numeric and length matchers. Bad types just fail the check.
  const v = actual as never;
  const len = actual as { length?: number } | null | undefined;
  const mk = (neg: boolean) => {
    const a = (pass: unknown, msg: () => string) => {
      if (!!pass === neg) throw new AssertionError((neg ? 'Expected NOT: ' : '') + msg());
    };
    return {
      toBe: (e: unknown) => a(Object.is(actual, e), () => `expected ${fmt(actual)} to be ${fmt(e)}`),
      toEqual: (e: unknown) => a(deepEq(actual, e), () => `expected ${fmt(actual)}\n   to equal ${fmt(e)}`),
      toMatchObject: (e: unknown) => a(matchObj(actual, e), () => `expected ${fmt(actual)}\n   to match ${fmt(e)}`),
      toHaveLength: (n: number) =>
        a(
          len != null && len.length === n,
          () => `expected length ${n}, got ${len == null ? fmt(actual) : len.length}  (value: ${fmt(actual)})`,
        ),
      toContain: (x: unknown) =>
        a(
          actual != null &&
            (typeof actual === 'string'
              ? actual.includes(x as string)
              : Array.from(actual as ArrayLike<unknown>).some((y) => deepEq(y, x))),
          () => `expected ${fmt(actual)} to contain ${fmt(x)}`,
        ),
      toBeGreaterThan: (n: number) => a(v > n, () => `expected ${fmt(actual)} > ${n}`),
      toBeGreaterThanOrEqual: (n: number) => a(v >= n, () => `expected ${fmt(actual)} >= ${n}`),
      toBeLessThan: (n: number) => a(v < n, () => `expected ${fmt(actual)} < ${n}`),
      toBeLessThanOrEqual: (n: number) => a(v <= n, () => `expected ${fmt(actual)} <= ${n}`),
      toBeCloseTo: (n: number, d = 2) =>
        a(Math.abs(v - n) < Math.pow(10, -d) / 2, () => `expected ${fmt(actual)} to be close to ${n}`),
      toBeTruthy: () => a(!!actual, () => `expected ${fmt(actual)} to be truthy`),
      toBeFalsy: () => a(!actual, () => `expected ${fmt(actual)} to be falsy`),
      toBeNull: () => a(actual === null, () => `expected ${fmt(actual)} to be null`),
      toBeUndefined: () => a(actual === undefined, () => `expected ${fmt(actual)} to be undefined`),
      toBeDefined: () => a(actual !== undefined, () => `expected value to be defined, got undefined`),
    };
  };
  return Object.assign(mk(false), { not: mk(true) });
}
