import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const devPort = Number(process.env.LEX4_DEMO_PORT ?? process.env.LEX4_E2E_PORT ?? 3000);

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/lex4/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: devPort,
    strictPort: true,
  },
});
