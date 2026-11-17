import type { PanelProps } from '../level/contracts';
import { useSecrets } from '../levels/useSecrets';
import { updateLevel } from '../state/store';
import { Diff } from '../ui/Diff';
import { fmtTime } from '../ui/format';
import { Inline } from './Html';

export function AnswersTab({ level, progress, loadFix }: PanelProps) {
  const unlocked = progress.solved || progress.revealed;
  const secrets = useSecrets(level.id, unlocked);

  if (!unlocked)
    return (
      <>
        <h2>Answers</h2>
        <p className="muted">
          Opens when all tests pass on Submit, hidden ones included. It explains every bug and shows the fix.
        </p>
        <div className="banner warn">
          Really stuck? You can see the answer now, but the level won't count as solved.
          <br />
          <br />
          <button className="btn sm" onClick={() => updateLevel(level.id, { revealed: true })}>
            Show the answer
          </button>
        </div>
      </>
    );
  if (!secrets) return <p className="muted">Loading…</p>;

  const hintsOpened = Object.values(progress.hints).reduce((a, x) => a + x, 0);
  return (
    <>
      <h2>Answers</h2>
      {progress.solved && (
        <div className="banner ok">
          <b>Solved</b>
          {progress.best != null ? ` in ${fmtTime(progress.best)} (target ${level.minutes}:00)` : ''}. Hints opened:{' '}
          {hintsOpened}.
        </div>
      )}
      {level.bugs.map((bug, i) => {
        const s = secrets.bugs[i];
        return (
          <div className="bug" key={i}>
            <div className="bh">
              <b>BUG {i + 1}</b>
              <span>{bug.symptom}</span>
            </div>
            <div className="file">
              → {s.file} &nbsp;<span className="patb">{bug.pattern}</span>
            </div>
            <div className="cause">
              <Inline src={s.cause} />
              <br />
              <br />
              <b>Fix:</b> <Inline src={s.fix} />
            </div>
          </div>
        );
      })}
      <h3>How to spot these faster</h3>
      <ul>
        {level.lookFor.map((x, i) => (
          <Inline key={i} as="li" src={x} />
        ))}
      </ul>
      <h3>The fix</h3>
      {Object.keys(secrets.solution).map((p) => (
        <div key={p}>
          <div className="diff-h">{p}</div>
          <Diff from={level.files[p] ?? ''} to={secrets.solution[p]} />
        </div>
      ))}
      <button className="btn sm" onClick={() => loadFix(secrets.solution)}>
        Load the fix into the editor
      </button>
    </>
  );
}
