
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts'],
          reports: ['xlsx', 'pptxgenjs', 'docx', 'jspdf'],
        },
      },
    },
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
