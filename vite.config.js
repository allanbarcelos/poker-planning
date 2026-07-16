import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Local/dev: relative base. GitHub Actions sets VITE_BASE to /<repo>/
const base = process.env.VITE_BASE || './';

export default defineConfig({
  plugins: [react()],
  base,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**'],
    },
  },
});
