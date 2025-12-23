import { vi } from 'vitest'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
          single: vi.fn(),
        })),
        single: vi.fn(),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            single: vi.fn(),
          })),
          range: vi.fn(),
        })),
        range: vi.fn(),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  })),
}))

// Mock environment variables
process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-key'
process.env.JWT_SECRET = 'test-jwt-secret'

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks()
})
