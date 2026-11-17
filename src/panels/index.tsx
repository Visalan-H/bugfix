import type { DiffModalProps, PanelProps } from '../level/contracts';

// Placeholders. Replaced by the real panels.

/** The right-hand panel: tab bar plus the open tab's content. */
export function SidePanel(props: PanelProps) {
  return <div className="pbody">{props.tab}</div>;
}

/** "Your changes" popup. */
export function DiffModal(props: DiffModalProps) {
  return (
    <div className="modal-bg" onClick={props.onClose}>
      <div className="modal">Diff</div>
    </div>
  );
}
