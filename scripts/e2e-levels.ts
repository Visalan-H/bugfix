// Prints each level's file list and reference fix as JSON, for scripts/e2e.cjs.
import { readLevels } from './levels-fs.ts';

const out = Object.fromEntries(
  readLevels().map(({ level }) => [level.id, { files: Object.keys(level.files), solution: level.solution }]),
);
process.stdout.write(JSON.stringify(out));
