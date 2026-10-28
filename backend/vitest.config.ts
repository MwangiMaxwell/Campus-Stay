import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    globalSetup: './tests/globalSetup.ts',
    fileParallelism: false,
    maxWorkers: 1,
    isolate: false,
    testTimeout: 30000,
    hookTimeout: 180000,
    env: {
      NODE_ENV: 'test',
      PORT: '4000',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/campusstay-test-placeholder',
      JWT_SECRET: 'test-jwt-secret-must-be-at-least-32-characters',
      JWT_EXPIRES_IN: '15m',
      CLIENT_URL: 'http://localhost:3000',
      MPESA_ENV: 'sandbox',
      ORG_NAME: 'CampusStay',
      ORG_LOGO_URL: 'http://localhost:3000/logo.svg',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
