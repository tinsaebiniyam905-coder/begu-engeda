import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
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
