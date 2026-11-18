import type { PanelProps } from '../level/contracts';
import { Inline, Markdown } from './Html';

const COLORS = ['#6cb6ff', '#ffbf47', '#ff9f1c', '#ff8c5a', '#ff7a7a', '#c39bff'];

/** Splits the level's minutes into: look around, one slot per visible bug, check. */
function TimeSplit({ minutes, bugs }: { minutes: number; bugs: number }) {
  const recon = Math.max(2, Math.round(minutes * 0.15));
  const verify = Math.max(2, Math.round(minutes * 0.15));
  const per = Math.floor((minutes - recon - verify) / Math.max(1, bugs));
  return (
    <div className="split">
      <div style={{ flex: recon, background: '#6cb6ff' }}>Look {recon}m</div>
      {Array.from({ length: bugs }, (_, i) => (
        <div key={i} style={{ flex: per, background: COLORS[(i + 1) % COLORS.length] }}>
          Bug {i + 1} ≤{per}m
        </div>
      ))}
      <div style={{ flex: verify, background: '#3ddc97' }}>Check {verify}m</div>
    </div>
  );
}

export function TaskTab({ level, interview }: PanelProps) {
  const visibleBugs = level.bugs.filter((b) => !b.symptom.startsWith('Hidden test')).length;
  return (
    <>
      <Markdown src={level.ticket} />
      <h3>Suggested timing</h3>
      <TimeSplit minutes={level.minutes} bugs={visibleBugs} />
      <p className="muted" style={{ fontSize: 13 }}>
        Stuck past your time for a bug? Write your guess in Notes and move on. The bugs are usually separate.
      </p>
      {!interview && (
        <details className="coach">
          <summary>Tips: where to look in this app</summary>
          <ul>
            {level.lookFor.map((x, i) => (
              <Inline key={i} as="li" src={x} />
            ))}
          </ul>
        </details>
      )}
      <p className="dim" style={{ fontSize: 12.5 }}>
        Your code runs right here in the browser, with Express, supertest, Jest-style tests and a small Mongo-like
        database. Anything you <code>console.log</code> shows under each test.
      </p>
    </>
  );
}
