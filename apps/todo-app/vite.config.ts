import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';

export default defineConfig({
  esbuild: {
    loader: 'jsx',
  },
  cacheDir: '../../../node_modules/.vite/todo-app',
  plugins: [react(), tsconfigPaths()],
  build: { outDir: '../../../dist/apps/todo-app' },
});
