import { useEffect, useState } from 'react';
import { loadSecrets } from '.';
import type { LevelSecrets } from './secret';

/**
 * A level's secrets (hidden tests, fix, hints and answers), fetched only once
 * `enabled` is true. Returns null until loaded.
 */
export function useSecrets(id: string, enabled: boolean): LevelSecrets | null {
  const [got, setGot] = useState<{ id: string; s: LevelSecrets } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    loadSecrets(id).then((s) => live && setGot({ id, s }));
    return () => {
      live = false;
    };
  }, [id, enabled]);
  return enabled && got?.id === id ? got.s : null;
}
