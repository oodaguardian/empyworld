import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/tts': {
        target: 'https://api.streamelements.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts/, '/kappa/v2/speech'),
      },
    },
  },
});
