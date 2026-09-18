import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  // Unter GitHub Pages liegt die Anwendung in einem Unterpfad (/Notebook/).
  // Ohne diesen Wert zeigen alle Asset-Verweise auf die Wurzel und laufen ins
  // Leere. Lokal bleibt es bei '/'.
  base: process.env['VITE_BASE_PATH'] ?? '/',
  plugins: [react(), tailwind()],
  server: { port: 5173, strictPort: true },
  build: { outDir: 'dist', sourcemap: true },
});
