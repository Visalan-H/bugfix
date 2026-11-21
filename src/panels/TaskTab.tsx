import type { PanelProps } from '../level/contracts';
import { Markdown } from './Html';

export function TaskTab({ level }: PanelProps) {
  return <Markdown src={level.ticket} />;
}
