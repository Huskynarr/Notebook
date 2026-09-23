import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
export default {
  root,
  build: {
    target: 'es2022',
    outDir: 'dist/server',
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: fileURLToPath(new URL('../apps/api/src/sites/worker.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
};
