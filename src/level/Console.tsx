import { useRef } from 'react';
import type { Files, LogEntry, TestResult } from '../runner/sandbox/types';
import { splitWhere } from '../ui/format';
import type { RunState } from './contracts';
import { Icon } from '../ui/Icon';

interface Group {
  key: string;
  name: string;
  pass: boolean;
  hidden: boolean;
  logs: LogEntry[];
}

interface Props {
  run: RunState | null;
  files: Files;
  /** Hide hidden test names (interview mode and not solved yet). */
  maskHidden: boolean;
  open: boolean;
  height: number;
  query: string;
  onToggle(open?: boolean): void;
  onResize(height: number): void;
  onQuery(q: string): void;
  onClear(): void;
  openFile(path: string, line: number): void;
}

const ICON: Record<string, string> = { log: '›', info: '›', debug: '›', warn: '⚠', error: '✖' };

/** Everything the code logged in the last run, grouped by test. */
export function Console(p: Props) {
  const box = useRef<HTMLDivElement>(null);

  const groups: Group[] | null = p.run
    ? [...p.run.visible.map((r, i) => group(r, i, false)), ...p.run.hidden.map((r, i) => group(r, i, true))].filter(
        (g) => g.logs.length,
      )
    : null;
  function group(r: TestResult, i: number, hidden: boolean): Group {
    return {
      key: `${hidden ? 'h' : 'v'}${i}`,
      name: hidden && p.maskHidden ? `Hidden test #${i + 1}` : r.name,
      pass: r.pass,
      hidden,
      logs: r.logs || [],
    };
  }
  const all = groups ? groups.flatMap((g) => g.logs) : [];
  const errs = all.filter((l) => l.type === 'error').length;
  const q = p.query.toLowerCase();

  const link = (where: string, thrown: boolean) => {
    const { file, line } = splitWhere(where);
    if (p.files[file] === undefined) return null;
    const name = `${file.split('/').pop()}:${line}`;
    return (
      <a
        className={`con-src ${thrown ? 'thrown' : ''}`}
        title={thrown ? 'Open where the error was thrown' : `Open ${where}`}
        onClick={() => p.openFile(file, line)}
      >
        {thrown ? `← thrown at ${name}` : name}
      </a>
    );
  };

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!p.open) p.onToggle(true);
    const y0 = e.clientY;
    const h0 = box.current!.getBoundingClientRect().height;
    let h = h0;
    const move = (ev: PointerEvent) => {
      h = Math.max(90, Math.min(window.innerHeight * 0.7, h0 - (ev.clientY - y0)));
      box.current!.style.setProperty('--conh', h + 'px');
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      p.onResize(Math.round(h));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  let body: React.ReactNode;
  if (!groups) {
    body = (
      <div className="con-empty">
        <code>console.log</code> output shows here after a run.
      </div>
    );
  } else if (!groups.length) {
    body = <div className="con-empty">Nothing logged.</div>;
  } else {
    const shown = groups
      .map((g) => ({
        g,
        lines: g.logs.filter(
          (l) => !q || l.text.toLowerCase().includes(q) || (l.where || '').toLowerCase().includes(q),
        ),
      }))
      .filter((x) => x.lines.length);
    body = shown.length ? (
      shown.map(({ g, lines }) => (
        <div key={g.key}>
          <div className={`con-grp ${g.pass ? 'p' : 'f'}`}>
            <span className="ic">
              <Icon name={g.pass ? 'check' : 'x'} size={13} />
            </span>
            {g.hidden && <span className="hid">hidden</span>}
            {g.name}
          </div>
          {lines.map((l, i) => (
            <div key={i} className={`con-line ${l.type}`}>
              <span className="con-type">{ICON[l.type] ?? '›'}</span>
              <span className="con-text">
                {l.text}
                {l.thrownAt && <> {link(l.thrownAt, true)}</>}
              </span>
              {l.where && link(l.where, false)}
            </div>
          ))}
        </div>
      ))
    ) : (
      <div className="con-empty">No lines match the filter.</div>
    );
  }

  return (
    <div
      ref={box}
      className={`console ${p.open ? 'open' : ''}`}
      style={{ '--conh': `${p.height}px` } as React.CSSProperties}
    >
      <div className="con-resize" title="Drag to resize" onPointerDown={startResize} />
      <div className="con-head">
        <button className="con-title" title="Show or hide (Ctrl+`)" onClick={() => p.onToggle()}>
          <span className="chev">
            <Icon name={p.open ? 'chevronDown' : 'chevronRight'} size={14} />
          </span>{' '}
          Console
        </button>
        <span className={`con-badge ${all.length ? 'has' : ''}`}>
          {all.length} {all.length === 1 ? 'line' : 'lines'}
        </span>
        {errs > 0 && (
          <span className="con-badge err">
            {errs} error{errs === 1 ? '' : 's'}
          </span>
        )}
        <span className="con-sp" />
        <input
          className="con-filter"
          placeholder="Filter logs…"
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
        />
        <button className="eb" title="Clear the console" onClick={p.onClear}>
          Clear
        </button>
      </div>
      <div className="con-body">{body}</div>
    </div>
  );
}
