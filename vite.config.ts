import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works on GitHub Pages or Vercel without changes.
export default defineConfig({
  base: './',
  plugins: [react()],
  worker: { format: 'es' },
});
