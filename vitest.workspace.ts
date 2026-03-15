import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'apps/*/vitest.config.ts',
  'packages/shared/vitest.config.ts',
  'packages/plugins/vitest.config.ts',
  'packages/sms/vitest.config.ts',
  'packages/ui/vitest.config.simple.ts',
])
