import { lazy, Suspense } from 'react';

// The level page pulls in Monaco, which is large, so it loads only when a level opens.
const LevelView = lazy(() => import('./LevelView'));

export function LevelPage({ id }: { id: string }) {
  return (
    <Suspense fallback={<div className="lv-loading">Loading the editor…</div>}>
      <LevelView id={id} />
    </Suspense>
  );
}
