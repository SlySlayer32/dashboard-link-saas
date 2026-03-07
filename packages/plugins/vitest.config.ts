import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        'dist/',
        'coverage/'
      ],
      thresholds: {
        // Global thresholds
        functions: 80,
        branches: 70,
        lines: 80,
        statements: 80,

        // Plugin adapters - high coverage required
        'src/**/adapter.ts': {
          functions: 85,
          branches: 75,
          lines: 85,
          statements: 85,
        },

        // Base adapter - critical
        'src/base/**': {
          functions: 90,
          branches: 80,
          lines: 90,
          statements: 90,
        },
      },
    }
  },
  resolve: {
    alias: {
      '@dashboard-link/shared': ['../../shared/src']
    }
  }
})
