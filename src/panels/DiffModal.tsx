import { useEffect, useState } from 'react';
import type { DiffModalProps } from '../level/contracts';
import { Diff } from '../ui/Diff';

/** Every line the user changed, with a two-step "Reset ALL files". */
export function DiffModal({ level, files, onResetAll, onClose }: DiffModalProps) {
  const [armed, setArmed] = useState(false);
  const changed = Object.keys(level.files).filter((p) => files[p] !== level.files[p]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Your changes">
        <div className="mh">
          <h3>
            Your changes ({changed.length} file{changed.length === 1 ? '' : 's'})
          </h3>
          <button className="btn sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mb">
          {changed.length ? (
            <>
              <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
                Check every changed line before you submit. Did you leave a console.log? Change something that wasn't
                broken? Change what the API returns?
              </p>
              {changed.map((p) => (
                <div key={p}>
                  <div className="diff-h">{p}</div>
                  <Diff from={level.files[p]} to={files[p] ?? ''} />
                </div>
              ))}
            </>
          ) : (
            <p className="muted">No changes yet.</p>
          )}
        </div>
        <div className="mf">
          {changed.length > 0 && (
            <button
              className="btn sm"
              onClick={() => {
                if (!armed) return setArmed(true);
                onResetAll();
                onClose();
              }}
            >
              {armed ? 'Click again to confirm' : 'Reset ALL files'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
