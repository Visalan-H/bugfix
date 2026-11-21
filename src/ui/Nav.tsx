import { update, useStore } from '../state/store';
import { toast } from './toast';

/** Top bar on the home and guide pages, with the interview mode switch. */
export function Nav({ active }: { active: 'home' | 'guide' }) {
  const interview = useStore((s) => s.interview);
  const toggle = () => {
    update({ interview: !interview });
    toast(interview ? 'Practice mode: hints are back' : 'Interview mode on: no hints, like the real test');
  };
  return (
    <nav className="nav">
      <a className="logo" href="#/">
        bug<span>/</span>drill
      </a>
      <a className={`nl ${active === 'home' ? 'on' : ''}`} href="#/">
        Levels
      </a>
      <a className={`nl ${active === 'guide' ? 'on' : ''}`} href="#/guide">
        Guide
      </a>
      <div className="sp" />
      <InterviewToggle on={interview} onClick={toggle} />
    </nav>
  );
}

export function InterviewToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div
      className={`toggle ${on ? 'on' : ''}`}
      role="switch"
      aria-checked={on}
      tabIndex={0}
      title="Hides hints, tips, hidden test names and the answer until you pass"
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick())}
    >
      <span className="lbl">
        Interview<span className="lbl-long"> mode</span>
      </span>
      <span className="sw" />
    </div>
  );
}
