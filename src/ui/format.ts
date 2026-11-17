import type { Difficulty } from '../levels/types';

export const DIFF_LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export const esc = (s: unknown) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Seconds as mm:ss. Negative values show without the sign. */
export const fmtTime = (sec: number) => {
  const s = Math.abs(Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** `src/app.js:12` → `{ file: 'src/app.js', line: 12 }`. */
export function splitWhere(where: string): { file: string; line: number } {
  const i = where.lastIndexOf(':');
  return { file: where.slice(0, i), line: Number(where.slice(i + 1)) };
}

/** Narrow screens get the three-tab phone layout. */
export const MOBILE_QUERY = '(max-width:900px)';
export const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;
