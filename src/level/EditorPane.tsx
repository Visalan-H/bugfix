import Editor from '@monaco-editor/react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { fileUri, languageOf, monaco, THEME } from '../editor/monaco';
import type { Files } from '../runner/sandbox/types';
import type { PaneLayout } from '../state/store';
import { isReadOnly } from './files';
import { isTestFile } from '../levels/types';

interface Props {
  index: number;
  pane: PaneLayout;
  focused: boolean;
  paneCount: number;
  canSplit: boolean;
  original: Files;
  files: Files;
  onFocus(): void;
  onActivate(path: string): void;
  onClose(path: string): void;
  onSplit(): void;
  onClosePane(): void;
  onMount(editor: monaco.editor.IStandaloneCodeEditor): void;
}

/** One editor side: its tabs, the file path bar, and a Monaco editor. */
export function EditorPane(p: Props) {
  const f = p.pane.active;
  const ro = isReadOnly(f);

  // Each pane remembers scroll and cursor per file. (The library's own memory is
  // shared by every editor on the page, so panes and levels would mix it up.)
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const viewStates = useRef(new Map<string, monaco.editor.ICodeEditorViewState | null>());
  useLayoutEffect(() => {
    // Runs before the editor switches to the new file: save where we were in this one.
    const states = viewStates.current;
    return () => {
      if (editor.current) states.set(f, editor.current.saveViewState());
    };
  }, [f]);
  useEffect(() => {
    // Runs after the editor switched files: go back to where we were in it.
    const saved = viewStates.current.get(f);
    if (saved) editor.current?.restoreViewState(saved);
  }, [f]);
  return (
    <div
      className={`epane ${p.focused && p.paneCount > 1 ? 'focus' : ''}`}
      onMouseDownCapture={p.onFocus}
      onFocusCapture={p.onFocus}
    >
      <div className="etabs">
        <div className="etab-list" title="Alt+W close tab · Alt+[ and Alt+] switch tab">
          {p.pane.tabs.map((t) => {
            const dir = t.includes('/') ? t.split('/').slice(-2, -1)[0] + '/' : '';
            const changed = p.files[t] !== p.original[t];
            return (
              <div
                key={t}
                className={`etab ${t === f ? 'on' : ''} ${isTestFile(t) ? 'test' : ''}`}
                title={t + (isReadOnly(t) ? ' (read-only)' : '')}
                onClick={() => t !== f && p.onActivate(t)}
                onAuxClick={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    p.onClose(t);
                  }
                }}
              >
                <span className="tdir">{dir}</span>
                <span className="tname">{t.split('/').pop()}</span>
                {isReadOnly(t) && <span className="tlock">ro</span>}
                <span
                  className={`x ${changed ? 'mod' : ''}`}
                  title="Close (Alt+W)"
                  onClick={(e) => {
                    e.stopPropagation();
                    p.onClose(t);
                  }}
                >
                  ×
                </span>
              </div>
            );
          })}
        </div>
        {p.canSplit && p.paneCount === 1 && (
          <button className="eb" title="Show two files side by side (Alt+\)" onClick={p.onSplit}>
            ⫿ Split
          </button>
        )}
        {p.paneCount > 1 && (
          <button className="eb" title="Close this side" onClick={p.onClosePane}>
            ✕
          </button>
        )}
      </div>
      <div className="monaco-host">
        <Editor
          path={fileUri(f).toString()}
          language={languageOf(f)}
          theme={THEME}
          keepCurrentModel
          saveViewState={false}
          onMount={(ed) => {
            editor.current = ed;
            p.onMount(ed);
          }}
          loading={<div className="con-empty">Loading the editor…</div>}
          options={{
            readOnly: ro,
            readOnlyMessage: { value: 'Test files are read-only. Fix the code in src/ instead.' },
            fontFamily: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
            fontSize: 13,
            lineHeight: 20,
            tabSize: 2,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fixedOverflowWidgets: true,
            padding: { top: 12 },
            renderLineHighlight: 'line',
            stickyScroll: { enabled: false },
            bracketPairColorization: { enabled: false },
          }}
        />
      </div>
    </div>
  );
}
