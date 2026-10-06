import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// envDir points at the repo root so the web app shares the same .env file
// as docker-compose and the API instead of needing its own.
export default defineConfig({
  plugins: [react()],
  envDir: '../',
  server: {
    port: 5173,
  },
});
