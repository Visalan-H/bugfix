(function (root) {
  'use strict';

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const READ_MS = 1;
  const WRITE_MS = 15;

  // ---------------- memdb (Mongoose-like, async, returns copies) ----------------
  function createMemDb() {
    const cols = {};
    let idc = 1000;

    function matches(doc, filter) {
      for (const k in filter) {
        const cond = filter[k];
        if (cond === undefined) continue; // like Mongoose: undefined keys are stripped
        const v = doc[k];
        if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
          for (const op in cond) {
            const c = cond[op];
            if (op === '$gte' && !(v >= c)) return false;
            if (op === '$gt' && !(v > c)) return false;
            if (op === '$lte' && !(v <= c)) return false;
            if (op === '$lt' && !(v < c)) return false;
            if (op === '$ne' && v === c) return false;
            if (op === '$in' && !c.includes(v)) return false;
            if (op === '$regex') {
              const re = c instanceof RegExp ? c : new RegExp(c, cond.$options || '');
              if (typeof v !== 'string' || !re.test(v)) return false;
            }
          }
        } else if (v !== cond) return false;
      }
      return true;
    }

    function collection(name) {
      if (cols[name]) return cols[name];
      const rows = [];
      const api = {
        async find(filter = {}) { await sleep(READ_MS); return rows.filter((d) => matches(d, filter)).map(clone); },
        async findOne(filter = {}) { await sleep(READ_MS); const d = rows.find((x) => matches(x, filter)); return d ? clone(d) : null; },
        async findById(id) { await sleep(READ_MS); const d = rows.find((x) => x._id === String(id)); return d ? clone(d) : null; },
        async insert(doc) {
          await sleep(WRITE_MS);
          const d = Object.assign(clone(doc), { _id: doc._id != null ? String(doc._id) : String(++idc) });
          rows.push(d);
          return clone(d);
        },
        async updateById(id, patch) {
          await sleep(WRITE_MS);
          const d = rows.find((x) => x._id === String(id));
          if (!d) return null;
          Object.assign(d, clone(patch));
          return clone(d);
        },
        async findOneAndUpdate(filter, update) {
          await sleep(WRITE_MS);
          const d = rows.find((x) => matches(x, filter));
          if (!d) return null;
          if (update.$inc) for (const k in update.$inc) d[k] = (d[k] || 0) + update.$inc[k];
          if (update.$set) Object.assign(d, clone(update.$set));
          if (update.$push) for (const k in update.$push) (d[k] = d[k] || []).push(clone(update.$push[k]));
          return clone(d);
        },
        async deleteById(id) {
          await sleep(WRITE_MS);
          const i = rows.findIndex((x) => x._id === String(id));
          if (i < 0) return false;
          rows.splice(i, 1);
          return true;
        },
        async count(filter = {}) { await sleep(READ_MS); return rows.filter((d) => matches(d, filter)).length; },
      };
      cols[name] = api;
      return api;
    }
    return { collection };
  }

  // ---------------- mini express ----------------
  const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

  function matchPath(pattern, path) {
    const pp = pattern.split('/').filter(Boolean);
    const sp = path.split('/').filter(Boolean);
    if (pp.length !== sp.length) return null;
    const params = {};
    for (let i = 0; i < pp.length; i++) {
      if (pp[i][0] === ':') params[pp[i].slice(1)] = decodeURIComponent(sp[i]);
      else if (pp[i] !== sp[i]) return null;
    }
    return params;
  }

  async function dispatch(stack, req, res, done) {
    let i = 0;
    async function runHandlers(hs, err, after) {
      let j = 0;
      async function step(e) {
        if (j >= hs.length) return after(e);
        const h = hs[j++];
        let nextP = null;
        const nxt = (x) => (nextP = step(x));
        try {
          if (e) {
            if (h.length === 4) await h(e, req, res, nxt);
            else await nxt(e);
          } else if (h.length === 4) await nxt();
          else await h(req, res, nxt);
          if (nextP) await nextP;
        } catch (ex) {
          if (nextP) { await nextP; return; }
          await step(ex);
        }
      }
      return step(err);
    }
    async function next(err) {
      if (i >= stack.length) return done(err);
      const layer = stack[i++];
      if (layer.method) {
        if (layer.method !== req.method) return next(err);
        const params = matchPath(layer.path, req.path);
        if (!params) return next(err);
        req.params = Object.assign({}, params);
        return runHandlers(layer.handlers, err, next);
      }
      if (layer.prefix && !(req.path === layer.prefix || req.path.startsWith(layer.prefix + '/'))) return next(err);
      const saved = req.path;
      if (layer.prefix) req.path = req.path.slice(layer.prefix.length) || '/';
      return runHandlers(layer.handlers, err, (e) => { req.path = saved; return next(e); });
    }
    return next();
  }

  function makeRouter() {
    const stack = [];
    const r = function router(req, res, next) { return dispatch(stack, req, res, next); };
    r.stack = stack;
    r.use = (a, ...rest) => {
      if (typeof a === 'string') stack.push({ prefix: a.replace(/\/$/, ''), handlers: rest });
      else stack.push({ prefix: '', handlers: [a, ...rest] });
      return r;
    };
    METHODS.forEach((m) => {
      r[m] = (path, ...handlers) => {
        handlers.forEach((h) => { if (typeof h !== 'function') throw new TypeError(`Route.${m}() requires a callback function but got a [object ${h === undefined ? 'Undefined' : typeof h}]`); });
        stack.push({ method: m.toUpperCase(), path, handlers });
        return r;
      };
    });
    return r;
  }

  function createExpress() {
    const express = () => makeRouter();
    express.Router = () => makeRouter();
    express.json = () => function jsonParser(req, res, next) { next(); };
    return express;
  }

  function makeRes(onSend) {
    const res = {
      statusCode: 200,
      headersSent: false,
      _headers: {},
      status(c) { if (!this.headersSent) this.statusCode = c; return this; },
      set(k, v) { this._headers[String(k).toLowerCase()] = v; return this; },
      json(b) {
        if (this.headersSent) {
          const e = new Error('ERR_HTTP_HEADERS_SENT: Cannot set headers after they are sent to the client');
          e.code = 'ERR_HTTP_HEADERS_SENT';
          if (!this.firstDouble) this.firstDouble = e;
          throw e;
        }
        this.headersSent = true;
        this.body = b === undefined ? undefined : clone(b);
        onSend();
        return this;
      },
      send(b) { return this.json(b); },
      redirect(a, b) {
        const code = b === undefined ? 302 : a;
        const url = b === undefined ? a : b;
        if (!this.headersSent) { this.statusCode = code; this._headers.location = url; }
        return this.json(undefined);
      },
      sendStatus(c) { this.statusCode = c; return this.json(undefined); },
      end() { return this.json(undefined); },
    };
    return res;
  }

  function makeSupertest(ctx) {
    return function request(app) {
      const mk = (method) => (url) => {
        const st = { method, url, headers: {}, body: undefined };
        let p = null;
        const chain = {
          set(k, v) { st.headers[String(k).toLowerCase()] = String(v); return chain; },
          send(b) { st.body = b; return chain; },
          then(a, b) { if (!p) p = perform(app, st, ctx); return p.then(a, b); },
        };
        return chain;
      };
      const o = {};
      METHODS.forEach((m) => { o[m] = mk(m.toUpperCase()); });
      return o;
    };
  }

  async function perform(app, st, ctx) {
    if (!app || !app.stack) throw new Error('request(app): app is not an express app (did src/app.js export it?)');
    const [path, qs] = st.url.split('?');
    const query = {};
    new URLSearchParams(qs || '').forEach((v, k) => { query[k] = v; });
    const req = {
      method: st.method, path, url: st.url, originalUrl: st.url, query,
      headers: Object.assign({}, st.headers),
      body: st.body === undefined ? {} : clone(st.body),
      params: {},
      get(h) { return this.headers[String(h).toLowerCase()]; },
      header(h) { return this.get(h); },
    };
    const res = makeRes(() => {});
    let lateError = null;
    const chain = dispatch(app.stack, req, res, async (err) => {
      if (err) {
        if (!res.headersSent) {
          res.statusCode = err.status || err.statusCode || 500;
          res.json({ error: err.message });
          ctx.logs.push({ type: 'error', text: `[express] unhandled error → ${res.statusCode}: ${err.stack ? cleanStack(err) : err.message}`, where: whereFrom(err.stack, 0) });
        } else lateError = err;
      } else if (!res.headersSent) {
        res.statusCode = 404;
        res.json({ error: `Cannot ${req.method} ${path}` });
      }
    });
    let to;
    const timeout = new Promise((r) => { to = setTimeout(() => r('timeout'), 2500); });
    const outcome = await Promise.race([chain.then(() => 'done'), timeout]);
    clearTimeout(to);
    if (outcome === 'timeout' && !res.headersSent) {
      throw new Error(`${st.method} ${st.url} timed out: the handler never sent a response`);
    }
    if (res.firstDouble) lateError = res.firstDouble;
    if (lateError) {
      const e = new Error((lateError.code === 'ERR_HTTP_HEADERS_SENT' ? '' : 'Error thrown AFTER the response was already sent → ') + lateError.message + `\n   (during ${st.method} ${st.url})`);
      e.stack = lateError.stack;
      e.fromHandler = true;
      ctx.runtimeErrors.push(e);
    }
    return { status: res.statusCode, body: res.body, headers: res._headers };
  }

  // ---------------- expect ----------------
  function fmt(v) {
    if (typeof v === 'string') return JSON.stringify(v);
    if (v instanceof Promise) return 'Promise {<pending>}';
    try { const s = JSON.stringify(v); return s === undefined ? String(v) : (s.length > 160 ? s.slice(0, 160) + '…' : s); } catch (e) { return String(v); }
  }
  function deepEq(a, b) {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a).filter((k) => a[k] !== undefined), kb = Object.keys(b).filter((k) => b[k] !== undefined);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => deepEq(a[k], b[k]));
  }
  function matchObj(a, b) {
    if (typeof b !== 'object' || b === null) return Object.is(a, b);
    if (typeof a !== 'object' || a === null) return false;
    if (Array.isArray(b)) return Array.isArray(a) && a.length === b.length && b.every((x, i) => matchObj(a[i], x));
    return Object.keys(b).every((k) => matchObj(a[k], b[k]));
  }
  class AssertionError extends Error { constructor(m) { super(m); this.name = 'AssertionError'; } }
  function expect(actual) {
    const mk = (neg) => {
      const a = (pass, msg) => { if (!!pass === neg) throw new AssertionError((neg ? 'Expected NOT: ' : '') + msg()); };
      return {
        toBe: (e) => a(Object.is(actual, e), () => `expected ${fmt(actual)} to be ${fmt(e)}`),
        toEqual: (e) => a(deepEq(actual, e), () => `expected ${fmt(actual)}\n   to equal ${fmt(e)}`),
        toMatchObject: (e) => a(matchObj(actual, e), () => `expected ${fmt(actual)}\n   to match ${fmt(e)}`),
        toHaveLength: (n) => a(actual != null && actual.length === n, () => `expected length ${n}, got ${actual == null ? fmt(actual) : actual.length}  (value: ${fmt(actual)})`),
        toContain: (x) => a(actual != null && (typeof actual === 'string' ? actual.includes(x) : Array.from(actual).some((v) => deepEq(v, x))), () => `expected ${fmt(actual)} to contain ${fmt(x)}`),
        toBeGreaterThan: (n) => a(actual > n, () => `expected ${fmt(actual)} > ${n}`),
        toBeGreaterThanOrEqual: (n) => a(actual >= n, () => `expected ${fmt(actual)} >= ${n}`),
        toBeLessThan: (n) => a(actual < n, () => `expected ${fmt(actual)} < ${n}`),
        toBeLessThanOrEqual: (n) => a(actual <= n, () => `expected ${fmt(actual)} <= ${n}`),
        toBeCloseTo: (n, d = 2) => a(Math.abs(actual - n) < Math.pow(10, -d) / 2, () => `expected ${fmt(actual)} to be close to ${n}`),
        toBeTruthy: () => a(!!actual, () => `expected ${fmt(actual)} to be truthy`),
        toBeFalsy: () => a(!actual, () => `expected ${fmt(actual)} to be falsy`),
        toBeNull: () => a(actual === null, () => `expected ${fmt(actual)} to be null`),
        toBeUndefined: () => a(actual === undefined, () => `expected ${fmt(actual)} to be undefined`),
        toBeDefined: () => a(actual !== undefined, () => `expected value to be defined, got undefined`),
      };
    };
    const o = mk(false);
    o.not = mk(true);
    return o;
  }

  // ---------------- module system ----------------
  const WRAP_OFFSET = (() => {
    try { new Function('a', '\nthrow new Error("x")\n//# sourceURL=__probe__.js')(); } catch (e) {
      const m = /__probe__\.js:(\d+)/.exec(e.stack || '');
      if (m) return Number(m[1]) - 2;
    }
    return 2;
  })();

  // How console.log shows a value: strings as-is, Errors as "Name: message ← thrown at file:line", the rest as JSON.
  function fmtLog(x) {
    if (typeof x === 'string') return x;
    if (x instanceof Error) {
      return `${x.name || 'Error'}: ${x.message}`;
    }
    if (x === undefined) return 'undefined';
    if (typeof x === 'function') return `[Function ${x.name || 'anonymous'}]`;
    if (x instanceof Promise) return 'Promise { <pending> }  ← did you forget await?';
    try { const s = JSON.stringify(x, null, typeof x === 'object' && x && JSON.stringify(x).length > 80 ? 2 : 0); return s === undefined ? String(x) : s; } catch (e) { return String(x); }
  }

  // First "src/x.js:12" frame in a stack, with line numbers fixed for the Function wrapper.
  function whereFrom(stack, skip) {
    const lines = String(stack || '').split('\n').slice(skip);
    for (const l of lines) {
      const m = /((?:src|tests)\/[\w./-]+\.js):(\d+):(\d+)/.exec(l);
      if (m) return `${m[1]}:${Number(m[2]) - WRAP_OFFSET}`;
    }
    return null;
  }

  function cleanStack(e) {
    const lines = String(e.stack || '').split('\n');
    const out = [e.name && e.message ? `${e.name}: ${e.message}` : String(e.message || e)];
    for (const l of lines) {
      const m = /((?:src|tests)\/[\w./-]+\.js):(\d+):(\d+)/.exec(l);
      if (m) out.push(`    at ${m[1]}:${Number(m[2]) - WRAP_OFFSET}`);
    }
    return out.slice(0, 6).join('\n');
  }

  function makeRegistry(files, ctx) {
    const cache = {};
    const db = createMemDb();
    const builtins = { express: createExpress(), supertest: makeSupertest(ctx), memdb: db };
    const consoleShim = {};
    ['log', 'info', 'warn', 'error', 'debug'].forEach((t) => {
      consoleShim[t] = (...args) => {
        const err = args.find((x) => x instanceof Error);
        ctx.logs.push({ type: t, text: args.map(fmtLog).join(' '), where: whereFrom(new Error().stack, 1), thrownAt: err ? whereFrom(err.stack, 0) : null });
      };
    });
    const g = ctx.globals;

    function resolve(from, spec) {
      if (!spec.startsWith('.')) return 'builtin:' + spec;
      const parts = from.split('/');
      parts.pop();
      for (const seg of spec.split('/')) {
        if (seg === '.' || seg === '') continue;
        if (seg === '..') parts.pop(); else parts.push(seg);
      }
      const p = parts.join('/');
      for (const c of [p, p + '.js', p + '/index.js']) if (files[c] !== undefined) return c;
      throw new Error(`Cannot find module '${spec}' from '${from}'`);
    }
    function load(path) {
      if (path.startsWith('builtin:')) {
        const n = path.slice(8);
        if (!(n in builtins)) throw new Error(`Cannot find module '${n}' (available packages: express, supertest, memdb)`);
        return builtins[n];
      }
      if (cache[path]) return cache[path].exports;
      const module = { exports: {} };
      cache[path] = module;
      let fn;
      try {
        fn = new Function('require', 'module', 'exports', '__filename', 'console', 'describe', 'it', 'test', 'expect', 'beforeEach',
          files[path] + '\n//# sourceURL=' + path);
      } catch (e) {
        const err = new SyntaxError(`${e.message}  (in ${path})`);
        err.stack = err.message;
        delete cache[path];
        throw err;
      }
      fn((spec) => load(resolve(path, spec)), module, module.exports, path, consoleShim, g.describe, g.it, g.it, g.expect, g.beforeEach);
      return module.exports;
    }
    return { load };
  }

  function makeCtx() {
    const ctx = { tests: [], hooks: [], logs: [], runtimeErrors: [], stack: [] };
    ctx.globals = {
      describe(name, fn) { ctx.stack.push(name); try { fn(); } finally { ctx.stack.pop(); } },
      it(name, fn) { ctx.tests.push({ name: [...ctx.stack, name].join(' › '), scope: [...ctx.stack], fn }); },
      beforeEach(fn) { ctx.hooks.push({ scope: [...ctx.stack], fn }); },
      expect,
    };
    return ctx;
  }

  async function runOne(files, testPath, index) {
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
    let to;
    try {
      await Promise.race([
        (async () => { for (const h of hooks) await h.fn(); await t.fn(); })(),
        new Promise((_, rej) => { to = setTimeout(() => rej(new Error('Test timed out after 5000ms')), 5000); }),
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

  async function countTests(files, testPath) {
    const ctx = makeCtx();
    try { makeRegistry(files, ctx).load(testPath); } catch (e) { return { count: 0, error: cleanStack(e) }; }
    return { count: ctx.tests.length };
  }

  async function runTests(files, testPath, onResult) {
    const { count, error } = await countTests(files, testPath);
    const results = [];
    if (error) {
      const r = { name: `${testPath} failed to load`, pass: false, error, logs: [] };
      results.push(r);
      if (onResult) onResult(r);
      return results;
    }
    for (let i = 0; i < count; i++) {
      const r = await runOne(files, testPath, i);
      results.push(r);
      if (onResult) onResult(r);
    }
    return results;
  }

  const api = { runTests };
  root.BugRuntime = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
