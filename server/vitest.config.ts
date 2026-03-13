import { defineConfig } from 'vitest/config'
import type { UserConfig } from 'vitest/config'

export default defineConfig({
  root: '.',
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: { reporter: ['text'], include: ['src/**/*.ts'], exclude: ['src/**/*.test.ts'] },
  },
  resolve: {
    alias: {
      '#': new URL('./src', import.meta.url).pathname,
    },
  },
} as UserConfig)
