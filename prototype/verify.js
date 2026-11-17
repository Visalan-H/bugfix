const pack = require('./pack');
const { runTests } = require('./runtime');

const only = process.argv[2];
(async () => {
  let ok = true;
  for (const L of pack()) {
    if (only && L.id !== only) continue;
    const vis = Object.keys(L.files).filter((f) => f.startsWith('tests/'));
    const buggy = Object.assign({}, L.files, { 'tests/hidden.test.js': L.hidden });
    const fixed = Object.assign({}, buggy, L.solution);
    console.log(`\n=== ${L.id} ${L.title}`);
    for (const [label, files, paths] of [['BUGGY visible', buggy, vis], ['BUGGY hidden', buggy, ['tests/hidden.test.js']], ['FIXED all', fixed, [...vis, 'tests/hidden.test.js']]]) {
      let pass = 0, total = 0;
      for (const tp of paths) {
        const rs = await runTests(files, tp);
        for (const r of rs) {
          total++; if (r.pass) pass++;
          if (process.argv.includes('-v') || (label.startsWith('FIXED') && !r.pass)) console.log(`   ${r.pass ? '✓' : '✗'} ${r.name}${r.pass ? '' : '\n      ' + String(r.error).split('\n').join('\n      ')}`);
        }
      }
      console.log(`  ${label}: ${pass}/${total}`);
      if (label.startsWith('FIXED') && pass !== total) ok = false;
      if (label === 'BUGGY visible' && pass === total) ok = false;
    }
  }
  console.log(ok ? '\nALL GOOD' : '\nPROBLEMS');
  process.exit(ok ? 0 : 1);
})();
