import { Fragment } from 'react';
import { LEVELS, type LevelSummary } from '../levels';
import { DIFFICULTIES } from '../levels/types';
import { emptyProgress, update, useStore, type Filter, type LevelProgress } from '../state/store';
import { DIFF_LABEL, fmtTime } from '../ui/format';
import { Nav } from '../ui/Nav';
import { Icon } from '../ui/Icon';
import './pages.css';

const DEFAULT_FILTER: Filter = { diff: 'all', status: 'all', q: '' };

// "Based on a real Amazon test: …" becomes a badge, so the card text is about the app.
const REAL = /^Based on a real Amazon test[^:]*:\s*/;
const summary = (l: LevelSummary) => {
  const t = l.tagline.replace(REAL, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Home: intro, filters and every level grouped by difficulty. */
export function Home() {
  const progress = useStore((s) => s.levels);
  const f = useStore((s) => s.filter) ?? DEFAULT_FILTER;
  const interview = useStore((s) => s.interview);
  const lastId = useStore((s) => s.lastLevel);
  const ls = (id: string): LevelProgress => progress[id] ?? emptyProgress();

  const solved = LEVELS.filter((l) => ls(l.id).solved).length;
  const working = LEVELS.filter((l) => ls(l.id).started && !ls(l.id).solved).length;
  // Continue the level you were on; otherwise the first one you haven't solved.
  const last = LEVELS.find((l) => l.id === lastId && !ls(l.id).solved);
  const next = last ?? LEVELS.find((l) => !ls(l.id).solved) ?? LEVELS[0];
  const ctaVerb = last ? 'Continue' : solved ? 'Next' : 'Start';
  const setFilter = (patch: Partial<Filter>) => update({ filter: { ...f, ...patch } });

  const q = f.q.trim().toLowerCase();
  const match = (l: LevelSummary) => {
    const st = ls(l.id);
    if (f.diff !== 'all' && l.difficulty !== f.diff) return false;
    if (f.status === 'unsolved' && st.solved) return false;
    if (q) {
      const hay = [l.title, l.tagline].join(' ').toLowerCase();
      if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  };

  const groups = DIFFICULTIES.map((d) => {
    const all = LEVELS.filter((l) => l.difficulty === d);
    const shown = all.filter(match);
    if (!shown.length) return null;
    const done = all.filter((l) => ls(l.id).solved).length;
    return (
      <Fragment key={d}>
        <div className="sec-h">
          <span className={`pill ${d}`}>{DIFF_LABEL[d]}</span>
          <span className="dim mono" style={{ fontSize: 12 }}>
            {done}/{all.length} solved
          </span>
        </div>
        <div className="grid">
          {shown.map((l) => (
            <Card key={l.id} level={l} progress={ls(l.id)} />
          ))}
        </div>
      </Fragment>
    );
  }).filter(Boolean);

  const randomUnsolved = () => {
    const pool = LEVELS.filter((l) => !ls(l.id).solved && (f.diff === 'all' || l.difficulty === f.diff));
    const from = pool.length ? pool : LEVELS;
    location.hash = `#/level/${from[Math.floor(Math.random() * from.length)].id}`;
  };

  const chip = <K extends 'diff' | 'status'>(key: K, val: Filter[K], label: string) => (
    <button className={`chip ${f[key] === val ? 'on' : ''}`} onClick={() => setFilter({ [key]: val })}>
      {label}
    </button>
  );

  return (
    <>
      <Nav active="home" />
      <div className="wrap">
        <section className="hero">
          <h1 className="balance">
            Someone else's code. Failing tests. <em>A clock.</em>
          </h1>
          <p>Practise the Amazon bug-fixing round: find the bugs, fix them, pass the hidden tests.</p>
          <div className="cta">
            <a className="btn pri" href={`#/level/${next.id}`}>
              <Icon name="play" size={14} /> {ctaVerb}: {next.title.split(':')[0]}
            </a>
            <a className="btn" href="#/guide">
              How to pass
            </a>
          </div>
        </section>

        {interview && (
          <div className="banner warn mode-note">
            <b>Interview mode is on.</b> No hints or tips until you pass, like the real test.{' '}
            <button className="linkish" onClick={() => update({ interview: false })}>
              Turn off
            </button>
          </div>
        )}

        <div className="sec-h">
          <h2>Levels</h2>
          <div className="progress" title={`${solved} solved, ${working} in progress`}>
            <i style={{ width: `${(solved / LEVELS.length) * 100}%` }} />
            <i className="wip" style={{ width: `${(working / LEVELS.length) * 100}%` }} />
          </div>
          <span className="dim mono" style={{ fontSize: 12 }}>
            {solved}/{LEVELS.length} solved{working ? ` · ${working} in progress` : ''}
          </span>
        </div>

        <div className="filters">
          {chip('diff', 'all', 'All')}
          {chip('diff', 'easy', 'Easy')}
          {chip('diff', 'medium', 'Medium')}
          {chip('diff', 'hard', 'Hard')}
          <span className="fsep" />
          <button
            className={`chip ${f.status === 'unsolved' ? 'on' : ''}`}
            onClick={() => setFilter({ status: f.status === 'unsolved' ? 'all' : 'unsolved' })}
          >
            Hide solved
          </button>
          <input
            className="fsearch"
            placeholder="Search…"
            aria-label="Search levels"
            value={f.q}
            onChange={(e) => setFilter({ q: e.target.value })}
          />
          <button className="btn sm" onClick={randomUnsolved}>
            <Icon name="shuffle" size={14} /> Random
          </button>
        </div>

        <div id="groups">
          {groups.length ? (
            groups
          ) : (
            <div className="empty">
              <p>
                No levels match{q ? <> “{f.q.trim()}”</> : ' these filters'}. Search looks at level names and what goes
                wrong in them.
              </p>
              <button className="btn sm" onClick={() => update({ filter: DEFAULT_FILTER })}>
                Show all levels
              </button>
            </div>
          )}
        </div>
        <footer>Everything runs in your browser. Progress is saved in this browser only.</footer>
      </div>
    </>
  );
}

function Card({ level: l, progress: st }: { level: LevelSummary; progress: LevelProgress }) {
  return (
    <a className="card" href={`#/level/${l.id}`}>
      {st.solved ? (
        <span className="status ok">
          <Icon name="check" size={13} /> {st.best != null ? fmtTime(st.best) : 'solved'}
        </span>
      ) : st.started ? (
        <span className="status wip">In progress</span>
      ) : null}
      <h3>{l.title}</h3>
      <p title={summary(l)}>{summary(l)}</p>
      <div className="meta">
        <span>{l.minutes} min</span>
        <span>{l.bugCount} bugs</span>
        {REAL.test(l.tagline) && <span className="real">Real test</span>}
      </div>
    </a>
  );
}
