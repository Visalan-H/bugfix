import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { fileUri, languageOf, monaco } from '../editor/monaco';
import { loadLevel, loadSecrets, type LoadedLevel } from '../levels';
import { HIDDEN_TEST_PATH, isTestFile } from '../levels/types';
import { DiffModal, SidePanel } from '../panels';
import { runInWorker, type RunHandle, type TestFileRun } from '../runner/client';
import type { Files, TestResult } from '../runner/sandbox/types';
import { levelProgress, update, updateLevel, useLevelProgress, useStore, type PaneLayout } from '../state/store';
import { DIFF_LABEL, MOBILE_QUERY } from '../ui/format';
import { toast } from '../ui/toast';
import { Console } from './Console';
import type { PanelTab, RunState } from './contracts';
import { EditorPane } from './EditorPane';
import { FileTree } from './FileTree';
import { defaultFile, firstTestFile } from './files';
import { TimerDisplay, useTimer } from './timer';
import './level.css';

type MobilePane = 'files' | 'code' | 'panel';
type Ed = monaco.editor.IStandaloneCodeEditor;

const subscribeMq = (l: () => void) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', l);
  return () => mq.removeEventListener('change', l);
};
const useMobile = () => useSyncExternalStore(subscribeMq, () => window.matchMedia(MOBILE_QUERY).matches);

/** The level page once its files are loaded. */
export default function LevelView({ id }: { id: string }) {
  const [level, setLevel] = useState<LoadedLevel | null>(null);
  useEffect(() => {
    let live = true;
    loadLevel(id).then((L) => {
      if (!live) return;
      if (!L) location.hash = '#/';
      else setLevel(L);
    });
    return () => {
      live = false;
    };
  }, [id]);
  if (!level) return <div className="lv-loading">Loading the level…</div>;
  return <Level level={level} />;
}

