import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  cacheDir: '../../../node_modules/.vite/todo-app',
  plugins: [tsconfigPaths()],
  build: { outDir: '../../../dist/apps/todo-app' },
});
