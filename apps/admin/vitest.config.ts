import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
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
        // Global thresholds
        functions: 70,
        branches: 60,
        lines: 70,
        statements: 70,

        // Auth and security - critical
        'src/store/auth.ts': {
          functions: 90,
          branches: 85,
          lines: 90,
          statements: 90,
        },

        // Custom hooks - high coverage
        'src/hooks/**': {
          functions: 80,
          branches: 70,
          lines: 80,
          statements: 80,
        },

        // UI components - moderate (visual testing)
        'src/components/**': {
          functions: 65,
          branches: 55,
          lines: 65,
          statements: 65,
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
