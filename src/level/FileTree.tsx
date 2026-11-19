import type { Files } from '../runner/sandbox/types';
import { isReadOnly, sortPaths } from './files';
import { Icon } from '../ui/Icon';

interface Props {
  original: Files;
  files: Files;
  active: string;
  openTabs: Set<string>;
  onOpen(path: string): void;
}

/** The level's files. Folders first; changed files get a dot. */
export function FileTree({ original, files, active, openTabs, onOpen }: Props) {
  const rows: React.ReactNode[] = [];
  const seen = new Set<string>();
  for (const p of sortPaths(Object.keys(original))) {
    const parts = p.split('/');
    for (let d = 1; d < parts.length; d++) {
      const dir = parts.slice(0, d).join('/');
      if (seen.has(dir)) continue;
      seen.add(dir);
      rows.push(
        <div key={'d:' + dir} className="fi dir" style={{ paddingLeft: 10 + (d - 1) * 14 }}>
          <Icon name="chevronDown" size={12} /> {parts[d - 1]}
        </div>,
      );
    }
    const changed = files[p] !== original[p];
    rows.push(
      <div
        key={p}
        className={`fi ${p === active ? 'on' : ''} ${openTabs.has(p) ? 'open' : ''}`}
        style={{ paddingLeft: 10 + (parts.length - 1) * 14 }}
        onClick={() => onOpen(p)}
      >
        {parts[parts.length - 1]}
        {changed ? (
          <span className="mod" title="changed" />
        ) : isReadOnly(p) ? (
          <span className="ro">
            <Icon name="lock" size={12} title="read-only" />
          </span>
        ) : null}
      </div>,
    );
  }
  return (
    <>
      <div className="ph">Files</div>
      {rows}
    </>
  );
}