function Level({ level }: { level: LoadedLevel }) {
  const id = level.id;
  const original = level.files;
  const progress = useLevelProgress(id);
  const interview = useStore((s) => s.interview);
  const hideFiles = useStore((s) => !!s.hideFiles);
  const hidePanel = useStore((s) => !!s.hidePanel);
  const consoleOpen = useStore((s) => s.consoleOpen !== false);
  const consoleH = useStore((s) => s.consoleH || 210);
  const consoleQ = useStore((s) => s.consoleQ || '');
  const mobile = useMobile();

  const [files, setFiles] = useState<Files>(() => ({ ...original, ...levelProgress(id).edits }));

  const timer = useTimer(id, levelProgress(id).elapsed || 0);
  const { start: startTimer, isRunning: timerRunning } = timer;

  // ---------- models: one per file, shared by both panes ----------
  const [models, setModels] = useState<Map<string, monaco.editor.ITextModel> | null>(null);
  useEffect(() => {
    const onEdit = (path: string, value: string) => {
      setFiles((prev) => ({ ...prev, [path]: value }));
      updateLevel(id, (p) => {
        const edits = { ...p.edits };
        if (value === original[path]) delete edits[path];
        else edits[path] = value;
        return { edits, started: true };
      });
      if (!timerRunning() && !levelProgress(id).solved) startTimer();
    };
    const start = { ...original, ...levelProgress(id).edits };
    const map = new Map<string, monaco.editor.ITextModel>();
    const subs: monaco.IDisposable[] = [];
    for (const [path, text] of Object.entries(start)) {
      monaco.editor.getModel(fileUri(path))?.dispose();
      const m = monaco.editor.createModel(text, languageOf(path), fileUri(path));
      map.set(path, m);
      subs.push(m.onDidChangeContent(() => onEdit(path, m.getValue())));
    }
    // Monaco models are outside React; keep them in state so the editors render once they exist.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModels(map);
    return () => {
      subs.forEach((s) => s.dispose());
      map.forEach((m) => m.dispose());
    };
  }, [id, original, startTimer, timerRunning]);

  /** Replaces a file's text as one undoable edit. */
  const setText = useCallback(
    (path: string, text: string) => {
      const m = models?.get(path);
      if (!m || m.getValue() === text) return;
      m.pushEditOperations([], [{ range: m.getFullModelRange(), text }], () => null);
    },
    [models],
  );

  // ---------- panes (tabs + split) ----------
  const [panes, setPanes] = useState<PaneLayout[]>(() => {
    const def = defaultFile(original);
    const saved = levelProgress(id).layout?.panes;
    let ps = (
      saved?.length ? saved : [{ tabs: [def, firstTestFile(original)].filter(Boolean) as string[], active: def }]
    ).map((p) => {
      const tabs = (p.tabs || []).filter((t) => t in original);
      if (!tabs.length) tabs.push(def);
      return { tabs, active: tabs.includes(p.active) ? p.active : tabs[0] };
    });
    if (window.matchMedia(MOBILE_QUERY).matches) ps = ps.slice(0, 1);
    return ps;
  });
  const [focus, setFocus] = useState(0);
  const shownPanes = mobile ? panes.slice(0, 1) : panes;
  const focusIdx = Math.min(focus, shownPanes.length - 1);
  const curFile = shownPanes[focusIdx].active;

  useEffect(() => {
    updateLevel(id, { layout: { panes } });
  }, [id, panes]);

  const editors = useRef<(Ed | null)[]>([]);
  const pendingReveal = useRef<{ pane: number; path: string; line: number } | null>(null);

  const activate = (i: number, f: string) => {
    setPanes((ps) => ps.map((p, j) => (j === i ? { ...p, active: f } : p)));
    setFocus(i);
  };

  const [mobilePane, setMobilePane] = useState<MobilePane>('code');

  const openFile = useCallback(
    (f: string, line?: number) => {
      if (!(f in original)) return;
      const i = focusIdx;
      setPanes((ps) =>
        ps.map((p, j) => {
          if (j !== i) return p;
          const tabs = p.tabs.includes(f)
            ? p.tabs
            : [...p.tabs.slice(0, p.tabs.indexOf(p.active) + 1), f, ...p.tabs.slice(p.tabs.indexOf(p.active) + 1)];
          return { tabs, active: f };
        }),
      );
      if (line) pendingReveal.current = { pane: i, path: f, line };
      if (mobile) setMobilePane('code');
    },
    [original, focusIdx, mobile],
  );

  // Reveal + flash a line once the pane shows the right file.
  useEffect(() => {
    let tries = 0;
    let raf = 0;
    const attempt = () => {
      const r = pendingReveal.current;
      if (!r) return;
      const ed = editors.current[r.pane];
      if (ed && ed.getModel()?.uri.toString() === fileUri(r.path).toString()) {
        pendingReveal.current = null;
        flashLine(ed, r.line);
      } else if (tries++ < 60) raf = requestAnimationFrame(attempt);
    };
    attempt();
    return () => cancelAnimationFrame(raf);
  });

  const closeTab = (i: number, f: string) => {
    const p = panes[i];
    const idx = p.tabs.indexOf(f);
    if (idx === -1) return;
    const tabs = p.tabs.filter((t) => t !== f);
    if (!tabs.length) {
      if (panes.length > 1) return unsplit(i);
      tabs.push(defaultFile(original));
    }
    const active = p.active === f ? tabs[Math.min(idx, tabs.length - 1)] : p.active;
    setPanes(panes.map((q, j) => (j === i ? { tabs, active } : q)));
  };

  const split = () => {
    if (panes.length > 1 || mobile) return;
    const other = isTestFile(curFile) ? defaultFile(original) : (firstTestFile(original) ?? curFile);
    setPanes([...panes, { tabs: [other], active: other }]);
    setFocus(1);
  };
  function unsplit(i = 1) {
    if (panes.length < 2) return;
    setPanes(panes.filter((_, j) => j !== i));
    editors.current = editors.current.filter((_, j) => j !== i);
    setFocus(0);
  }

  // ---------- running tests ----------
  const [run, setRun] = useState<RunState | null>(null);
  const [tab, setTab] = useState<PanelTab>('task');
  const handle = useRef<RunHandle | null>(null);
  useEffect(() => () => handle.current?.cancel(), []);

  const runTests = async (submit: boolean) => {
    if (run?.running) return;
    const st = levelProgress(id);
    const t = timer;
    if (!t.running && !st.solved && !t.hasTime()) t.start();
    if (hidePanel && !mobile) update({ hidePanel: false });
    setTab('output');
    if (mobile) setMobilePane('panel');

    const env: Files = { ...files };
    const plan: TestFileRun[] = Object.keys(original)
      .filter(isTestFile)
      .map((path) => ({ path, group: 'visible' }));
    setRun({ submit, running: true, visible: [], hidden: [] });
    if (submit) {
      env[HIDDEN_TEST_PATH] = (await loadSecrets(id)).hidden;
      plan.push({ path: HIDDEN_TEST_PATH, group: 'hidden' });
    }
    const got: TestResult[] = [];
    handle.current = runInWorker(env, plan, (group, r) => {
      got.push(r);
      setRun((prev) => prev && { ...prev, [group]: [...prev[group], r] });
    });
    await handle.current.done;
    handle.current = null;
    setRun((prev) => prev && { ...prev, running: false });

    const allPass = got.length > 0 && got.every((r) => r.pass);
    const now = levelProgress(id);
    if (submit && allPass && !now.revealed) {
      timer.stop();
      const secs = Math.round(timer.elapsedMs() / 1000);
      updateLevel(id, (p) => ({ solved: true, best: !p.solved || p.best == null || secs < p.best ? secs : p.best }));
      toast('🎉 Solved! All tests pass');
    } else if (submit && allPass && now.revealed) {
      toast('All tests pass, but you saw the answer, so it does not count as solved');
    }
    if (got.some((r) => r.logs?.length)) update({ consoleOpen: true });
  };

  // ---------- actions ----------
  const resetFile = () => {
    const f = curFile;
    const name = f.split('/').pop();
    if (original[f] === undefined || files[f] === original[f]) return toast('Nothing to reset in ' + name);
    setText(f, original[f]);
    toast('Reset ' + name);
  };
  const resetAll = () => {
    for (const f of Object.keys(original)) if (files[f] !== original[f]) setText(f, original[f]);
    toast('All files reset');
  };
  const loadFix = (solution: Files) => {
    for (const [f, text] of Object.entries(solution)) setText(f, text);
    toast('Fix loaded. Run the tests.');
  };
  const [showDiff, setShowDiff] = useState(false);
  const toggleConsole = (open?: boolean) => update((s) => ({ consoleOpen: open ?? s.consoleOpen === false }));

  // ---------- keyboard ----------
  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  const onKey = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    const stop = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    if (mod && (e.key === 'Enter' || e.key === 's' || e.key === 'S')) {
      stop();
      runTests(false);
    } else if (mod && e.code === 'Backquote') {
      stop();
      toggleConsole();
    } else if (e.altKey && !mod && e.code === 'KeyW') {
      stop();
      closeTab(focusIdx, curFile);
    } else if (e.altKey && !mod && e.code === 'Backslash') {
      stop();
      if (panes.length > 1) unsplit();
      else split();
    } else if (e.altKey && !mod && (e.code === 'BracketRight' || e.code === 'BracketLeft')) {
      stop();
      const p = shownPanes[focusIdx];
      const n = (p.tabs.indexOf(p.active) + (e.code === 'BracketRight' ? 1 : -1) + p.tabs.length) % p.tabs.length;
      activate(focusIdx, p.tabs[n]);
    }
  };
  useLayoutEffect(() => {
    keys.current = onKey;
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, []);

  const openTabs = useMemo(() => new Set(shownPanes.flatMap((p) => p.tabs)), [shownPanes]);
  const running = !!run?.running;

  return (
    <div className="lv">
      <header className="lv-top">
        <a className="back" href="#/" title="All levels">
          ←
        </a>
        <button
          className="tb opt ic"
          title="Show or hide the file list"
          onClick={() => update({ hideFiles: !hideFiles })}
        >
          ☰
        </button>
        <div className="lv-title">
          <span className={`pill ${level.difficulty}`}>{DIFF_LABEL[level.difficulty]}</span>
          <b>{level.title}</b>
        </div>
        <TimerDisplay minutes={level.minutes} elapsedMs={timer.elapsedMs} running={timer.running} />
        <button className="tb" onClick={timer.toggle}>
          {timer.running ? 'Pause' : timer.hasTime() ? 'Resume' : 'Start'}
        </button>
        <div className="sp" />
        <button className="tb opt" title="See every line you changed" onClick={() => setShowDiff(true)}>
          Diff
        </button>
        <button className="tb opt" title="Undo all changes to the file you're looking at" onClick={resetFile}>
          Reset file
        </button>
        <button className="tb run" title="Ctrl/⌘ + Enter" disabled={running} onClick={() => runTests(false)}>
          ▶ Run tests
        </button>
        <button
          className="tb sub"
          title="Runs the tests you can see plus the hidden ones"
          disabled={running}
          onClick={() => runTests(true)}
        >
          Submit
        </button>
        <button
          className="tb opt ic"
          title="Show or hide the Task and Results panel"
          onClick={() => update({ hidePanel: !hidePanel })}
        >
          ◨
        </button>
      </header>
      <nav className="mtabs">
        {(
          [
            ['files', 'Files'],
            ['code', 'Code'],
            ['panel', 'Task / Results'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} className={mobilePane === k ? 'on' : ''} onClick={() => setMobilePane(k)}>
            {label}
          </button>
        ))}
      </nav>
      <div className={`lv-body ${hideFiles ? 'nofiles' : ''} ${hidePanel ? 'nopanel' : ''}`}>
        <aside className={`pane files ${mobilePane === 'files' ? 'show' : ''}`}>
          <FileTree
            original={original}
            files={files}
            active={curFile}
            openTabs={openTabs}
            onOpen={(f) => {
              openFile(f);
              if (mobile) setMobilePane('code');
            }}
          />
        </aside>
        <main className={`pane code ${mobilePane === 'code' ? 'show' : ''}`}>
          <div className="editors">
            {models &&
              shownPanes.map((p, i) => (
                <EditorPane
                  key={i}
                  index={i}
                  pane={p}
                  focused={i === focusIdx}
                  paneCount={shownPanes.length}
                  canSplit={!mobile}
                  original={original}
                  files={files}
                  onFocus={() => focusIdx !== i && setFocus(i)}
                  onActivate={(f) => activate(i, f)}
                  onClose={(f) => closeTab(i, f)}
                  onSplit={split}
                  onClosePane={() => unsplit(i)}
                  onMount={(ed) => {
                    editors.current[i] = ed;
                  }}
                />
              ))}
          </div>
          <Console
            run={run}
            files={files}
            maskHidden={interview && !progress.solved}
            open={consoleOpen}
            height={consoleH}
            query={consoleQ}
            onToggle={toggleConsole}
            onResize={(h) => update({ consoleH: h })}
            onQuery={(q) => update({ consoleQ: q })}
            onClear={() =>
              setRun(
                (r) =>
                  r && {
                    ...r,
                    visible: r.visible.map((x) => ({ ...x, logs: [] })),
                    hidden: r.hidden.map((x) => ({ ...x, logs: [] })),
                  },
              )
            }
            openFile={openFile}
          />
        </main>
        <section className={`pane panel ${mobilePane === 'panel' ? 'show' : ''}`}>
          <SidePanel
            level={level}
            files={files}
            progress={progress}
            interview={interview}
            run={run}
            tab={tab}
            setTab={setTab}
            openFile={openFile}
            loadFix={loadFix}
          />
        </section>
      </div>
      {showDiff && (
        <DiffModal
          level={level}
          files={files}
          onResetAll={() => {
            resetAll();
            setShowDiff(false);
          }}
          onClose={() => setShowDiff(false)}
        />
      )}
    </div>
  );
}

/** Scrolls a line into the middle of the editor and flashes it. */
function flashLine(ed: Ed, line: number) {
  const model = ed.getModel();
  if (!model) return;
  const n = Math.max(1, Math.min(line, model.getLineCount()));
  ed.revealLineInCenter(n);
  ed.setSelection(new monaco.Selection(n, 1, n, model.getLineMaxColumn(n)));
  ed.focus();
  const deco = ed.createDecorationsCollection([
    {
      range: new monaco.Range(n, 1, n, 1),
      options: { isWholeLine: true, className: 'line-flash', marginClassName: 'line-flash-margin' },
    },
  ]);
  setTimeout(() => deco.clear(), 1600);
}
