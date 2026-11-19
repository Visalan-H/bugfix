import { Fragment } from 'react';
import { LEVELS, type LevelSummary } from '../levels';
import { DIFFICULTIES } from '../levels/types';
import { emptyProgress, update, useStore, type Filter, type LevelProgress } from '../state/store';
import { DIFF_LABEL, fmtTime } from '../ui/format';
import { Nav } from '../ui/Nav';

const DEFAULT_FILTER: Filter = { diff: 'all', status: 'all', q: '' };

/** Home: intro, filters and every level grouped by difficulty. */
export function Home() {
  const progress = useStore((s) => s.levels);
  const f = useStore((s) => s.filter) ?? DEFAULT_FILTER;
  const ls = (id: string): LevelProgress => progress[id] ?? emptyProgress();

  const solved = LEVELS.filter((l) => ls(l.id).solved).length;
  const next = LEVELS.find((l) => !ls(l.id).solved) ?? LEVELS[0];
  const setFilter = (patch: Partial<Filter>) => update({ filter: { ...f, ...patch } });

  const q = f.q.trim().toLowerCase();
  const match = (l: LevelSummary) => {
    const st = ls(l.id);
    if (f.diff !== 'all' && l.difficulty !== f.diff) return false;
    if (f.status === 'unsolved' && st.solved) return false;
    if (q) {
      const hay = [l.title, l.tagline, ...l.tags, ...l.bugs.map((b) => b.pattern)].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
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
          <h1>
            Someone else's code. Failing tests. <em>A clock.</em>
          </h1>
          <p>Practise the Amazon bug-fixing round: find the bugs, fix them, pass the hidden tests.</p>
          <div className="cta">
            <a className="btn pri" href={`#/level/${next.id}`}>
              ▶ {solved ? 'Continue' : 'Start'}: {next.title.split(':')[0]}
            </a>
            <a className="btn" href="#/guide">
              How to pass
            </a>
          </div>
        </section>

        <div className="sec-h">
          <h2>Levels</h2>
          <div className="progress" title={`${solved}/${LEVELS.length} solved`}>
            <i style={{ width: `${(solved / LEVELS.length) * 100}%` }} />
          </div>
          <span className="dim mono" style={{ fontSize: 12 }}>
            {solved}/{LEVELS.length} solved
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
            🎲 Random
          </button>
        </div>

        <div id="groups">
          {groups.length ? groups : <p className="muted">No levels match. Try clearing the filters.</p>}
        </div>
        <footer>Everything runs in your browser. Progress is saved here only.</footer>
      </div>
    </>
  );
}

function Card({ level: l, progress: st }: { level: LevelSummary; progress: LevelProgress }) {
  return (
    <a className="card" href={`#/level/${l.id}`}>
      {st.solved ? (
        <span className="status ok">✓ {st.best != null ? fmtTime(st.best) : 'solved'}</span>
      ) : st.started ? (
        <span className="status wip">in progress</span>
      ) : null}
      <h3>{l.title}</h3>
      <p>{l.tagline}</p>
      <div className="meta">
        <span>{l.minutes} min</span>
        <span>{l.bugs.length} bugs</span>
      </div>
    </a>
  );
}
