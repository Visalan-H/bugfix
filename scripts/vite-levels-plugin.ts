import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { scramble, splitLevel } from '../src/levels/secret.ts';
import { LEVELS_DIR, readLevel, readLevels } from './levels-fs.ts';

const LIST = 'virtual:levels';
const FILES = 'virtual:level-files/';
const SECRET = 'virtual:level-secret/';

/**
 * Two kinds of virtual module:
 *   virtual:levels            every level's public meta (answer fields removed),
 *                             plus lazy loaders for each level's files and secrets
 *   virtual:level-files/<id>  one level's ticket and buggy files (public)
 *   virtual:level-secret/<id> one level's hidden tests, fix and answer text, scrambled.
 *                             Each becomes its own small file, fetched only when needed.
 */
export function levelsPlugin(): Plugin {
  const watchAll = (ctx: { addWatchFile(f: string): void }, dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true }))
      if (e.isDirectory()) watchAll(ctx, join(dir, e.name));
      else ctx.addWatchFile(join(dir, e.name));
  };
  return {
    name: 'bugdrill-levels',
    resolveId(id) {
      if (id === LIST || id.startsWith(FILES) || id.startsWith(SECRET)) return '\0' + id;
      return null;
    },
    load(id) {
      if (id === '\0' + LIST) {
        watchAll(this, LEVELS_DIR);
        const levels = readLevels().map(({ level }) => level);
        const metas = levels.map((L) => ({ ...splitLevel(L).meta, fileCount: Object.keys(L.files).length }));
        const loaders = (prefix: string) =>
          `{\n${levels.map((L) => `${JSON.stringify(L.id)}: () => import(${JSON.stringify(prefix + L.id)})`).join(',\n')}\n}`;
        return [
          `export const metas = ${JSON.stringify(metas)};`,
          `export const fileLoaders = ${loaders(FILES)};`,
          `export const secretLoaders = ${loaders(SECRET)};`,
        ].join('\n');
      }
      if (id.startsWith('\0' + FILES)) {
        const root = join(LEVELS_DIR, id.slice(FILES.length + 1));
        watchAll(this, root);
        const L = readLevel(root);
        return `export default ${JSON.stringify({ ticket: L.ticket, files: L.files })};`;
      }
      if (id.startsWith('\0' + SECRET)) {
        const levelId = id.slice(SECRET.length + 1);
        const root = join(LEVELS_DIR, levelId);
        watchAll(this, root);
        return `export default ${JSON.stringify(scramble(levelId, splitLevel(readLevel(root)).secrets))};`;
      }
      return null;
    },
  };
}
