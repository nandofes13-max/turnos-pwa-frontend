import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  server: {
    historyApiFallback: true,  // Para desarrollo local
  },
  preview: {
    historyApiFallback: true,  // Para el preview local
  }
});
