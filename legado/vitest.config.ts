import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'servidor',
          include: ['tests/servidor/**/*.test.ts', 'tests/ajuda/**/*.test.ts'],
          environment: 'node',
          testTimeout: 20_000,
        },
      },
      {
        extends: true,
        test: {
          name: 'web',
          include: ['tests/web/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['tests/web/setup.ts'],
        },
      },
    ],
  },
});
