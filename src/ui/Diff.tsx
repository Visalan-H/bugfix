import type { ReactNode } from 'react';

// Line diff between two versions of a file, with 2 lines of context around each change.

type Op = [' ' | '+' | '-', string];

export function diffLines(a: string, b: string): Op[] {
  const A = a.split('\n');
  const B = b.split('\n');
  const n = A.length;
  const m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      out.push([' ', A[i]]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push(['-', A[i++]]);
    else out.push(['+', B[j++]]);
  }
  while (i < n) out.push(['-', A[i++]]);
  while (j < m) out.push(['+', B[j++]]);
  return out;
}

export function Diff({ from, to }: { from: string; to: string }) {
  const d = diffLines(from, to);
  const keep = d.map(() => false);
  d.forEach((x, k) => {
    if (x[0] !== ' ') for (let q = Math.max(0, k - 2); q <= Math.min(d.length - 1, k + 2); q++) keep[q] = true;
  });
  const rows: ReactNode[] = [];
  let skipping = false;
  d.forEach((x, k) => {
    if (!keep[k]) {
      if (!skipping)
        rows.push(
          <div key={k} className="s">
            ⋯
          </div>,
        );
      skipping = true;
      return;
    }
    skipping = false;
    const cls = x[0] === '+' ? 'a' : x[0] === '-' ? 'd' : 'c';
    rows.push(
      <div key={k} className={cls}>
        {x[0]} {x[1]}
      </div>,
    );
  });
  return <div className="diff">{rows}</div>;
}
