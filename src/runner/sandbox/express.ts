import { clone, type AnyFn } from './types';

// A small Express: routers, params, prefix mounts, error middleware (4 args),
// and Express 5 style catching of errors thrown by async handlers.

export const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

export interface Req {
  method: string;
  path: string;
  url: string;
  originalUrl: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: unknown;
  params: Record<string, string>;
  get(h: string): string | undefined;
  header(h: string): string | undefined;
  [extra: string]: unknown;
}

export interface Res {
  statusCode: number;
  headersSent: boolean;
  body?: unknown;
  firstDouble?: Error & { code?: string };
  _headers: Record<string, string>;
  status(c: number): Res;
  set(k: string, v: string): Res;
  json(b?: unknown): Res;
  send(b?: unknown): Res;
  redirect(a: number | string, b?: string): Res;
  sendStatus(c: number): Res;
  end(): Res;
  [extra: string]: unknown;
}

type Next = (err?: unknown) => Promise<void>;
type Done = (err?: unknown) => Promise<void> | void;

interface Layer {
  method?: string;
  path?: string;
  prefix?: string;
  handlers: AnyFn[];
}

export interface Router {
  (req: Req, res: Res, next: Done): Promise<void>;
  stack: Layer[];
  use(a: string | AnyFn, ...rest: AnyFn[]): Router;
  get(path: string, ...h: AnyFn[]): Router;
  post(path: string, ...h: AnyFn[]): Router;
  put(path: string, ...h: AnyFn[]): Router;
  patch(path: string, ...h: AnyFn[]): Router;
  delete(path: string, ...h: AnyFn[]): Router;
}

function matchPath(pattern: string, path: string): Record<string, string> | null {
  const pp = pattern.split('/').filter(Boolean);
  const sp = path.split('/').filter(Boolean);
  if (pp.length !== sp.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i][0] === ':') params[pp[i].slice(1)] = decodeURIComponent(sp[i]);
    else if (pp[i] !== sp[i]) return null;
  }
  return params;
}

export async function dispatch(stack: Layer[], req: Req, res: Res, done: Done): Promise<void> {
  let i = 0;
  async function runHandlers(hs: AnyFn[], err: unknown, after: Done): Promise<void> {
    let j = 0;
    async function step(e: unknown): Promise<void> {
      if (j >= hs.length) return after(e);
      const h = hs[j++];
      let nextP: Promise<void> | null = null;
      const nxt = (x?: unknown) => (nextP = step(x));
      try {
        if (e) {
          if (h.length === 4) await h(e, req, res, nxt);
          else await nxt(e);
        } else if (h.length === 4) await nxt();
        else await h(req, res, nxt);
        if (nextP) await nextP;
      } catch (ex) {
        if (nextP) {
          await nextP;
          return;
        }
        await step(ex);
      }
    }
    return step(err);
  }
  const next: Next = async (err) => {
    if (i >= stack.length) return done(err);
    const layer = stack[i++];
    if (layer.method) {
      if (layer.method !== req.method) return next(err);
      const params = matchPath(layer.path!, req.path);
      if (!params) return next(err);
      req.params = Object.assign({}, params);
      return runHandlers(layer.handlers, err, next);
    }
    if (layer.prefix && !(req.path === layer.prefix || req.path.startsWith(layer.prefix + '/'))) return next(err);
    const saved = req.path;
    if (layer.prefix) req.path = req.path.slice(layer.prefix.length) || '/';
    return runHandlers(layer.handlers, err, (e) => {
      req.path = saved;
      return next(e);
    });
  };
  return next();
}

function makeRouter(): Router {
  const stack: Layer[] = [];
  const r = function router(req: Req, res: Res, next: Done) {
    return dispatch(stack, req, res, next);
  } as Router;
  r.stack = stack;
  r.use = (a, ...rest) => {
    if (typeof a === 'string') stack.push({ prefix: a.replace(/\/$/, ''), handlers: rest });
    else stack.push({ prefix: '', handlers: [a, ...rest] });
    return r;
  };
  for (const m of METHODS) {
    r[m] = (path: string, ...handlers: AnyFn[]) => {
      handlers.forEach((h) => {
        if (typeof h !== 'function')
          throw new TypeError(
            `Route.${m}() requires a callback function but got a [object ${h === undefined ? 'Undefined' : typeof h}]`,
          );
      });
      stack.push({ method: m.toUpperCase(), path, handlers });
      return r;
    };
  }
  return r;
}

export interface Express {
  (): Router;
  Router(): Router;
  json(): AnyFn;
}

export function createExpress(): Express {
  const express = (() => makeRouter()) as Express;
  express.Router = () => makeRouter();
  express.json = () =>
    function jsonParser(_req: unknown, _res: unknown, next: unknown) {
      (next as () => void)();
    };
  return express;
}

export function makeRes(onSend: () => void): Res {
  const res: Res = {
    statusCode: 200,
    headersSent: false,
    _headers: {},
    status(c) {
      if (!this.headersSent) this.statusCode = c;
      return this;
    },
    set(k, v) {
      this._headers[String(k).toLowerCase()] = v;
      return this;
    },
    json(b) {
      if (this.headersSent) {
        const e: Error & { code?: string } = new Error(
          'ERR_HTTP_HEADERS_SENT: Cannot set headers after they are sent to the client',
        );
        e.code = 'ERR_HTTP_HEADERS_SENT';
        if (!this.firstDouble) this.firstDouble = e;
        throw e;
      }
      this.headersSent = true;
      this.body = b === undefined ? undefined : clone(b);
      onSend();
      return this;
    },
    send(b) {
      return this.json(b);
    },
    redirect(a, b) {
      const code = b === undefined ? 302 : (a as number);
      const url = b === undefined ? (a as string) : b;
      if (!this.headersSent) {
        this.statusCode = code;
        this._headers.location = url;
      }
      return this.json(undefined);
    },
    sendStatus(c) {
      this.statusCode = c;
      return this.json(undefined);
    },
    end() {
      return this.json(undefined);
    },
  };
  return res;
}
