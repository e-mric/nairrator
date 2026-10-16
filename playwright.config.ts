import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export default defineConfig({
  testDir: 'tests/browser',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4189', viewport: { width: 1440, height: 1100 } },
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:4189',
    reuseExistingServer: false,
    env: {
      PORT: '4189',
      NAIRRATOR_DATA_DIR: join(tmpdir(), `nairrator-e2e-${process.pid}`),
      NAIRRATOR_LOCAL_ONLY: 'false',
      ELEVENLABS_API_KEY: 'simulated-test-key',
      ELEVENLABS_VOICE_ID: 'simulated-test-voice',
    },
  },
  reporter: 'list',
});
