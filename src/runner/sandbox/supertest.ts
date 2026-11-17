import { dispatch, makeRes, METHODS, type Req, type Router } from './express';
import { cleanStack, whereFrom } from './stack';
import { clone } from './types';
import type { RunCtx } from './context';

// A small supertest: request(app).post(url).set(h, v).send(body) → { status, body, headers }.

interface Pending {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

export interface Response {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

export function makeSupertest(ctx: RunCtx) {
  return function request(app: Router) {
    const mk = (method: string) => (url: string) => {
      const st: Pending = { method, url, headers: {}, body: undefined };
      let p: Promise<Response> | null = null;
      const chain = {
        set(k: string, v: unknown) {
          st.headers[String(k).toLowerCase()] = String(v);
          return chain;
        },
        send(b: unknown) {
          st.body = b;
          return chain;
        },
        then<A, B>(a?: (r: Response) => A, b?: (e: unknown) => B) {
          if (!p) p = perform(app, st, ctx);
          return p.then(a, b);
        },
      };
      return chain;
    };
    const o: Record<string, ReturnType<typeof mk>> = {};
    for (const m of METHODS) o[m] = mk(m.toUpperCase());
    return o;
  };
}

async function perform(app: Router, st: Pending, ctx: RunCtx): Promise<Response> {
  if (!app || !app.stack) throw new Error('request(app): app is not an express app (did src/app.js export it?)');
  const [path, qs] = st.url.split('?');
  const query: Record<string, string> = {};
  new URLSearchParams(qs || '').forEach((v, k) => {
    query[k] = v;
  });
  const req: Req = {
    method: st.method,
    path,
    url: st.url,
    originalUrl: st.url,
    query,
    headers: Object.assign({}, st.headers),
    body: st.body === undefined ? {} : clone(st.body),
    params: {},
    get(h) {
      return this.headers[String(h).toLowerCase()];
    },
    header(h) {
      return this.get(h);
    },
  };
  const res = makeRes(() => {});
  let lateError: (Error & { code?: string }) | null = null;
  const chain = dispatch(app.stack, req, res, async (err) => {
    if (err) {
      const e = err as Error & { status?: number; statusCode?: number };
      if (!res.headersSent) {
        res.statusCode = e.status || e.statusCode || 500;
        res.json({ error: e.message });
        ctx.logs.push({
          type: 'error',
          text: `[express] unhandled error → ${res.statusCode}: ${e.stack ? cleanStack(e) : e.message}`,
          where: whereFrom(e.stack, 0),
        });
      } else lateError = e;
    } else if (!res.headersSent) {
      res.statusCode = 404;
      res.json({ error: `Cannot ${req.method} ${path}` });
    }
  });
  let to: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<'timeout'>((r) => {
    to = setTimeout(() => r('timeout'), 2500);
  });
  const outcome = await Promise.race([chain.then(() => 'done' as const), timeout]);
  clearTimeout(to);
  if (outcome === 'timeout' && !res.headersSent) {
    throw new Error(`${st.method} ${st.url} timed out: the handler never sent a response`);
  }
  if (res.firstDouble) lateError = res.firstDouble;
  if (lateError) {
    const le: Error & { code?: string } = lateError;
    const e: Error & { fromHandler?: boolean } = new Error(
      (le.code === 'ERR_HTTP_HEADERS_SENT' ? '' : 'Error thrown AFTER the response was already sent → ') +
        le.message +
        `\n   (during ${st.method} ${st.url})`,
    );
    e.stack = le.stack;
    e.fromHandler = true;
    ctx.runtimeErrors.push(e);
  }
  return { status: res.statusCode, body: res.body, headers: res._headers };
}
