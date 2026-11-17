const fs = require('fs');
const path = require('path');

function parseBundle(text) {
  const parts = {};
  let cur = null;
  for (const line of text.split('\n')) {
    const m = /^@@@ (.+)$/.exec(line);
    if (m) { cur = m[1].trim(); parts[cur] = []; continue; }
    if (cur) parts[cur].push(line);
  }
  for (const k in parts) parts[k] = parts[k].join('\n').replace(/\n+$/, '\n');
  return parts;
}

function pack() {
  const dir = path.join(__dirname, 'levels');
  const out = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.bundle')).sort()) {
    const p = parseBundle(fs.readFileSync(path.join(dir, f), 'utf8'));
    const meta = JSON.parse(p['meta.json']);
    const files = {}, solution = {};
    for (const k in p) {
      if (k.startsWith('repo/')) files[k.slice(5)] = p[k];
      if (k.startsWith('solution/')) solution[k.slice(9)] = p[k];
    }
    out.push(Object.assign(meta, { ticket: p['ticket.md'], files, hidden: p['hidden.test.js'], solution }));
  }
  // Plain-English text overrides (simple-*.json): tagline, lookFor, and per-bug pattern/hints/cause/fix.
  const simple = {};
  for (const f of fs.readdirSync(dir).filter((x) => /^simple-.*\.json$/.test(x))) {
    Object.assign(simple, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  }
  for (const L of out) {
    const o = simple[L.id];
    if (!o) throw new Error('no simple text for ' + L.id);
    if (o.bugs.length !== L.bugs.length) throw new Error(`bug count mismatch for ${L.id}: ${o.bugs.length} vs ${L.bugs.length}`);
    L.tagline = o.tagline;
    L.lookFor = o.lookFor;
    L.bugs = L.bugs.map((b, i) => Object.assign({}, b, o.bugs[i], { symptom: b.symptom.replace(/^\(hidden\)\s*/, 'Hidden test: ') }));
  }
  const order = { easy: 0, medium: 1, hard: 2 };
  out.sort((a, b) => order[a.difficulty] - order[b.difficulty] || a.id.localeCompare(b.id, undefined, { numeric: true }));
  return out;
}

module.exports = pack;
if (require.main === module) {
  fs.writeFileSync(path.join(__dirname, 'levels.json'), JSON.stringify(pack()));
  console.log('packed');
}
