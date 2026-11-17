import type { PanelProps } from '../level/contracts';
import { updateLevel } from '../state/store';

const PLACEHOLDER = `Failing test: ...
What goes wrong: ...
Path: route → controller → service → database
My guess: ...
How I checked: console.log(...) / ran again
Result: ✓ fixed / ✗ next guess`;

export function NotesTab({ level, progress }: PanelProps) {
  return (
    <>
      <p className="muted" style={{ fontSize: 13 }}>
        Write down your guesses as you go. It stops you reading the same file twice, and it's what you'd say out loud in
        an interview.
      </p>
      <textarea
        className="notes"
        placeholder={PLACEHOLDER}
        value={progress.notes || ''}
        onChange={(e) => updateLevel(level.id, { notes: e.target.value })}
      />
    </>
  );
}
