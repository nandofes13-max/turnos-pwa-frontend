import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
  },
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
