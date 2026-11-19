import type { PanelProps } from '../level/contracts';
import type { TestResult } from '../runner/sandbox/types';
import { fmtTime, splitWhere } from '../ui/format';
import { Icon } from '../ui/Icon';

const MAX_LOGS = 40;

function Row({
  r,
  name,
  masked,
  openFile,
}: {
  r: TestResult;
  name: string;
  masked: boolean;
  openFile: PanelProps['openFile'];
}) {
  const logs = (r.logs || []).slice(0, MAX_LOGS);
  return (
    <details className={`tres ${r.pass ? 'p' : 'f'}`} open={!r.pass}>
      <summary>
        <span className="ic">
          <Icon name={r.pass ? 'check' : 'x'} size={14} />
        </span>
        <span className="nm">{name}</span>
        <span className="ms">{r.ms != null ? r.ms + 'ms' : ''}</span>
      </summary>
      {!r.pass && <pre>{masked ? 'Failed (details hidden in interview mode)' : r.error}</pre>}
      {logs.length > 0 && (
        <div className="logs">
          <div className="logs-h">Console output ({r.logs.length})</div>
          {logs.map((l, i) => {
            const at = l.where ? splitWhere(l.where) : null;
            return (
              <div key={i} className={l.type === 'error' ? 'error' : ''}>
                {l.text}
                {at && l.where && (
                  <a className="lsrc" title={`Open ${l.where}`} onClick={() => openFile(at.file, at.line)}>
                    {l.where.split('/').pop()}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </details>
  );
}

export function ResultsTab({ run, progress, interview, setTab, openFile }: PanelProps) {
  if (!run)
    return (
      <p className="muted">
        Nothing run yet. Press <b>Run tests</b> (or ⌘/Ctrl+Enter). Tip: run the tests first and read every failure
        before you change any code.
      </p>
    );
  const { visible, hidden, submit, running } = run;
  const all = [...visible, ...hidden];
  const p = all.filter((r) => r.pass).length;
  const allOk = all.length > 0 && p === all.length;
  const hideHidden = interview && !progress.solved;
  return (
    <>
      {submit && allOk && !running && (
        <div className="banner ok">
          <b>All {all.length} tests pass, hidden ones too.</b>{' '}
          {progress.best != null ? `Time: ${fmtTime(progress.best)}. ` : ''}
          <a href="#" onClick={(e) => (e.preventDefault(), setTab('debrief'))}>
            See what each bug was →
          </a>
        </div>
      )}
      {!submit && !running && visible.length > 0 && visible.every((r) => r.pass) && (
        <div className="banner warn">
          All visible tests pass. Now press <b>Submit</b> to run the hidden tests. They check edge cases you can't see
          yet.
        </div>
      )}
      <div className={`sumbar ${allOk ? 'allok' : ''}`}>
        <span className="big">
          {p}/{all.length}
        </span>
        <span className="bar">
          <i style={{ width: `${all.length ? (p / all.length) * 100 : 0}%` }} />
        </span>
        <span className="dim mono" style={{ fontSize: 12 }}>
          {running ? 'running…' : submit ? 'submit' : 'visible'}
        </span>
      </div>
      <div className="grp">Visible tests</div>
      {visible.map((r, i) => (
        <Row key={i} r={r} name={r.name} masked={false} openFile={openFile} />
      ))}
      {running && !visible.length && <p className="muted">Running…</p>}
      {submit && (
        <>
          <div className="grp">Hidden tests</div>
          {hidden.length ? (
            hidden.map((r, i) => (
              <Row
                key={i}
                r={r}
                name={hideHidden ? `Hidden test #${i + 1}` : r.name}
                masked={hideHidden}
                openFile={openFile}
              />
            ))
          ) : (
            <p className="muted">{running ? 'Running…' : 'No hidden tests ran.'}</p>
          )}
        </>
      )}
    </>
  );
}
