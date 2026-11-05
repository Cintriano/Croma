import { defineConfig, devices } from '@playwright/test';

// A biblioteca de teste é criada pelo globalSetup em uma pasta temporária,
// e o servidor sobe com banco e cache próprios para não tocar nos dados reais.
export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/preparar.ts',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:8099',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run servidor:teste',
    url: 'http://localhost:8099/api/saude',
    reuseExistingServer: false,
    env: { PORTA: '8099', CAMINHO_BANCO: ':memory:' },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testMatch: /fase1-.*\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec/ },
    { name: 'tv', use: { viewport: { width: 1920, height: 1080 } }, testMatch: /tv\.spec/ },
  ],
});
