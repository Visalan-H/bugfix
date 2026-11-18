import type { PanelProps, PanelTab } from '../level/contracts';
import { AnswersTab } from './AnswersTab';
import { HintsTab } from './HintsTab';
import { NotesTab } from './NotesTab';
import { ResultsTab } from './ResultsTab';
import { TaskTab } from './TaskTab';

export { DiffModal } from './DiffModal';

const TABS: [PanelTab, string][] = [
  ['task', 'Task'],
  ['output', 'Results'],
  ['hints', 'Hints'],
  ['notes', 'Notes'],
  ['debrief', 'Answers'],
];

/** The right-hand panel: tab bar plus the open tab's content. */
export function SidePanel(props: PanelProps) {
  const { run, progress, tab, setTab } = props;
  const all = run ? [...run.visible, ...run.hidden] : [];
  const passed = all.filter((r) => r.pass).length;
  const locked = !(progress.solved || progress.revealed);
  const Body = { task: TaskTab, output: ResultsTab, hints: HintsTab, notes: NotesTab, debrief: AnswersTab }[tab];
  return (
    <>
      <div className="ptabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            className={tab === k ? 'on' : ''}
            onClick={() => setTab(k)}
          >
            {label}
            {k === 'output' && run && (
              <span className={`cnt ${passed === all.length ? 'ok' : 'bad'}`}>
                {passed}/{all.length}
              </span>
            )}
            {k === 'debrief' && locked ? ' 🔒' : ''}
          </button>
        ))}
      </div>
      <div className="pbody">
        <Body {...props} />
      </div>
    </>
  );
}
