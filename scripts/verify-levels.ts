// Checks every level, using the same sandbox the browser runs:
//   1. the level folder has everything it needs (meta, ticket, tests, fix),
//   2. the buggy code FAILS at least one visible test,
//   3. buggy code + the reference fix PASSES every visible and hidden test.
//
//   npm run verify            all levels
//   npm run verify -- m3 -v   one level, print every test
import { runTests, type Files, type TestResult } from '../src/runner/sandbox/index.ts';
import { checkLevelShape, HIDDEN_TEST_PATH, isTestFile, type Level } from '../src/levels/types.ts';
import { readLevels } from './levels-fs.ts';

const args = process.argv.slice(2);
const verbose = args.includes('-v');
const only = args.filter((a) => !a.startsWith('-'));
// Levels are independent, so check a few at once. Each test still runs on its own.
const jobs = Number(/^--jobs=(\d+)$/.exec(args.find((a) => a.startsWith('--jobs=')) ?? '')?.[1] ?? 8);

async function runAll(files: Files, paths: string[]): Promise<TestResult[]> {
  const out: TestResult[] = [];
  for (const p of paths) out.push(...(await runTests(files, p)));
  return out;
}

async function verify(L: Level, folder: string): Promise<{ ok: boolean; report: string[] }> {
  const report = [`=== ${L.id} ${L.title}`];
  const shape = checkLevelShape(L, folder);
  if (shape.length) return { ok: false, report: [...report, ...shape.map((p) => `  ✗ ${p}`)] };

  const visible = Object.keys(L.files).filter(isTestFile);
  const buggy: Files = { ...L.files, [HIDDEN_TEST_PATH]: L.hidden };
  const fixed: Files = { ...buggy, ...L.solution };
  let ok = true;
  const phases: [string, Files, string[]][] = [
    ['buggy, visible', buggy, visible],
    ['buggy, hidden ', buggy, [HIDDEN_TEST_PATH]],
    ['fixed, all    ', fixed, [...visible, HIDDEN_TEST_PATH]],
  ];
  for (const [label, files, paths] of phases) {
    const rs = await runAll(files, paths);
    const pass = rs.filter((r) => r.pass).length;
    const isFixed = label.startsWith('fixed');
    for (const r of rs) {
      if (verbose || (isFixed && !r.pass)) {
        report.push(`   ${r.pass ? '✓' : '✗'} ${r.name}`);
        if (!r.pass) report.push('      ' + String(r.error).split('\n').join('\n      '));
      }
    }
    let note = '';
    if (isFixed && pass !== rs.length) {
      ok = false;
      note = '  ← the fix must pass every test';
    }
    if (label.startsWith('buggy, visible') && pass === rs.length) {
      ok = false;
      note = '  ← the buggy code must fail at least one visible test';
    }
    report.push(`  ${label}: ${pass}/${rs.length}${note}`);
  }
  return { ok, report };
}

const all = readLevels().filter((x) => !only.length || only.includes(x.level.id));
if (!all.length) {
  console.error(only.length ? `No level called ${only.join(', ')}` : 'No levels found');
  process.exit(1);
}

const t0 = Date.now();
const results: { id: string; ok: boolean; report: string[] }[] = new Array(all.length);
let nextIdx = 0;
await Promise.all(
  Array.from({ length: Math.min(jobs, all.length) }, async () => {
    while (nextIdx < all.length) {
      const i = nextIdx++;
      const { folder, level } = all[i];
      try {
        results[i] = { id: level.id, ...(await verify(level, folder)) };
      } catch (e) {
        results[i] = { id: level.id, ok: false, report: [`=== ${level.id}`, `  ✗ crashed: ${(e as Error).stack}`] };
      }
    }
  }),
);

for (const r of results) console.log(r.report.join('\n') + '\n');
const good = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).map((r) => r.id);
console.log(`${good}/${results.length} levels valid  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
if (failed.length) console.log(`Problems: ${failed.join(', ')}`);
process.exit(failed.length ? 1 : 0);
