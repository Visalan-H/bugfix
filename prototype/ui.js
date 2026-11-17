(function () {
  'use strict';
  const LEVELS = window.LEVELS;
  const RT = window.BugRuntime;
  const app = document.getElementById('app');
  const DIFF = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  const DCOL = { easy: '#3ddc97', medium: '#ffbf47', hard: '#ff5d73' };

  // ---------------- state ----------------
  const KEY = 'bugdrill:v1';
  let S = {};
  try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
  S.levels = S.levels || {};
  S.interview = !!S.interview;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage off */ } };
  const ls = (id) => (S.levels[id] = S.levels[id] || { edits: {}, notes: '', solved: false, best: null, hints: {}, revealed: false, started: false });

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtTime = (sec) => { const s = Math.abs(Math.round(sec)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  // ---------------- markdown-lite ----------------
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function md(src) {
    const out = []; const L = src.replace(/\r/g, '').split('\n'); let i = 0;
    const isList = (l) => /^\s*([-*]|\d+\.)\s+/.test(l);
    while (i < L.length) {
      const l = L[i];
      if (l.startsWith('```')) { const b = []; i++; while (i < L.length && !L[i].startsWith('```')) b.push(L[i++]); i++; out.push('<pre class="md-code">' + esc(b.join('\n')) + '</pre>'); continue; }
      const h = /^(#{1,3})\s+(.*)/.exec(l);
      if (h) { const n = h[1].length + 1; out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }
      if (l.startsWith('|')) {
        const rows = []; while (i < L.length && L[i].startsWith('|')) rows.push(L[i++]);
        const cells = (r) => r.replace(/\\\|/g, '\u0001').split('|').slice(1, -1).map((c) => inline(c.trim()).replace(/\u0001/g, '|'));
        let t = '<div class="tbl"><table><thead><tr>' + cells(rows[0]).map((c) => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
        rows.slice(2).forEach((r) => { t += '<tr>' + cells(r).map((c) => `<td>${c}</td>`).join('') + '</tr>'; });
        out.push(t + '</tbody></table></div>'); continue;
      }
      if (isList(l)) {
        const ord = /^\s*\d+\./.test(l); const items = [];
        while (i < L.length && isList(L[i])) items.push(L[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''));
        out.push(`<${ord ? 'ol' : 'ul'}>` + items.map((x) => `<li>${inline(x)}</li>`).join('') + `</${ord ? 'ol' : 'ul'}>`); continue;
      }
      if (!l.trim()) { i++; continue; }
      const b = []; while (i < L.length && L[i].trim() && !/^(#|\||```)/.test(L[i]) && !isList(L[i])) b.push(L[i++]);
      out.push('<p>' + inline(b.join(' ')) + '</p>');
    }
    return out.join('');
  }

  // ---------------- highlighter ----------------
  const KW = new Set('const let var function async await return if else for of in while new class extends throw try catch finally typeof instanceof break continue switch case default this null undefined true false'.split(' '));
  function hl(code, path) {
    if (/\.json$/.test(path)) return esc(code).replace(/(&quot;[^&]*?&quot;)(\s*:)?/g, (m, s, c) => c ? `<span class="t-p">${s}</span>${c}` : `<span class="t-s">${s}</span>`);
    if (!/\.js$/.test(path)) return esc(code).replace(/^(#+ .*)$/gm, '<span class="t-b">$1</span>').replace(/(`[^`\n]+`)/g, '<span class="t-s">$1</span>');
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\[\s\S]|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index)); last = re.lastIndex;
      if (m[1]) out += `<span class="t-c">${esc(m[1])}</span>`;
      else if (m[2]) out += `<span class="t-s">${esc(m[2])}</span>`;
      else if (m[3]) out += `<span class="t-n">${m[3]}</span>`;
      else {
        const w = m[4];
        if (KW.has(w)) out += `<span class="t-k">${w}</span>`;
        else if (w === 'require' || w === 'module' || w === 'exports') out += `<span class="t-b">${w}</span>`;
        else if (/^\s*\(/.test(code.slice(re.lastIndex, re.lastIndex + 3))) out += `<span class="t-f">${w}</span>`;
        else out += w;
      }
    }
    return out + esc(code.slice(last));
  }

  // ---------------- diff ----------------
  function diffLines(a, b) {
    const A = a.split('\n'), B = b.split('\n'), n = A.length, m = B.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = []; let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { out.push([' ', A[i]]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) out.push(['-', A[i++]]);
      else out.push(['+', B[j++]]);
    }
    while (i < n) out.push(['-', A[i++]]);
    while (j < m) out.push(['+', B[j++]]);
    return out;
  }
  function renderDiff(a, b) {
    const d = diffLines(a, b);
    const keep = d.map(() => false);
    d.forEach((x, k) => { if (x[0] !== ' ') for (let q = Math.max(0, k - 2); q <= Math.min(d.length - 1, k + 2); q++) keep[q] = true; });
    let html = '', skipping = false;
    d.forEach((x, k) => {
      if (!keep[k]) { if (!skipping) { html += '<div class="s">⋯</div>'; skipping = true; } return; }
      skipping = false;
      const cls = x[0] === '+' ? 'a' : x[0] === '-' ? 'd' : 'c';
      html += `<div class="${cls}">${x[0]} ${esc(x[1])}</div>`;
    });
    return `<div class="diff">${html}</div>`;
  }

  // ---------------- nav ----------------
  function nav(active) {
    return `<nav class="nav">
      <a class="logo" href="#home">bug<span>/</span>drill</a>
      <a class="nl ${active === 'home' ? 'on' : ''}" href="#home">Levels</a>
      <a class="nl ${active === 'playbook' ? 'on' : ''}" href="#playbook">Guide</a>
      <div class="sp"></div>
      <div class="toggle ${S.interview ? 'on' : ''}" id="t-interview" title="Hides hints, tips, hidden test names and the answer until you pass">
        <span class="lbl">Interview mode</span><span class="sw"></span>
      </div>
    </nav>`;
  }
  function bindNav() {
    const t = document.getElementById('t-interview');
    if (t) t.onclick = () => { S.interview = !S.interview; save(); t.classList.toggle('on', S.interview); toast(S.interview ? 'Interview mode on: no hints, like the real test' : 'Practice mode: hints are back'); };
  }

  // ---------------- home ----------------
  function renderHome() {
    document.body.classList.remove('in-level');
    const solved = LEVELS.filter((l) => ls(l.id).solved).length;
    const next = LEVELS.find((l) => !ls(l.id).solved) || LEVELS[0];
    const f = S.filter || { diff: 'all', status: 'all', q: '' };
    const qq = (f.q || '').trim().toLowerCase();
    const match = (l) => {
      const st = ls(l.id);
      if (f.diff !== 'all' && l.difficulty !== f.diff) return false;
      if (f.status === 'unsolved' && st.solved) return false;
      if (f.status === 'solved' && !st.solved) return false;
      if (qq) {
        const hay = [l.title, l.tagline, ...l.tags, ...l.bugs.map((b) => b.pattern)].join(' ').toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    };
    const groups = ['easy', 'medium', 'hard'].map((d) => {
      const all = LEVELS.filter((l) => l.difficulty === d);
      const shown = all.filter(match);
      if (!shown.length) return '';
      const done = all.filter((l) => ls(l.id).solved).length;
      return `<div class="sec-h"><span class="pill ${d}">${DIFF[d]}</span><span class="dim mono" style="font-size:12px">${done}/${all.length} solved</span></div>
      <div class="grid">${shown.map(card).join('')}</div>`;
    }).join('') || '<p class="muted">No levels match. Try clearing the filters.</p>';
    const chip = (key, val, label) => `<button class="chip ${f[key] === val ? 'on' : ''}" data-fk="${key}" data-fv="${val}">${label}</button>`;
    const filters = `<div class="filters">
        ${chip('diff', 'all', 'All')}${chip('diff', 'easy', 'Easy')}${chip('diff', 'medium', 'Medium')}${chip('diff', 'hard', 'Hard')}
        <span class="fsep"></span>
        ${chip('status', 'all', 'Any status')}${chip('status', 'unsolved', 'Unsolved')}${chip('status', 'solved', 'Solved')}
        <input class="fsearch" id="fsearch" placeholder="Search: await, cache, date, owner…" value="${esc(f.q || '')}">
        <button class="btn sm" id="random">🎲 Random unsolved</button>
      </div>`;
    app.innerHTML = nav('home') + `
    <div class="wrap">
      <section class="hero">
        <div class="eyebrow">Amazon online test · bug-fixing round</div>
        <h1>Someone else's code. Failing tests. <em>A clock.</em></h1>
        <p>Practise the Amazon bug-fixing round on small, real-looking Node apps. Read the task, find the bugs, fix them, then submit to run hidden tests too.</p>
        <div class="cta">
          <a class="btn pri" href="#level-${next.id}">▶ ${solved ? 'Continue' : 'Start'}: ${esc(next.title.split(':')[0])}</a>
          <a class="btn" href="#playbook">How to pass (8 min read)</a>
        </div>
        <div class="facts">
          <div class="fact"><b>2 questions</b><span>One coding puzzle and one bug-fixing task in an existing app</span></div>
          <div class="fact"><b>~60 min</b><span>Usual time for the bug task. Your invite has the real number.</span></div>
          <div class="fact"><b>3 – 6 bugs</b><span>People report between 3 bugs and about 6 failing tests</span></div>
          <div class="fact"><b>Hidden tests</b><span>Passing the tests you can see is not enough</span></div>
        </div>
      </section>
      <div class="sec-h"><h2>Levels</h2>
        <div class="progress" title="${solved}/${LEVELS.length} solved"><i style="width:${(solved / LEVELS.length) * 100}%"></i></div>
        <span class="dim mono" style="font-size:12px">${solved}/${LEVELS.length} solved</span></div>
      <div class="stackbar">
        <span class="chip on">Node.js · Express · Mongo-style</span>
        <span class="chip soon" title="Same bugs in Java. See the table in the Playbook.">Spring Boot · next</span>
      </div>
      ${filters}
      <div id="groups">${groups}</div>
      <footer>Runs entirely in your browser: a mini Express, supertest, Jest and a Mongoose-like store. Progress is saved in this browser only.</footer>
    </div>`;
    bindNav();
    app.querySelectorAll('.filters [data-fk]').forEach((b) => {
      b.onclick = () => { S.filter = Object.assign({}, f, { [b.dataset.fk]: b.dataset.fv }); save(); keepScroll(renderHome); };
    });
    const fs = document.getElementById('fsearch');
    fs.oninput = () => {
      S.filter = Object.assign({}, f, { q: fs.value }); save();
      clearTimeout(fs._t); fs._t = setTimeout(() => keepScroll(() => { renderHome(); const n = document.getElementById('fsearch'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }), 250);
    };
    document.getElementById('random').onclick = () => {
      const pool = LEVELS.filter((l) => !ls(l.id).solved && (f.diff === 'all' || l.difficulty === f.diff));
      const pick = (pool.length ? pool : LEVELS)[Math.floor(Math.random() * (pool.length || LEVELS.length))];
      location.hash = 'level-' + pick.id;
    };
  }
  function keepScroll(fn) { const y = window.scrollY; fn(); window.scrollTo(0, y); }
  function card(l) {
    const st = ls(l.id);
    const status = st.solved ? `<span class="status ok">✓ ${st.best != null ? fmtTime(st.best) : 'solved'}</span>` : (st.started ? '<span class="status wip">in progress</span>' : '');
    return `<a class="card" href="#level-${l.id}">
      ${status}
      <span class="pill ${l.difficulty}">${DIFF[l.difficulty]}</span>
      <h3>${esc(l.title)}</h3>
      <p>${esc(l.tagline)}</p>
      <div class="tags">${l.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      <div class="meta"><span>⏱ ${l.minutes} min</span><span>🐞 ${l.bugs.length} bugs</span><span>📁 ${Object.keys(l.files).length} files</span></div>
    </a>`;
  }

  // ---------------- playbook ----------------
  function renderPlaybook() {
    document.body.classList.remove('in-level');
    app.innerHTML = nav('playbook') + `<div class="wrap pb">${document.getElementById('playbook-src').innerHTML}</div>`;
    bindNav();
    app.querySelectorAll('.toc a[data-sec]').forEach((a) => {
      a.onclick = (e) => { e.preventDefault(); const t = document.getElementById(a.dataset.sec); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    });
    window.scrollTo(0, 0);
  }

  // ---------------- level ----------------
  let L = null, files = null, timer = null, running = false, lastRun = null, panelTab = 'task';
  let panes = [], focus = 0;
  const curPane = () => panes[focus] || panes[0];
  const curFile = () => curPane().active;

  const isMobile = () => window.matchMedia('(max-width:900px)').matches;
  const isRO = (p) => p.startsWith('tests/') || p === 'package.json' || p.endsWith('.md');
  const defaultFile = () => Object.keys(L.files).find((f) => /routes|controllers/.test(f)) || Object.keys(L.files).find((f) => f.startsWith('src/'));
  const testFile = () => Object.keys(L.files).find((f) => f.startsWith('tests/'));

  function renderLevel(id) {
    const lvl = LEVELS.find((x) => x.id === id);
    if (!lvl) return renderHome();
    if (timer && timer.iv) clearInterval(timer.iv);
    L = lvl;
    const st = ls(id);
    files = Object.assign({}, L.files, st.edits);
    timer = { elapsed: st.elapsed || 0, startedAt: null, iv: null };
    lastRun = null;
    panelTab = 'task';
    document.body.classList.add('in-level');

    // Restore open tabs / split from last visit.
    const saved = st.layout && Array.isArray(st.layout.panes) ? st.layout.panes : null;
    panes = (saved || [{ tabs: [defaultFile(), testFile()].filter(Boolean), active: defaultFile() }]).map((p) => {
      const tabs = (p.tabs || []).filter((t) => t in L.files);
      if (!tabs.length) tabs.push(defaultFile());
      return { tabs, active: tabs.includes(p.active) ? p.active : tabs[0], scroll: {} };
    });
    if (isMobile()) panes = panes.slice(0, 1);
    focus = 0;

    app.innerHTML = `
    <div class="lv">
      <header class="lv-top">
        <a class="back" href="#home" title="All levels">←</a>
        <button class="tb opt ic" id="b-files" title="Show / hide the file list">☰</button>
        <div class="lv-title"><span class="pill ${L.difficulty}">${DIFF[L.difficulty]}</span><b>${esc(L.title)}</b></div>
        <div class="timer" id="timer">${fmtTime(L.minutes * 60)}</div>
        <button class="tb" id="b-timer">Start</button>
        <div class="sp"></div>
        <button class="tb opt" id="b-diff" title="See every line you changed">Diff</button>
        <button class="tb opt" id="b-reset" title="Undo all changes to the file you're looking at">Reset file</button>
        <button class="tb run" id="b-run" title="Ctrl/⌘ + Enter">▶ Run tests</button>
        <button class="tb sub" id="b-submit" title="Runs the tests you can see plus the hidden ones">Submit</button>
        <button class="tb opt ic" id="b-panel" title="Show / hide the Task & Results panel">◨</button>
      </header>
      <nav class="mtabs">
        <button data-p="files">Files</button><button data-p="code" class="on">Code</button><button data-p="panel">Task / Results</button>
      </nav>
      <div class="lv-body ${S.hideFiles ? 'nofiles' : ''} ${S.hidePanel ? 'nopanel' : ''}" id="lv-body">
        <aside class="pane files" id="p-files"></aside>
        <main class="pane code show" id="p-code">
          <div class="editors" id="editors"></div>
          <div class="console ${S.consoleOpen === false ? '' : 'open'}" id="console" style="--conh:${S.consoleH || 210}px">
            <div class="con-resize" id="con-resize" title="Drag to resize"></div>
            <div class="con-head" id="con-head"></div>
            <div class="con-body" id="con-body"></div>
          </div>
        </main>
        <section class="pane panel" id="p-panel">
          <div class="ptabs" id="ptabs"></div>
          <div class="pbody" id="pbody"></div>
        </section>
      </div>
    </div>`;

    renderTree(); renderEditors(); renderConsole(); renderTabs(); renderPanel(); tickTimer();
    const $ = (x) => document.getElementById(x);
    $('b-timer').onclick = toggleTimer;
    $('b-files').onclick = () => { S.hideFiles = !S.hideFiles; save(); $('lv-body').classList.toggle('nofiles', S.hideFiles); };
    $('b-panel').onclick = () => { S.hidePanel = !S.hidePanel; save(); $('lv-body').classList.toggle('nopanel', S.hidePanel); };
    $('b-run').onclick = () => run(false);
    $('b-submit').onclick = () => run(true);
    $('b-diff').onclick = showDiffModal;
    $('b-reset').onclick = () => {
      const f = curFile();
      if (!L.files[f] || files[f] === L.files[f]) return toast('Nothing to reset in ' + f.split('/').pop());
      files[f] = L.files[f]; delete st.edits[f]; save(); refreshEditors(); toast('Reset ' + f.split('/').pop());
    };
    document.querySelectorAll('.mtabs button').forEach((b) => { b.onclick = () => showPane(b.dataset.p); });
    bindConsoleResize();
    document.onkeydown = (e) => {
      if (!L || !document.getElementById('editors')) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'Enter') { e.preventDefault(); run(false); }
      else if (e.altKey && (e.key === 'w' || e.key === 'W' || e.code === 'KeyW')) { e.preventDefault(); closeTab(focus, curFile()); }
      else if (e.altKey && (e.key === '\\' || e.code === 'Backslash')) { e.preventDefault(); panes.length > 1 ? unsplit() : split(); }
      else if (e.altKey && (e.code === 'BracketRight' || e.code === 'BracketLeft')) {
        e.preventDefault();
        const p = curPane(); const i = p.tabs.indexOf(p.active);
        const n = (i + (e.code === 'BracketRight' ? 1 : -1) + p.tabs.length) % p.tabs.length;
        activate(focus, p.tabs[n]);
      } else if (e.key === '`' && mod) { e.preventDefault(); toggleConsole(); }
    };
  }

  function showPane(p) {
    document.querySelectorAll('.mtabs button').forEach((b) => b.classList.toggle('on', b.dataset.p === p));
    ['files', 'code', 'panel'].forEach((x) => document.getElementById('p-' + x).classList.toggle('show', x === p));
  }

  function saveLayout() {
    ls(L.id).layout = { panes: panes.map((p) => ({ tabs: p.tabs, active: p.active })) };
    save();
  }

  function renderTree() {
    const paths = Object.keys(L.files).sort((a, b) => {
      const da = a.includes('/'), db = b.includes('/');
      if (da !== db) return da ? -1 : 1;
      return a.localeCompare(b);
    });
    const openAnywhere = new Set(panes.flatMap((p) => p.tabs));
    let html = `<div class="ph">${esc(L.id.toUpperCase())} · files <span class="dim">(click = open in a tab)</span></div>`;
    const seen = new Set();
    for (const p of paths) {
      const parts = p.split('/');
      for (let d = 1; d < parts.length; d++) {
        const dir = parts.slice(0, d).join('/');
        if (!seen.has(dir)) { seen.add(dir); html += `<div class="fi dir" style="padding-left:${10 + (d - 1) * 14}px">▾ ${esc(parts[d - 1])}/</div>`; }
      }
      const mod = files[p] !== L.files[p];
      html += `<div class="fi ${p === curFile() ? 'on' : ''} ${openAnywhere.has(p) ? 'open' : ''}" data-f="${esc(p)}" style="padding-left:${10 + (parts.length - 1) * 14}px">${esc(parts[parts.length - 1])}${mod ? '<span class="mod" title="changed"></span>' : isRO(p) ? '<span class="ro">read-only</span>' : ''}</div>`;
    }
    const el = document.getElementById('p-files');
    el.innerHTML = html;
    el.querySelectorAll('.fi[data-f]').forEach((n) => { n.onclick = () => { openFile(n.dataset.f); if (isMobile()) showPane('code'); }; });
  }

  // ---------------- editors (tabs + split) ----------------
  function paneEls(i) {
    const root = document.querySelector(`.epane[data-pane="${i}"]`);
    if (!root) return null;
    return { root, ta: root.querySelector('textarea'), hl: root.querySelector('.hl'), pre: root.querySelector('.hlpre'), gut: root.querySelector('.gutter-inner'), bar: root.querySelector('.filebar'), wrap: root.querySelector('.code-wrap') };
  }

  function tabHtml(t, on) {
    const mod = files[t] !== L.files[t];
    const dir = t.includes('/') ? t.split('/').slice(-2, -1)[0] + '/' : '';
    return `<div class="etab ${on ? 'on' : ''} ${t.startsWith('tests/') ? 'test' : ''}" data-t="${esc(t)}" title="${esc(t)}${isRO(t) ? ' (read-only)' : ''}">
      <span class="tdir">${esc(dir)}</span><span class="tname">${esc(t.split('/').pop())}</span>${isRO(t) ? '<span class="tlock">ro</span>' : ''}
      <span class="x ${mod ? 'mod' : ''}" data-close="${esc(t)}" title="Close (Alt+W)">×</span></div>`;
  }

  function renderEditors() {
    const host = document.getElementById('editors');
    const canSplit = !isMobile();
    host.innerHTML = panes.map((p, i) => `
      <div class="epane ${i === focus && panes.length > 1 ? 'focus' : ''}" data-pane="${i}">
        <div class="etabs">
          <div class="etab-list">${p.tabs.map((t) => tabHtml(t, p.active === t)).join('')}</div>
          ${canSplit && panes.length === 1 ? '<button class="eb" data-act="split" title="Show two files side by side (Alt+\\)">⫿ Split</button>' : ''}
          ${panes.length > 1 ? `<button class="eb" data-act="close-pane" title="Close this side">✕</button>` : ''}
        </div>
        <div class="filebar"></div>
        <div class="editor">
          <div class="gutter"><div class="gutter-inner"></div></div>
          <div class="code-wrap"><pre class="hlpre"><code class="hl"></code></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"></textarea></div>
        </div>
      </div>`).join('');
    panes.forEach((p, i) => { bindPane(i); loadPane(i); });
  }

  function refreshEditors() { renderEditors(); renderTree(); }

  function loadPane(i) {
    const p = panes[i], e = paneEls(i), f = p.active;
    e.ta.value = files[f];
    e.ta.readOnly = isRO(f);
    e.bar.innerHTML = `<span class="fpath">${esc(f)}</span>${isRO(f) ? '<span class="ro">read-only</span>' : ''}${panes.length === 1 ? '<span class="kb">⌘/Ctrl+Enter run · Alt+W close tab · Alt+[ ] switch tab · Alt+\\ split · Ctrl+` console</span>' : ''}`;
    paint(i);
    const sc = p.scroll[f] || { top: 0, left: 0 };
    e.ta.scrollTop = sc.top; e.ta.scrollLeft = sc.left;
    syncScroll(i);
    const on = e.root.querySelector('.etab.on');
    if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function paint(i) {
    const e = paneEls(i), f = panes[i].active, v = files[f];
    e.hl.innerHTML = hl(v, f) + '\n ';
    const n = v.split('\n').length;
    let g = ''; for (let k = 1; k <= n; k++) g += k + '\n';
    e.gut.textContent = g;
  }
  function syncScroll(i) {
    const e = paneEls(i);
    e.pre.style.transform = `translate(${-e.ta.scrollLeft}px,${-e.ta.scrollTop}px)`;
    e.gut.style.transform = `translateY(${-e.ta.scrollTop}px)`;
    panes[i].scroll[panes[i].active] = { top: e.ta.scrollTop, left: e.ta.scrollLeft };
  }

  function setFocus(i) {
    if (focus === i) return;
    focus = i;
    document.querySelectorAll('.epane').forEach((el) => el.classList.toggle('focus', panes.length > 1 && Number(el.dataset.pane) === i));
    renderTree();
  }

  function activate(i, f) {
    panes[i].active = f;
    focus = i;
    renderEditors(); renderTree(); saveLayout();
  }

  function openFile(f, line) {
    const p = curPane();
    if (!p.tabs.includes(f)) p.tabs.splice(p.tabs.indexOf(p.active) + 1, 0, f);
    p.active = f;
    renderEditors(); renderTree(); saveLayout();
    if (line) goToLine(focus, line);
  }

  function closeTab(i, f) {
    const p = panes[i];
    const idx = p.tabs.indexOf(f);
    if (idx === -1) return;
    p.tabs.splice(idx, 1);
    delete p.scroll[f];
    if (!p.tabs.length) {
      if (panes.length > 1) return unsplit(i);
      p.tabs.push(defaultFile());
    }
    if (p.active === f) p.active = p.tabs[Math.min(idx, p.tabs.length - 1)];
    renderEditors(); renderTree(); saveLayout();
  }

  function split() {
    if (panes.length > 1 || isMobile()) return;
    const f = curFile();
    const other = f.startsWith('tests/') ? defaultFile() : (testFile() || f);
    panes.push({ tabs: [other], active: other, scroll: {} });
    focus = 1;
    renderEditors(); renderTree(); saveLayout();
  }
  function unsplit(i = 1) {
    if (panes.length < 2) return;
    panes.splice(i, 1);
    focus = 0;
    renderEditors(); renderTree(); saveLayout();
  }

  function goToLine(i, line) {
    const e = paneEls(i);
    if (!e) return;
    const lines = e.ta.value.split('\n');
    const n = Math.max(1, Math.min(line, lines.length));
    let start = 0;
    for (let k = 0; k < n - 1; k++) start += lines[k].length + 1;
    const end = start + lines[n - 1].length;
    e.ta.focus({ preventScroll: true });
    e.ta.setSelectionRange(start, end);
    e.ta.scrollTop = Math.max(0, (n - 1) * 20 - e.ta.clientHeight / 3);
    syncScroll(i);
    const fl = document.createElement('div');
    fl.className = 'lineflash';
    fl.style.top = `${12 + (n - 1) * 20 - e.ta.scrollTop}px`;
    e.wrap.appendChild(fl);
    setTimeout(() => fl.remove(), 1600);
  }

  function bindPane(i) {
    const e = paneEls(i), p = panes[i];
    const st = ls(L.id);
    let saveT = null;
    e.root.addEventListener('mousedown', () => setFocus(i), true);
    e.root.addEventListener('focusin', () => setFocus(i));
    e.root.querySelectorAll('.etab').forEach((tab) => {
      tab.addEventListener('click', (ev) => {
        if (ev.target.dataset.close) { ev.stopPropagation(); closeTab(i, ev.target.dataset.close); return; }
        if (tab.dataset.t !== p.active) activate(i, tab.dataset.t);
      });
      tab.addEventListener('auxclick', (ev) => { if (ev.button === 1) { ev.preventDefault(); closeTab(i, tab.dataset.t); } });
    });
    const sb = e.root.querySelector('[data-act="split"]');
    if (sb) sb.onclick = split;
    const cb = e.root.querySelector('[data-act="close-pane"]');
    if (cb) cb.onclick = () => unsplit(i);

    e.ta.addEventListener('scroll', () => syncScroll(i));
    e.ta.addEventListener('input', () => {
      if (e.ta.readOnly) return;
      const f = p.active;
      files[f] = e.ta.value;
      if (files[f] === L.files[f]) delete st.edits[f]; else st.edits[f] = files[f];
      st.started = true;
      if (!timer.startedAt && !st.solved) startTimer();
      paint(i); syncScroll(i);
      // Same file open on the other side? Keep it in sync.
      panes.forEach((q, j) => {
        if (j !== i && q.active === f) { const o = paneEls(j); const t = o.ta.scrollTop; o.ta.value = files[f]; paint(j); o.ta.scrollTop = t; syncScroll(j); }
      });
      clearTimeout(saveT);
      saveT = setTimeout(() => {
        save(); renderTree();
        document.querySelectorAll(`.etab[data-t="${CSS.escape(f)}"] .x`).forEach((x) => x.classList.toggle('mod', files[f] !== L.files[f]));
      }, 300);
    });
    e.ta.addEventListener('keydown', (ev) => {
      if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'Enter' || ev.key === 's')) { ev.preventDefault(); ev.stopPropagation(); run(false); return; }
      if (e.ta.readOnly) return;
      if (ev.key === 'Tab') {
        ev.preventDefault();
        document.execCommand('insertText', false, '  ');
      } else if (ev.key === 'Enter' && !ev.shiftKey) {
        const s0 = e.ta.selectionStart;
        const lineStart = e.ta.value.lastIndexOf('\n', s0 - 1) + 1;
        const before = e.ta.value.slice(lineStart, s0);
        const indent = /^\s*/.exec(before)[0];
        const extra = /[{([]\s*$/.test(before) ? '  ' : '';
        if (indent || extra) { ev.preventDefault(); document.execCommand('insertText', false, '\n' + indent + extra); }
      }
    });
  }

  // ---------------- console ----------------
  function consoleGroups() {
    if (!lastRun) return null;
    const st = ls(L.id);
    const groups = [];
    const add = (r, i, hidden) => {
      if (!r.logs || !r.logs.length) return;
      groups.push({ name: hidden && S.interview && !st.solved ? `Hidden test #${i + 1}` : r.name, pass: r.pass, hidden, logs: r.logs });
    };
    lastRun.visible.forEach((r, i) => add(r, i, false));
    lastRun.hidden.forEach((r, i) => add(r, i, true));
    return groups;
  }

  function renderConsole() {
    const box = document.getElementById('console');
    if (!box) return;
    const groups = consoleGroups();
    const all = groups ? groups.flatMap((g) => g.logs) : [];
    const errs = all.filter((l) => l.type === 'error').length;
    const q = (S.consoleQ || '').toLowerCase();
    const head = document.getElementById('con-head');
    const filterEl = document.getElementById('con-filter');
    const hadFocus = filterEl && document.activeElement === filterEl;
    head.innerHTML = `
      <button class="con-title" id="con-toggle" title="Show / hide (Ctrl+\`)"><span class="chev">${box.classList.contains('open') ? '▾' : '▸'}</span> Console</button>
      <span class="con-badge ${all.length ? 'has' : ''}">${all.length} ${all.length === 1 ? 'line' : 'lines'}</span>
      ${errs ? `<span class="con-badge err">${errs} error${errs === 1 ? '' : 's'}</span>` : ''}
      <span class="con-sp"></span>
      <input class="con-filter" id="con-filter" placeholder="Filter logs…" value="${esc(S.consoleQ || '')}">
      <button class="eb" id="con-clear" title="Clear the console">Clear</button>`;
    document.getElementById('con-toggle').onclick = toggleConsole;
    document.getElementById('con-clear').onclick = () => { if (lastRun) { lastRun.visible.forEach((r) => { r.logs = []; }); lastRun.hidden.forEach((r) => { r.logs = []; }); } renderConsole(); if (panelTab === 'output') renderPanel(); };
    const fi = document.getElementById('con-filter');
    fi.oninput = () => { S.consoleQ = fi.value; save(); renderConsoleBody(); };
    if (hadFocus) { fi.focus(); fi.setSelectionRange(fi.value.length, fi.value.length); }
    renderConsoleBody();
  }

  function renderConsoleBody() {
    const body = document.getElementById('con-body');
    const groups = consoleGroups();
    const q = (S.consoleQ || '').toLowerCase();
    if (!groups) {
      body.innerHTML = `<div class="con-empty">Put <code>console.log(...)</code> anywhere in <code>src/</code> and press <b>▶ Run tests</b>. Everything you log shows up here, with the file and line it came from. Click the file name to jump there.</div>`;
      return;
    }
    if (!groups.length) {
      body.innerHTML = `<div class="con-empty">This run printed nothing. Tip: log the value you suspect, for example <code>console.log('user is', req.user)</code>, then run again.</div>`;
      return;
    }
    let html = '';
    for (const g of groups) {
      const lines = g.logs.filter((l) => !q || l.text.toLowerCase().includes(q) || (l.where || '').toLowerCase().includes(q));
      if (!lines.length) continue;
      html += `<div class="con-grp ${g.pass ? 'p' : 'f'}"><span class="ic">${g.pass ? '✓' : '✗'}</span>${g.hidden ? '<span class="hid">hidden</span>' : ''}${esc(g.name)}</div>`;
      html += lines.map((l) => {
        const [wf, wl] = l.where ? [l.where.replace(/:\d+$/, ''), Number(l.where.split(':').pop())] : [null, null];
        const src = l.where && files[wf] !== undefined ? `<a class="con-src" data-f="${esc(wf)}" data-l="${wl}" title="Open ${esc(l.where)}">${esc(wf.split('/').pop())}:${wl}</a>` : '';
        let thrown = '';
        if (l.thrownAt) {
          const tf = l.thrownAt.replace(/:\d+$/, ''), tl = Number(l.thrownAt.split(':').pop());
          if (files[tf] !== undefined) thrown = ` <a class="con-src thrown" data-f="${esc(tf)}" data-l="${tl}" title="Open where the error was thrown">← thrown at ${esc(tf.split('/').pop())}:${tl}</a>`;
        }
        return `<div class="con-line ${l.type}"><span class="con-type">${l.type === 'log' || l.type === 'info' || l.type === 'debug' ? '›' : l.type === 'warn' ? '⚠' : '✖'}</span><span class="con-text">${esc(l.text)}${thrown}</span>${src}</div>`;
      }).join('');
    }
    body.innerHTML = html || '<div class="con-empty">No lines match the filter.</div>';
    body.querySelectorAll('.con-src').forEach((a) => { a.onclick = () => { openFile(a.dataset.f, Number(a.dataset.l)); if (isMobile()) showPane('code'); }; });
  }

  function toggleConsole(force) {
    const box = document.getElementById('console');
    const open = typeof force === 'boolean' ? force : !box.classList.contains('open');
    box.classList.toggle('open', open);
    S.consoleOpen = open; save();
    renderConsole();
  }

  function bindConsoleResize() {
    const h = document.getElementById('con-resize'), box = document.getElementById('console');
    h.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!box.classList.contains('open')) toggleConsole(true);
      const y0 = e.clientY, h0 = box.getBoundingClientRect().height;
      const move = (ev) => {
        const nh = Math.max(90, Math.min(window.innerHeight * 0.7, h0 - (ev.clientY - y0)));
        box.style.setProperty('--conh', nh + 'px');
      };
      const up = () => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
        S.consoleH = Math.round(box.getBoundingClientRect().height); save();
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
  }

  // ---------------- timer ----------------
  function elapsedSec() { return (timer.elapsed + (timer.startedAt ? Date.now() - timer.startedAt : 0)) / 1000; }
  function startTimer() {
    timer.startedAt = Date.now();
    timer.iv = setInterval(tickTimer, 500);
    ls(L.id).started = true; save();
    tickTimer();
  }
  function stopTimer() {
    if (timer.startedAt) timer.elapsed += Date.now() - timer.startedAt;
    timer.startedAt = null; clearInterval(timer.iv);
    ls(L.id).elapsed = timer.elapsed; save();
    tickTimer();
  }
  function toggleTimer() { timer.startedAt ? stopTimer() : startTimer(); }
  function tickTimer() {
    const el = document.getElementById('timer'); if (!el) return clearInterval(timer.iv);
    const left = L.minutes * 60 - elapsedSec();
    el.textContent = (left < 0 ? '+' : '') + fmtTime(left);
    el.classList.toggle('run', !!timer.startedAt);
    el.classList.toggle('over', left < 0);
    const b = document.getElementById('b-timer');
    if (b) b.textContent = timer.startedAt ? 'Pause' : (timer.elapsed ? 'Resume' : 'Start');
    if (timer.startedAt && Math.round(elapsedSec()) % 10 === 0) { ls(L.id).elapsed = timer.elapsed + (Date.now() - timer.startedAt); save(); }
  }

  // ---------------- panel ----------------
  function renderTabs() {
    const st = ls(L.id);
    const tabs = [['task', 'Task'], ['output', 'Results'], ['hints', 'Hints'], ['notes', 'Notes'], ['debrief', 'Answers']];
    let cnt = '';
    if (lastRun) { const p = lastRun.all.filter((r) => r.pass).length; cnt = `<span class="cnt ${p === lastRun.all.length ? 'ok' : 'bad'}">${p}/${lastRun.all.length}</span>`; }
    document.getElementById('ptabs').innerHTML = tabs.map(([k, n]) =>
      `<button data-t="${k}" class="${panelTab === k ? 'on' : ''}">${n}${k === 'output' ? cnt : ''}${k === 'debrief' && !(st.solved || st.revealed) ? ' 🔒' : ''}</button>`).join('');
    document.querySelectorAll('#ptabs button').forEach((b) => { b.onclick = () => { panelTab = b.dataset.t; renderTabs(); renderPanel(); }; });
  }

  function timeSplit() {
    const m = L.minutes, n = L.bugs.filter((b) => !b.symptom.startsWith('Hidden test')).length;
    const recon = Math.max(2, Math.round(m * 0.15)), verify = Math.max(2, Math.round(m * 0.15));
    const per = Math.floor((m - recon - verify) / n);
    const cols = ['#6cb6ff', '#ffbf47', '#ff9f1c', '#ff8c5a', '#ff7a7a', '#c39bff'];
    let html = `<div class="split"><div style="flex:${recon};background:#6cb6ff">Look ${recon}m</div>`;
    for (let i = 0; i < n; i++) html += `<div style="flex:${per};background:${cols[(i + 1) % cols.length]}">Bug ${i + 1} ≤${per}m</div>`;
    return html + `<div style="flex:${verify};background:#3ddc97">Check ${verify}m</div></div>`;
  }

  function renderPanel() {
    const b = document.getElementById('pbody');
    const st = ls(L.id);
    if (panelTab === 'task') {
      b.innerHTML = md(L.ticket) +
        `<h3>Suggested timing</h3>${timeSplit()}
         <p class="muted" style="font-size:13px">Stuck past your time for a bug? Write your guess in Notes and move on. The bugs are usually separate.</p>` +
        (S.interview ? '' : `<details class="coach"><summary>Tips: where to look in this app</summary><ul>${L.lookFor.map((x) => `<li>${inline(x)}</li>`).join('')}</ul></details>`) +
        `<p class="dim" style="font-size:12.5px">Your code runs right here in the browser, with Express, supertest, Jest-style tests and a small Mongo-like database. Anything you <code>console.log</code> shows under each test.</p>`;
    } else if (panelTab === 'output') {
      b.innerHTML = renderResults();
      b.querySelectorAll('[data-go]').forEach((x) => { x.onclick = () => { panelTab = x.dataset.go; renderTabs(); renderPanel(); }; });
      b.querySelectorAll('.lsrc').forEach((a) => { a.onclick = () => { openFile(a.dataset.f, Number(a.dataset.l)); if (isMobile()) showPane('code'); }; });
    } else if (panelTab === 'hints') {
      if (S.interview && !st.solved) { b.innerHTML = '<div class="banner warn">Interview mode is on, so hints are hidden. Turn it off in the top bar to get hints.</div>'; return; }
      b.innerHTML = `<p class="muted" style="font-size:13px">Each card is one bug, named by what goes wrong. Open hints one at a time. Try to need as few as you can.</p>` +
        L.bugs.map((bug, i) => {
          const used = st.hints[i] || 0;
          const shown = bug.hints.slice(0, Math.min(used, bug.hints.length)).map((h) => `<div class="hint">${inline(h)}</div>`).join('');
          const causeShown = used > bug.hints.length;
          return `<div class="bug">
            <div class="bh"><b>BUG ${i + 1}</b><span>${esc(bug.symptom)}</span></div>
            ${used >= 2 || causeShown ? `<div class="file">→ ${esc(bug.file)}</div>` : ''}
            ${shown}
            ${causeShown ? `<div class="cause"><b>Why it breaks:</b> ${inline(bug.cause)}<br><br><b>Fix:</b> ${inline(bug.fix)}</div>` : ''}
            <div class="actions">
              ${used < bug.hints.length ? `<button class="btn sm" data-h="${i}">Hint ${used + 1}/${bug.hints.length}</button>` : ''}
              ${!causeShown ? `<button class="btn sm" data-c="${i}">Show the answer</button>` : `<span class="patb">${esc(bug.pattern)}</span>`}
            </div></div>`;
        }).join('');
      b.querySelectorAll('[data-h]').forEach((x) => { x.onclick = () => { const i = +x.dataset.h; st.hints[i] = (st.hints[i] || 0) + 1; save(); renderPanel(); }; });
      b.querySelectorAll('[data-c]').forEach((x) => { x.onclick = () => { const i = +x.dataset.c; st.hints[i] = L.bugs[i].hints.length + 1; save(); renderPanel(); }; });
    } else if (panelTab === 'notes') {
      b.innerHTML = `<p class="muted" style="font-size:13px">Write down your guesses as you go. It stops you reading the same file twice, and it's what you'd say out loud in an interview.</p>
        <textarea class="notes" id="notes" placeholder="Failing test: ...
What goes wrong: ...
Path: route → controller → service → database
My guess: ...
How I checked: console.log(...) / ran again
Result: ✓ fixed / ✗ next guess"></textarea>`;
      const n = document.getElementById('notes');
      n.value = st.notes || '';
      n.oninput = () => { st.notes = n.value; save(); };
    } else if (panelTab === 'debrief') {
      if (!(st.solved || st.revealed)) {
        b.innerHTML = `<h2>Answers</h2><p class="muted">Opens when all tests pass on Submit, hidden ones included. It explains every bug and shows the fix.</p>
          <div class="banner warn">Really stuck? You can see the answer now, but the level won't count as solved.<br><br><button class="btn sm" id="giveup">Show the answer</button></div>`;
        document.getElementById('giveup').onclick = () => { st.revealed = true; save(); renderTabs(); renderPanel(); };
        return;
      }
      b.innerHTML = `<h2>Answers</h2>
        ${st.solved ? `<div class="banner ok"><b>Solved</b>${st.best != null ? ` in ${fmtTime(st.best)} (target ${L.minutes}:00)` : ''}. Hints opened: ${Object.values(st.hints).reduce((a, x) => a + x, 0)}.</div>` : ''}
        ${L.bugs.map((bug, i) => `<div class="bug"><div class="bh"><b>BUG ${i + 1}</b><span>${esc(bug.symptom)}</span></div>
          <div class="file">→ ${esc(bug.file)} &nbsp;<span class="patb">${esc(bug.pattern)}</span></div>
          <div class="cause">${inline(bug.cause)}<br><br><b>Fix:</b> ${inline(bug.fix)}</div></div>`).join('')}
        <h3>How to spot these faster</h3><ul>${L.lookFor.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>
        <h3>The fix</h3>
        ${Object.keys(L.solution).map((p) => `<div class="diff-h">${esc(p)}</div>${renderDiff(L.files[p], L.solution[p])}`).join('')}
        <button class="btn sm" id="loadsol">Load the fix into the editor</button>`;
      document.getElementById('loadsol').onclick = () => {
        Object.assign(files, L.solution); Object.assign(st.edits, L.solution); save(); refreshEditors(); toast('Fix loaded. Run the tests.');
      };
    }
  }

  function renderResults() {
    if (running && !lastRun) return '<p class="muted">Running…</p>';
    if (!lastRun) return `<p class="muted">Nothing run yet. Press <b>▶ Run tests</b> (or ⌘/Ctrl+Enter). Tip: run the tests first and read every failure before you change any code.</p>`;
    const { visible, hidden, submit } = lastRun;
    const all = lastRun.all, p = all.filter((r) => r.pass).length;
    const st = ls(L.id);
    let html = '';
    if (submit && p === all.length && all.length) {
      html += `<div class="banner ok"><b>All ${all.length} tests pass, hidden ones too.</b> ${st.best != null ? `Time: ${fmtTime(st.best)}. ` : ''}<a href="javascript:void 0" data-go="debrief">See what each bug was →</a></div>`;
    } else if (!submit && visible.length && visible.every((r) => r.pass)) {
      html += `<div class="banner warn">All visible tests pass. Now press <b>Submit</b> to run the hidden tests. They check edge cases you can't see yet.</div>`;
    }
    html += `<div class="sumbar ${p === all.length && all.length ? 'allok' : ''}"><span class="big">${p}/${all.length}</span><span class="bar"><i style="width:${all.length ? (p / all.length) * 100 : 0}%"></i></span><span class="dim mono" style="font-size:12px">${running ? 'running…' : submit ? 'submit' : 'visible'}</span></div>`;
    const row = (r, i, isHidden) => {
      const name = isHidden && S.interview && !st.solved ? `Hidden test #${i + 1}` : r.name;
      const logs = (r.logs || []).slice(0, 40).map((l) => `<div class="${l.type === 'error' ? 'error' : ''}">${esc(l.text)}${l.where ? `<a class="lsrc" data-f="${esc(l.where.replace(/:\d+$/, ''))}" data-l="${l.where.split(':').pop()}">${esc(l.where.split('/').pop())}</a>` : ''}</div>`).join('');
      const body = (r.pass ? '' : `<pre>${esc(isHidden && S.interview && !st.solved ? 'Failed (details hidden in interview mode)' : r.error)}</pre>`) + (logs ? `<div class="logs"><div class="logs-h">Console output (${r.logs.length})</div>${logs}</div>` : '');
      return `<details class="tres ${r.pass ? 'p' : 'f'}" ${!r.pass ? 'open' : ''}><summary><span class="ic">${r.pass ? '✓' : '✗'}</span><span class="nm">${esc(name)}</span><span class="ms">${r.ms != null ? r.ms + 'ms' : ''}</span></summary>${body}</details>`;
    };
    html += `<div class="grp">Visible tests</div>` + visible.map((r, i) => row(r, i, false)).join('');
    if (submit) html += `<div class="grp">Hidden tests</div>` + (hidden.length ? hidden.map((r, i) => row(r, i, true)).join('') : '<p class="muted">Running…</p>');
    return html;
  }

  async function run(submit) {
    if (running) return;
    running = true;
    const st = ls(L.id);
    if (!timer.startedAt && !st.solved && !timer.elapsed) startTimer();
    ['b-run', 'b-submit'].forEach((x) => { document.getElementById(x).disabled = true; });
    if (S.hidePanel && !isMobile()) { S.hidePanel = false; save(); document.getElementById('lv-body').classList.remove('nopanel'); }
    lastRun = { visible: [], hidden: [], all: [], submit };
    panelTab = 'output'; renderTabs(); renderPanel();
    if (isMobile()) showPane('panel');
    const visPaths = Object.keys(L.files).filter((f) => f.startsWith('tests/'));
    const env = Object.assign({}, files, { 'tests/__hidden__.test.js': L.hidden });
    renderConsole();
    const upd = () => { lastRun.all = lastRun.visible.concat(lastRun.hidden); renderTabs(); if (panelTab === 'output') renderPanel(); renderConsole(); };
    try {
      for (const tp of visPaths) await RT.runTests(env, tp, (r) => { lastRun.visible.push(r); upd(); });
      if (submit) await RT.runTests(env, 'tests/__hidden__.test.js', (r) => { lastRun.hidden.push(r); upd(); });
    } catch (e) {
      lastRun.visible.push({ name: 'Runner crashed', pass: false, error: String(e && e.stack || e) });
    }
    running = false;
    ['b-run', 'b-submit'].forEach((x) => { const el = document.getElementById(x); if (el) el.disabled = false; });
    lastRun.all = lastRun.visible.concat(lastRun.hidden);
    if (submit && lastRun.all.length && lastRun.all.every((r) => r.pass) && !st.revealed) {
      const t = Math.round(elapsedSec());
      if (!st.solved || st.best == null || t < st.best) st.best = t;
      st.solved = true;
      stopTimer();
      save();
      toast('🎉 Solved! All tests pass');
    } else if (submit && lastRun.all.every((r) => r.pass) && st.revealed) {
      toast('All tests pass, but you saw the answer, so it does not count as solved');
    }
    renderTabs(); renderPanel(); renderConsole();
    const nLogs = lastRun.all.reduce((n, r) => n + ((r.logs && r.logs.length) || 0), 0);
    if (nLogs) toggleConsole(true);
  }

  function showDiffModal() {
    const changed = Object.keys(L.files).filter((p) => files[p] !== L.files[p]);
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal"><div class="mh"><h3>Your changes (${changed.length} file${changed.length === 1 ? '' : 's'})</h3><button class="btn sm" id="mclose">Close</button></div>
      <div class="mb">${changed.length ? `<p class="muted" style="font-size:13px;margin-top:0">Check every changed line before you submit. Did you leave a console.log? Change something that wasn't broken? Change what the API returns?</p>` + changed.map((p) => `<div class="diff-h">${esc(p)}</div>${renderDiff(L.files[p], files[p])}`).join('') : '<p class="muted">No changes yet.</p>'}</div>
      <div class="mf">${changed.length ? '<button class="btn sm" id="mresetall">Reset ALL files</button>' : ''}</div></div>`;
    document.body.appendChild(bg);
    const close = () => bg.remove();
    bg.onclick = (e) => { if (e.target === bg) close(); };
    bg.querySelector('#mclose').onclick = close;
    const ra = bg.querySelector('#mresetall');
    if (ra) {
      let armed = false;
      ra.onclick = () => {
        if (!armed) { armed = true; ra.textContent = 'Click again to confirm'; return; }
        files = Object.assign({}, L.files); ls(L.id).edits = {}; save(); refreshEditors(); close(); toast('All files reset');
      };
    }
  }

  // ---------------- router ----------------
  function route() {
    const h = (location.hash || '#home').slice(1);
    if (timer && timer.startedAt) stopTimer();
    if (h.startsWith('level-')) renderLevel(h.slice(6));
    else if (h === 'playbook') renderPlaybook();
    else renderHome();
    if (!h.startsWith('level-') && h !== 'playbook') window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', () => { if (timer && timer.startedAt && L) { ls(L.id).elapsed = timer.elapsed + (Date.now() - timer.startedAt); save(); } });
  route();
})();
