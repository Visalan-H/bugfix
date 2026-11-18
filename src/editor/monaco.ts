import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker?worker';
import TsWorker from 'monaco-editor/language/typescript/ts.worker?worker';
import { EXPRESS_D_TS, JEST_D_TS, MEMDB_D_TS, SUPERTEST_D_TS } from './stubs';

// Monaco from the local package (no CDN), set up once for the whole app.
// This file is only loaded when a level opens, so the home page stays small.

self.MonacoEnvironment = {
  getWorker(_id, label) {
    if (label === 'typescript' || label === 'javascript') return new TsWorker();
    if (label === 'json') return new JsonWorker();
    return new EditorWorker();
  },
};

loader.config({ monaco });

const js = monaco.typescript.javascriptDefaults;
js.setCompilerOptions({
  allowJs: true,
  checkJs: false,
  target: monaco.typescript.ScriptTarget.ES2020,
  module: monaco.typescript.ModuleKind.CommonJS,
  moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
  allowNonTsExtensions: true,
  noEmit: true,
});
// Syntax errors only. The sandbox's packages aren't real files, so deeper checks would be noise.
js.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false, noSuggestionDiagnostics: true });
// Every file is known to the language service, so go-to-definition works across files.
js.setEagerModelSync(true);
js.addExtraLib(EXPRESS_D_TS, 'file:///node_modules/@types/express/index.d.ts');
js.addExtraLib(SUPERTEST_D_TS, 'file:///node_modules/@types/supertest/index.d.ts');
js.addExtraLib(MEMDB_D_TS, 'file:///node_modules/@types/memdb/index.d.ts');
js.addExtraLib(JEST_D_TS, 'file:///node_modules/@types/jest/index.d.ts');

export const THEME = 'bugdrill';
monaco.editor.defineTheme(THEME, {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '5c6677', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ff9f1c' },
    { token: 'string', foreground: '9fd8a6' },
    { token: 'number', foreground: 'c39bff' },
    { token: 'type', foreground: '6cb6ff' },
  ],
  colors: {
    'editor.background': '#0c0f14',
    'editor.foreground': '#e6e9ef',
    'editorLineNumber.foreground': '#3d4655',
    'editorLineNumber.activeForeground': '#a9b1bf',
    'editor.lineHighlightBackground': '#11151c',
    'editor.selectionBackground': '#ff9f1c40',
    'editor.inactiveSelectionBackground': '#ff9f1c22',
    'editorCursor.foreground': '#ff9f1c',
    'editorIndentGuide.background1': '#1b212c',
    'editorWidget.background': '#11151c',
    'editorWidget.border': '#2d3543',
    'editorSuggestWidget.background': '#11151c',
    'editorSuggestWidget.selectedBackground': '#232a36',
    'editorHoverWidget.background': '#11151c',
    'scrollbarSlider.background': '#2d354380',
  },
});

/** Monaco URI for a level file, e.g. `src/app.js` → `file:///src/app.js`. */
export const fileUri = (path: string) => monaco.Uri.parse('file:///' + path);

export function languageOf(path: string) {
  if (path.endsWith('.js')) return 'javascript';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.md')) return 'markdown';
  return 'plaintext';
}

export { monaco };
