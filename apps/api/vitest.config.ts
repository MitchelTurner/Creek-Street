import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
    // Mail/AI specs toggle process.env; avoid cross-file races in one worker.
    fileParallelism: false,
  },
});
