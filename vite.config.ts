import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { kioskApi } from './server/kioskApi';

export default defineConfig({
  plugins: [react(), tailwindcss(), kioskApi()],
  server: { port: 5173, strictPort: false },
  preview: { port: 4173 },
});
