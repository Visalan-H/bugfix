import type { PanelProps } from '../level/contracts';
import { Inline, Markdown } from './Html';

export function TaskTab({ level, interview }: PanelProps) {
  return (
    <>
      <Markdown src={level.ticket} />
      {!interview && (
        <details className="coach">
          <summary>Tips: where to look</summary>
          <ul>
            {level.lookFor.map((x, i) => (
              <Inline key={i} as="li" src={x} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
