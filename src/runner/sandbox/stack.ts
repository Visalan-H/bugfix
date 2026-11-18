// Turning stack traces into `file:line` that match what the user sees in the editor.

/**
 * `new Function` adds a few lines above the user's code. Measure how many once,
 * so line numbers in stack traces match the editor. (Differs per JS engine.)
 */
export const WRAP_OFFSET: number = (() => {
  try {
    new Function('a', '\nthrow new Error("x")\n//# sourceURL=__probe__.js')();
  } catch (e) {
    const m = /__probe__\.js:(\d+)/.exec((e as Error).stack || '');
    if (m) return Number(m[1]) - 2;
  }
  return 2;
})();

// A user file in a stack frame. The path must start a token, so a bundled
// `http://host/src/...` frame of our own code never matches.
const FRAME = /(?:^|[\s(@])((?:src|tests)\/[\w./-]+\.js):(\d+):(\d+)/;

/** First user `file:line` in a stack, with the wrapper offset removed. */
export function whereFrom(stack: unknown, skip: number): string | null {
  const lines = String(stack || '')
    .split('\n')
    .slice(skip);
  for (const l of lines) {
    const m = FRAME.exec(l);
    if (m) return `${m[1]}:${Number(m[2]) - WRAP_OFFSET}`;
  }
  return null;
}

/** `Name: message` plus up to five user frames. */
export function cleanStack(e: unknown): string {
  const err = (e ?? {}) as { name?: string; message?: string; stack?: string };
  const lines = String(err.stack || '').split('\n');
  const out = [err.name && err.message ? `${err.name}: ${err.message}` : String(err.message || e)];
  for (const l of lines) {
    const m = FRAME.exec(l);
    if (m) out.push(`    at ${m[1]}:${Number(m[2]) - WRAP_OFFSET}`);
  }
  return out.slice(0, 6).join('\n');
}

/** How console.log shows a value: strings as-is, Errors as `Name: message`, the rest as JSON. */
export function fmtLog(x: unknown): string {
  if (typeof x === 'string') return x;
  if (x instanceof Error) return `${x.name || 'Error'}: ${x.message}`;
  if (x === undefined) return 'undefined';
  if (typeof x === 'function') return `[Function ${x.name || 'anonymous'}]`;
  if (x instanceof Promise) return 'Promise { <pending> }  ← did you forget await?';
  try {
    const s = JSON.stringify(x, null, typeof x === 'object' && x && JSON.stringify(x).length > 80 ? 2 : 0);
    return s === undefined ? String(x) : s;
  } catch {
    return String(x);
  }
}
