import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
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
        '/api/bunny': {
          target: `https://${env.VITE_BUNNY_STORAGE_HOST || 'storage.bunnycdn.com'}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/bunny/, `/${env.VITE_BUNNY_STORAGE_ZONE || 'empy-movies'}`),
          headers: {
            AccessKey: env.VITE_BUNNY_STORAGE_PASSWORD || '',
          },
        },
      },
    },
    optimizeDeps: {
      include: [
        'firebase/app',
        'firebase/firestore',
        'firebase/storage',
        'firebase/messaging',
        '@zegocloud/zego-uikit-prebuilt',
      ],
    },
    resolve: {
      conditions: ['browser', 'module', 'import', 'default'],
    },
  };
});
