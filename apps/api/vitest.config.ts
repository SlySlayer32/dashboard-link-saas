import path from 'path'
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
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
      thresholds: {
        // Global thresholds for all files
        functions: 75,
        branches: 65,
        lines: 75,
        statements: 75,

        // Critical security paths - highest coverage
        'src/middleware/tenant*.ts': {
          functions: 95,
          branches: 90,
          lines: 95,
          statements: 95,
        },
        'src/services/token*.ts': {
          functions: 90,
          branches: 85,
          lines: 90,
          statements: 90,
        },

        // Business logic - high coverage
        'src/services/**': {
          functions: 80,
          branches: 70,
          lines: 80,
          statements: 80,
        },

        // Routes - moderate coverage (integration tested)
        'src/routes/**': {
          functions: 70,
          branches: 60,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
