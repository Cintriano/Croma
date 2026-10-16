import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Front-end: código em web/, build em dist/web (servido pelo próprio servidor Fastify).
// Em desenvolvimento (npm run web), o Vite repassa /api para o servidor na porta 8080.
export default defineConfig({
  root: 'web',
  plugins: [react()],
  build: { outDir: '../dist/web', emptyOutDir: true },
  server: { proxy: { '/api': 'http://localhost:8080' } },
});
