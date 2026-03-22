import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // PWA manifest handled via HTML link tag + public/manifest.json
});
