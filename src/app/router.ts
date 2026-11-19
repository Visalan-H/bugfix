import { useSyncExternalStore } from 'react';

// Hash routes: #/  ·  #/level/<id>  ·  #/guide
// Old links (#home, #level-e1, #playbook) still work.

export type Route = { page: 'home' } | { page: 'level'; id: string } | { page: 'guide' };

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#/, '');
  const m = /^\/?level[-/]([\w-]+)/.exec(h);
  if (m) return { page: 'level', id: m[1] };
  if (/^\/?(guide|playbook)\b/.test(h)) return { page: 'guide' };
  return { page: 'home' };
}

export const href = (r: Route) => (r.page === 'level' ? `#/level/${r.id}` : r.page === 'guide' ? '#/guide' : '#/');

/** Rewrites old hashes to the new form, without adding a history entry. */
export function normalizeHash() {
  const h = location.hash;
  if (h === '' || h === '#' || h === '#/') return;
  const want = href(parseRoute(h));
  if (h !== want) history.replaceState(null, '', want);
}

export const go = (r: Route) => {
  location.hash = href(r);
};

const subscribe = (l: () => void) => {
  window.addEventListener('hashchange', l);
  return () => window.removeEventListener('hashchange', l);
};

/** The current hash. Re-renders on change. */
export const useHash = () => useSyncExternalStore(subscribe, () => location.hash);
