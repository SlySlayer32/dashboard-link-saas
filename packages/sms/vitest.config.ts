import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
      thresholds: {
        // Global thresholds
        functions: 85,
        branches: 75,
        lines: 85,
        statements: 85,

        // Validation - critical for security
        'src/services/SMSValidationService.ts': {
          functions: 95,
          branches: 90,
          lines: 95,
          statements: 95,
        },

        // Queue service - high reliability needed
        'src/services/SMSQueueService.ts': {
          functions: 90,
          branches: 85,
          lines: 90,
          statements: 90,
        },

        // Utilities - should be well tested
        'src/utils/**': {
          functions: 90,
          branches: 85,
          lines: 90,
          statements: 90,
        },
      },
    },
  },
});
