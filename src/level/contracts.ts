import type { LoadedLevel } from '../levels';
import type { Files, TestResult } from '../runner/sandbox/types';
import type { LevelProgress } from '../state/store';

// What the level page hands to the side panels and the diff popup.
// The level page (src/level) owns editing and running; the panels (src/panels) only show things.

export type PanelTab = 'task' | 'output' | 'hints' | 'notes' | 'debrief';

/** The latest test run. Results arrive one by one while `running` is true. */
export interface RunState {
  submit: boolean;
  running: boolean;
  visible: TestResult[];
  hidden: TestResult[];
}

export interface PanelProps {
  level: LoadedLevel;
  /** Current files, with the user's edits. */
  files: Files;
  progress: LevelProgress;
  interview: boolean;
  run: RunState | null;
  tab: PanelTab;
  setTab(tab: PanelTab): void;
  /** Opens a file in the editor and flashes `line`. On phones it also switches to the Code tab. */
  openFile(path: string, line?: number): void;
  /** Puts the reference fix into the editor. */
  loadFix(solution: Files): void;
}

export interface DiffModalProps {
  level: LoadedLevel;
  files: Files;
  onResetAll(): void;
  onClose(): void;
}
