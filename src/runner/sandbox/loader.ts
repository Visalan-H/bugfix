import { createExpress } from './express';
import { createMemDb } from './memdb';
import { fmtLog, whereFrom } from './stack';
import { makeSupertest } from './supertest';
import type { RunCtx } from './context';
import type { Files, LogType } from './types';

// CommonJS `require` over the in-memory files. Built-in packages: express, supertest, memdb.
// Each registry has its own module cache and its own database.

export const BUILTINS = ['express', 'supertest', 'memdb'];

interface Module {
  exports: unknown;
}

export function makeRegistry(files: Files, ctx: RunCtx) {
  const cache: Record<string, Module> = {};
  const builtins: Record<string, unknown> = {
    express: createExpress(),
    supertest: makeSupertest(ctx),
    memdb: createMemDb(),
  };
  const consoleShim: Record<string, (...args: unknown[]) => void> = {};
  for (const t of ['log', 'info', 'warn', 'error', 'debug'] as LogType[]) {
    consoleShim[t] = (...args) => {
      const err = args.find((x) => x instanceof Error) as Error | undefined;
      ctx.logs.push({
        type: t,
        text: args.map(fmtLog).join(' '),
        where: whereFrom(new Error().stack, 1),
        thrownAt: err ? whereFrom(err.stack, 0) : null,
      });
    };
  }
  const g = ctx.globals;

  function resolve(from: string, spec: string): string {
    if (!spec.startsWith('.')) return 'builtin:' + spec;
    const parts = from.split('/');
    parts.pop();
    for (const seg of spec.split('/')) {
      if (seg === '.' || seg === '') continue;
      if (seg === '..') parts.pop();
      else parts.push(seg);
    }
    const p = parts.join('/');
    for (const c of [p, p + '.js', p + '/index.js']) if (files[c] !== undefined) return c;
    throw new Error(`Cannot find module '${spec}' from '${from}'`);
  }

  function load(path: string): unknown {
    if (path.startsWith('builtin:')) {
      const n = path.slice(8);
      if (!(n in builtins)) throw new Error(`Cannot find module '${n}' (available packages: ${BUILTINS.join(', ')})`);
      return builtins[n];
    }
    if (cache[path]) return cache[path].exports;
    const module: Module = { exports: {} };
    cache[path] = module;
    let fn: (...args: unknown[]) => void;
    try {
      fn = new Function(
        'require',
        'module',
        'exports',
        '__filename',
        'console',
        'describe',
        'it',
        'test',
        'expect',
        'beforeEach',
        files[path] + '\n//# sourceURL=' + path,
      ) as typeof fn;
    } catch (e) {
      const err = new SyntaxError(`${(e as Error).message}  (in ${path})`);
      err.stack = err.message;
      delete cache[path];
      throw err;
    }
    fn(
      (spec: string) => load(resolve(path, spec)),
      module,
      module.exports,
      path,
      consoleShim,
      g.describe,
      g.it,
      g.it,
      g.expect,
      g.beforeEach,
    );
    return module.exports;
  }
  return { load };
}
