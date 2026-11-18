import { useCallback, useEffect, useRef, useState } from 'react';
import { flush, updateLevel } from '../state/store';
import { fmtTime } from '../ui/format';

/**
 * The level clock. Time spent is saved in progress.elapsed (ms): every 10 s
 * while running, on pause, when leaving the level and when the page closes.
 */
export function useTimer(levelId: string, initialElapsedMs: number) {
  const t = useRef({ elapsed: initialElapsedMs, startedAt: null as number | null });
  const [running, setRunning] = useState(false);

  const elapsedMs = useCallback(
    () => t.current.elapsed + (t.current.startedAt ? Date.now() - t.current.startedAt : 0),
    [],
  );

  const start = useCallback(() => {
    if (t.current.startedAt) return;
    t.current.startedAt = Date.now();
    setRunning(true);
    updateLevel(levelId, { started: true });
  }, [levelId]);

  const stop = useCallback(() => {
    if (!t.current.startedAt) return;
    t.current.elapsed += Date.now() - t.current.startedAt;
    t.current.startedAt = null;
    setRunning(false);
    updateLevel(levelId, { elapsed: t.current.elapsed });
  }, [levelId]);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => updateLevel(levelId, { elapsed: elapsedMs() }), 10_000);
    return () => clearInterval(iv);
  }, [running, levelId, elapsedMs]);

  // Save on leave and before the page closes.
  useEffect(() => {
    const save = () => {
      if (t.current.startedAt) {
        updateLevel(levelId, { elapsed: elapsedMs() });
        flush();
      }
    };
    window.addEventListener('beforeunload', save);
    return () => {
      window.removeEventListener('beforeunload', save);
      save();
    };
  }, [levelId, elapsedMs]);

  return {
    running,
    elapsedMs,
    start,
    stop,
    /** Stable, safe to call from event handlers and effects. */
    isRunning: useCallback(() => t.current.startedAt !== null, []),
    toggle: () => (t.current.startedAt ? stop() : start()),
    /** True once any time has been spent. */
    hasTime: () => elapsedMs() > 0,
  };
}

/** Counts down from the level's minutes. Shows +mm:ss in red once over time. */
export function TimerDisplay({
  minutes,
  elapsedMs,
  running,
}: {
  minutes: number;
  elapsedMs: () => number;
  running: boolean;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(iv);
  }, [running]);
  const left = minutes * 60 - elapsedMs() / 1000;
  return (
    <div className={`timer ${running ? 'run' : ''} ${left < 0 ? 'over' : ''}`} title="Time left for this level">
      {(left < 0 ? '+' : '') + fmtTime(left)}
    </div>
  );
}
