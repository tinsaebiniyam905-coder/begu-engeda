import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    include: ['xlsx', 'pptxgenjs', 'docx'],
  },
  resolve: {
    alias: {
      './dist/cpexcel.js': '',
    },
  },
});
