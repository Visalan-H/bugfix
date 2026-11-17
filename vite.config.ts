import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { levelsPlugin } from './scripts/vite-levels-plugin.ts';

// Relative base so the build works on GitHub Pages or Vercel without changes.
export default defineConfig({
  base: './',
  plugins: [react(), levelsPlugin()],
  worker: { format: 'es' },
  // Monaco's editor and TypeScript worker are large but only load when a level opens.
  build: { chunkSizeWarningLimit: 8000 },
});
