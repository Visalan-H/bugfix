declare module 'virtual:levels' {
  import type { Files } from '../runner/sandbox/types';
  import type { PublicMeta } from './secret';
  export const metas: (PublicMeta & { fileCount: number })[];
  export const fileLoaders: Record<string, () => Promise<{ default: { ticket: string; files: Files } }>>;
  export const secretLoaders: Record<string, () => Promise<{ default: string }>>;
}
