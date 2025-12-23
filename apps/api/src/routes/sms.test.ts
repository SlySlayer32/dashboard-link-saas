import { createClient } from '@supabase/supabase-js'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SMSService } from '../services/sms.service'
import { TokenService } from '../services/token.service'
import sms from './sms'

// Mock dependencies
vi.mock('@supabase/supabase-js')
vi.mock('../services/sms.service')
vi.mock('../services/token.service')

const mockSupabase = createClient('test-url', 'test-key')
const mockApp = new Hono()
mockApp.route('/sms', sms)

describe('SMS Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /sms/send-dashboard-link', () => {
    it('should return 401 without authentication', async () => {
      // Test without auth middleware context
      const res = await mockApp.request('/sms/send-dashboard-link', {
        method: 'POST',
        body: JSON.stringify({
          workerId: 'test-worker-id',
          expiresIn: '1h',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      expect(res.status).toBe(401)
    })

    it('should validate required fields', async () => {
      // Mock authenticated context
      const mockContext = {
        userId: 'test-user-id',
        req: { json: () => Promise.resolve({}) },
        json: vi.fn(),
        get: vi.fn((key) => (key === 'userId' ? 'test-user-id' : undefined)),
      }

      // Test missing workerId
      const res1 = await sms.routes['/send-dashboard-link'].handler(mockContext, {
        workerId: '',
        expiresIn: '1h',
      })
      expect(res1.status).toBe(400)

      // Test missing expiresIn
      const res2 = await sms.routes['/send-dashboard-link'].handler(mockContext, {
        workerId: 'test-worker-id',
        expiresIn: '',
      })
      expect(res2.status).toBe(400)
    })

    it('should validate expiresIn values', async () => {
      const mockContext = {
        userId: 'test-user-id',
        req: { json: () => Promise.resolve({}) },
        json: vi.fn(),
        get: vi.fn((key) => (key === 'userId' ? 'test-user-id' : undefined)),
      }

      const res = await sms.routes['/send-dashboard-link'].handler(mockContext, {
        workerId: 'test-worker-id',
        expiresIn: '2h', // Invalid value
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error.code).toBe('INVALID_EXPIRY')
    })

    it('should send dashboard link successfully', async () => {
      // Mock database responses
      const mockAdminResponse = { data: { organization_id: 'test-org-id' }, error: null }
      const mockWorkerResponse = {
        data: {
          id: 'test-worker-id',
          name: 'John Doe',
          phone: '+61412345678',
          active: true,
        },
        error: null,
      }
      const mockSMSLogResponse = { data: { id: 'test-sms-id' }, error: null }

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'admins') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve(mockAdminResponse)),
                })),
              })),
            })),
          }
        }
        if (table === 'workers') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve(mockWorkerResponse)),
                })),
              })),
            })),
          }
        }
        if (table === 'sms_logs') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve(mockSMSLogResponse)),
                      })),
                    })),
                  })),
                })),
              })),
            })),
          }
        }
        return mockSupabase.from(table)
      })

      // Mock services
      vi.mocked(TokenService.generateToken).mockResolvedValue({
        token: 'test-token',
        expires_at: '2024-01-01T00:00:00Z',
      })
      vi.mocked(TokenService.generateDashboardLink).mockReturnValue(
        'http://localhost:3000/dashboard/test-token'
      )
      vi.mocked(SMSService.sendSMS).mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
      })

      const mockContext = {
        userId: 'test-user-id',
        req: { json: () => Promise.resolve({}) },
        json: vi.fn(),
        get: vi.fn((key) => (key === 'userId' ? 'test-user-id' : undefined)),
      }

      const res = await sms.routes['/send-dashboard-link'].handler(mockContext, {
        workerId: 'test-worker-id',
        expiresIn: '1h',
        customMessage: 'Custom test message',
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.token).toBe('test-token')
      expect(data.data.dashboardUrl).toBe('http://localhost:3000/dashboard/test-token')
      expect(data.data.status).toBe('sent')
    })

    it('should handle inactive worker', async () => {
      const mockAdminResponse = { data: { organization_id: 'test-org-id' }, error: null }
      const mockWorkerResponse = {
        data: {
          id: 'test-worker-id',
          name: 'John Doe',
          phone: '+61412345678',
          active: false, // Inactive worker
        },
        error: null,
      }

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'admins') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve(mockAdminResponse)),
                })),
              })),
            })),
          }
        }
        if (table === 'workers') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve(mockWorkerResponse)),
                })),
              })),
            })),
          }
        }
        return mockSupabase.from(table)
      })

      const mockContext = {
        userId: 'test-user-id',
        req: { json: () => Promise.resolve({}) },
        json: vi.fn(),
        get: vi.fn((key) => (key === 'userId' ? 'test-user-id' : undefined)),
      }

      const res = await sms.routes['/send-dashboard-link'].handler(mockContext, {
        workerId: 'test-worker-id',
        expiresIn: '1h',
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error.code).toBe('WORKER_INACTIVE')
    })
  })

  describe('GET /sms/logs', () => {
    it('should return paginated SMS logs', async () => {
      const mockAdminResponse = { data: { organization_id: 'test-org-id' }, error: null }
      const mockLogsResponse = {
        data: [
          {
            id: 'sms-1',
            phone: '+61412345678',
            message: 'Test message 1',
            status: 'sent',
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'sms-2',
            phone: '+61412345679',
            message: 'Test message 2',
            status: 'pending',
            created_at: '2024-01-01T01:00:00Z',
          },
        ],
        error: null,
        count: 2,
      }

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'admins') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve(mockAdminResponse)),
              })),
            })),
          }
        }
        if (table === 'sms_logs') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  range: vi.fn(() => Promise.resolve(mockLogsResponse)),
                })),
              })),
            })),
          }
        }
        return mockSupabase.from(table)
      })

      const mockContext = {
        userId: 'test-user-id',
        req: { query: () => ({ page: '1', limit: '20' }) },
        json: vi.fn(),
        get: vi.fn((key) => {
          if (key === 'userId') return 'test-user-id'
          return undefined
        }),
      }

      const res = await sms.routes['/logs'].handler(mockContext, {})

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(20)
      expect(data.pagination.total).toBe(2)
    })

    it('should filter by workerId when provided', async () => {
      const mockAdminResponse = { data: { organization_id: 'test-org-id' }, error: null }
      const mockLogsResponse = {
        data: [
          {
            id: 'sms-1',
            worker_id: 'worker-1',
            phone: '+61412345678',
            message: 'Test message',
            status: 'sent',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
        count: 1,
      }

      let eqCallCount = 0
      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'admins') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve(mockAdminResponse)),
              })),
            })),
          }
        }
        if (table === 'sms_logs') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => {
                eqCallCount++
                if (eqCallCount === 1) {
                  // First eq is for organization_id
                  return {
                    eq: vi.fn(() => ({
                      order: vi.fn(() => ({
                        range: vi.fn(() => Promise.resolve(mockLogsResponse)),
                      })),
                    })),
                  }
                } else {
                  // Second eq is for worker_id
                  return {
                    order: vi.fn(() => ({
                      range: vi.fn(() => Promise.resolve(mockLogsResponse)),
                    })),
                  }
                }
              }),
            })),
          }
        }
        return mockSupabase.from(table)
      })

      const mockContext = {
        userId: 'test-user-id',
        req: { query: () => ({ page: '1', limit: '20', workerId: 'worker-1' }) },
        json: vi.fn(),
        get: vi.fn((key) => {
          if (key === 'userId') return 'test-user-id'
          return undefined
        }),
      }

      const res = await sms.routes['/logs'].handler(mockContext, {})

      expect(res.status).toBe(200)
      expect(eqCallCount).toBe(2) // Should call eq twice (org_id and worker_id)
    })
  })

  describe('POST /sms/send', () => {
    it('should send custom SMS successfully', async () => {
      const mockAdminResponse = { data: { organization_id: 'test-org-id' }, error: null }
      const mockWorkerResponse = {
        data: {
          id: 'test-worker-id',
          name: 'John Doe',
          phone: '+61412345678',
          active: true,
        },
        error: null,
      }
      const mockSMSLogResponse = { data: { id: 'test-sms-id' }, error: null }

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'admins') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve(mockAdminResponse)),
              })),
            })),
          }
        }
        if (table === 'workers') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve(mockWorkerResponse)),
                })),
              })),
            })),
          }
        }
        if (table === 'sms_logs') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve(mockSMSLogResponse)),
                      })),
                    })),
                  })),
                })),
              })),
            })),
          }
        }
        return mockSupabase.from(table)
      })

      vi.mocked(SMSService.sendSMS).mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
      })

      const mockContext = {
        userId: 'test-user-id',
        req: { json: () => Promise.resolve({}) },
        json: vi.fn(),
        get: vi.fn((key) => (key === 'userId' ? 'test-user-id' : undefined)),
      }

      const res = await sms.routes['/send'].handler(mockContext, {
        workerId: 'test-worker-id',
        message: 'Custom test message',
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.messageId).toBe('test-message-id')
      expect(data.data.status).toBe('sent')
    })

    it('should handle SMS sending failure', async () => {
      const mockAdminResponse = { data: { organization_id: 'test-org-id' }, error: null }
      const mockWorkerResponse = {
        data: {
          id: 'test-worker-id',
          name: 'John Doe',
          phone: '+61412345678',
          active: true,
        },
        error: null,
      }

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'admins') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve(mockAdminResponse)),
              })),
            })),
          }
        }
        if (table === 'workers') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve(mockWorkerResponse)),
                })),
              })),
            })),
          }
        }
        return mockSupabase.from(table)
      })

      vi.mocked(SMSService.sendSMS).mockResolvedValue({
        success: false,
        error: 'SMS service unavailable',
      })

      const mockContext = {
        userId: 'test-user-id',
        req: { json: () => Promise.resolve({}) },
        json: vi.fn(),
        get: vi.fn((key) => (key === 'userId' ? 'test-user-id' : undefined)),
      }

      const res = await sms.routes['/send'].handler(mockContext, {
        workerId: 'test-worker-id',
        message: 'Test message',
      })

      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('SMS_FAILED')
    })
  })
})
