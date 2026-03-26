
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['xlsx', 'pptxgenjs', 'docx', 'react-leaflet', 'leaflet'],
  },
  resolve: {
    alias: {
      './dist/cpexcel.js': '',
    },
  },
});
