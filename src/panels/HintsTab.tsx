import type { PanelProps } from '../level/contracts';
import { useSecrets } from '../levels/useSecrets';
import { updateLevel } from '../state/store';
import { Inline } from './Html';

export function HintsTab({ level, progress, interview }: PanelProps) {
  const blocked = interview && !progress.solved;
  const secrets = useSecrets(level.id, !blocked);
  if (blocked)
    return (
      <div className="banner warn">
        Interview mode is on, so hints are hidden. Turn it off in the top bar to get hints.
      </div>
    );
  if (!secrets) return <p className="muted">Loading…</p>;

  const setUsed = (i: number, n: number) => updateLevel(level.id, (p) => ({ hints: { ...p.hints, [i]: n } }));
  return (
    <>
      <p className="muted" style={{ fontSize: 13 }}>
        Each card is one bug, named by what goes wrong. Open hints one at a time. Try to need as few as you can.
      </p>
      <details className="coach">
        <summary>Where to look in this app</summary>
        <ul>
          {secrets.lookFor.map((x, i) => (
            <Inline key={i} as="li" src={x} />
          ))}
        </ul>
      </details>
      {secrets.bugs.map((s, i) => {
        const used = progress.hints[i] || 0;
        const causeShown = used > s.hints.length;
        return (
          <div className="bug" key={i}>
            <div className="bh">
              <b>BUG {i + 1}</b>
              <span>{s.symptom}</span>
            </div>
            {(used >= 2 || causeShown) && <div className="file">→ {s.file}</div>}
            {s.hints.slice(0, Math.min(used, s.hints.length)).map((h, k) => (
              <Inline key={k} as="div" className="hint" src={h} />
            ))}
            {causeShown && (
              <div className="cause">
                <b>Why it breaks:</b> <Inline src={s.cause} />
                <br />
                <br />
                <b>Fix:</b> <Inline src={s.fix} />
              </div>
            )}
            <div className="actions">
              {used < s.hints.length && (
                <button className="btn sm" onClick={() => setUsed(i, used + 1)}>
                  Hint {used + 1}/{s.hints.length}
                </button>
              )}
              {!causeShown ? (
                <button className="btn sm" onClick={() => setUsed(i, s.hints.length + 1)}>
                  Show the answer
                </button>
              ) : (
                <span className="patb">{s.pattern}</span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
