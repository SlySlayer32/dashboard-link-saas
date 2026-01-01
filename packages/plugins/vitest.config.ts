import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        'dist/',
        'coverage/'
      ]
    }
  },
  resolve: {
    alias: {
      '@dashboard-link/shared': ['../../shared/src']
    }
  }
})
