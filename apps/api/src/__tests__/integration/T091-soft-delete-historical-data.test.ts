/**
 * T091: Soft Delete Preserves Historical Data Test
 *
 * End-to-end validation test - verifies that soft delete preserves historical data
 * Tests for: SMS logs, access logs, dashboard tokens remain queryable after worker deletion (FR-010)
 *
 * Note: This test uses real database connections to verify actual data preservation behavior
 * unlike other tests that use mocks, because we need to verify database constraints work correctly
 */

import { DIContainer, WorkerRepository } from '@dashboard-link/database'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { supabase } from '../../lib/db'
import { WorkerService } from '../../services/WorkerService'

describe('T091: Soft Delete Preserves Historical Data', () => {
  let workerRepo: WorkerRepository
  let workerService: WorkerService
  let orgId: string
  let workerId: string
  let tokenId: string
  let smsLogId: string
  let accessLogId: string

  beforeEach(async () => {
    // Setup services using DI container
    const container = new DIContainer({
      database: {
        type: 'supabase',
        connection: supabase,
        config: {
          caching: { enabled: false, ttl: 300 },
        },
      },
    })
    workerRepo = container.getWorkerRepository()
    workerService = new WorkerService(workerRepo)

    // Create test organization
    const orgResult = await supabase
      .from('organizations')
      .insert({ name: 'Test Org', slug: 'test-org' })
      .select('id')
      .single()

    if (orgResult.error) throw orgResult.error
    orgId = orgResult.data.id

    // Set tenant context for all subsequent queries using Supabase RPC
    const { error: tenantError } = await supabase.rpc('set_tenant_context', {
      tenant_id: orgId,
    })
    if (tenantError) throw tenantError

    // Create test worker
    const worker = await workerService.createWorker(
      {
        name: 'Test Worker',
        phone: '0412 345 678',
      },
      orgId
    )
    workerId = worker.id

    // Create dashboard token for the worker
    const tokenResult = await supabase
      .from('dashboard_tokens')
      .insert({
        worker_id: workerId,
        organization_id: orgId,
        token_hash: 'a'.repeat(64), // 64-character hash
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      })
      .select('id')
      .single()

    if (tokenResult.error) throw tokenResult.error
    tokenId = tokenResult.data.id

    // Create SMS log for the worker
    const smsResult = await supabase
      .from('sms_logs')
      .insert({
        organization_id: orgId,
        worker_id: workerId,
        phone_number: '+61412345678',
        message_content: 'Test message',
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (smsResult.error) throw smsResult.error
    smsLogId = smsResult.data.id

    // Create access log for the worker
    const accessResult = await supabase
      .from('access_logs')
      .insert({
        organization_id: orgId,
        worker_id: workerId,
        token_id: tokenId,
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent',
      })
      .select('id')
      .single()

    if (accessResult.error) throw accessResult.error
    accessLogId = accessResult.data.id
  })

  afterEach(async () => {
    // Clear tenant context
    await supabase.rpc('set_tenant_context', { tenant_id: '00000000-0000-0000-0000-000000000000' })

    // Cleanup test data in correct order due to foreign key constraints
    await supabase.from('access_logs').delete().eq('organization_id', orgId)
    await supabase.from('sms_logs').delete().eq('organization_id', orgId)
    await supabase.from('dashboard_tokens').delete().eq('organization_id', orgId)
    await supabase.from('workers').delete().eq('organization_id', orgId)
    await supabase.from('organizations').delete().eq('id', orgId)
  })

  it('should preserve dashboard tokens after worker soft delete', async () => {
    // Verify token exists before deletion
    const tokenBefore = await supabase
      .from('dashboard_tokens')
      .select('*')
      .eq('worker_id', workerId)

    expect(tokenBefore.error).toBeNull()
    expect(tokenBefore.data).toHaveLength(1)
    expect(tokenBefore.data?.[0]?.id).toBe(tokenId)

    // Soft delete the worker
    await workerService.deleteWorker(workerId, orgId)

    // Verify token still exists after soft delete (preserved)
    const tokenAfter = await supabase.from('dashboard_tokens').select('*').eq('worker_id', workerId)

    expect(tokenAfter.error).toBeNull()
    expect(tokenAfter.data).toHaveLength(1)
    expect(tokenAfter.data![0].id).toBe(tokenId)

    // Verify worker is soft deleted (deleted_at is set)
    const deletedWorker = await supabase.from('workers').select('*').eq('id', workerId).single()

    expect(deletedWorker.error).toBeNull()
    expect(deletedWorker.data?.deleted_at).not.toBeNull()
  })

  it('should preserve SMS logs after worker soft delete', async () => {
    // Verify SMS log exists before deletion
    const smsBefore = await supabase.from('sms_logs').select('*').eq('worker_id', workerId)

    expect(smsBefore.error).toBeNull()
    expect(smsBefore.data).toHaveLength(1)
    expect(smsBefore.data![0].id).toBe(smsLogId)
    expect(smsBefore.data![0].worker_id).toBe(workerId)

    // Soft delete the worker
    await workerService.deleteWorker(workerId, orgId)

    // Verify SMS log still exists after soft delete (preserved)
    const smsAfter = await supabase.from('sms_logs').select('*').eq('worker_id', workerId)

    expect(smsAfter.error).toBeNull()
    expect(smsAfter.data).toHaveLength(1)
    expect(smsAfter.data![0].id).toBe(smsLogId)
    expect(smsAfter.data![0].worker_id).toBe(workerId) // Still references the worker

    // Verify SMS log is queryable by organization
    const smsByOrg = await supabase.from('sms_logs').select('*').eq('organization_id', orgId)

    expect(smsByOrg.error).toBeNull()
    expect(smsByOrg.data).toHaveLength(1)
    expect(smsByOrg.data![0].id).toBe(smsLogId)
  })

  it('should preserve access logs after worker soft delete', async () => {
    // Verify access log exists before deletion
    const accessBefore = await supabase.from('access_logs').select('*').eq('worker_id', workerId)

    expect(accessBefore.error).toBeNull()
    expect(accessBefore.data).toHaveLength(1)
    expect(accessBefore.data![0].id).toBe(accessLogId)

    // Soft delete the worker
    await workerService.deleteWorker(workerId, orgId)

    // Verify access log still exists after soft delete (preserved)
    const accessAfter = await supabase.from('access_logs').select('*').eq('worker_id', workerId)

    expect(accessAfter.error).toBeNull()
    expect(accessAfter.data).toHaveLength(1)
    expect(accessAfter.data![0].id).toBe(accessLogId)

    // Verify access log is queryable by organization
    const accessByOrg = await supabase.from('access_logs').select('*').eq('organization_id', orgId)

    expect(accessByOrg.error).toBeNull()
    expect(accessByOrg.data).toHaveLength(1)
    expect(accessByOrg.data![0].id).toBe(accessLogId)
  })

  it('should preserve all historical data simultaneously after worker soft delete', async () => {
    // Verify all data exists before deletion
    const tokensBefore = await supabase
      .from('dashboard_tokens')
      .select('id')
      .eq('worker_id', workerId)

    const smsBefore = await supabase.from('sms_logs').select('id').eq('worker_id', workerId)

    const accessBefore = await supabase.from('access_logs').select('id').eq('worker_id', workerId)

    expect(tokensBefore.data).toHaveLength(1)
    expect(smsBefore.data).toHaveLength(1)
    expect(accessBefore.data).toHaveLength(1)

    // Soft delete the worker
    await workerService.deleteWorker(workerId, orgId)

    // Verify all historical data is preserved after soft delete
    const tokensAfter = await supabase
      .from('dashboard_tokens')
      .select('id')
      .eq('worker_id', workerId)

    const smsAfter = await supabase.from('sms_logs').select('id').eq('worker_id', workerId)

    const accessAfter = await supabase.from('access_logs').select('id').eq('worker_id', workerId)

    expect(tokensAfter.data).toHaveLength(1)
    expect(smsAfter.data).toHaveLength(1)
    expect(accessAfter.data).toHaveLength(1)

    // Verify worker is excluded from active queries but still exists
    const activeWorkers = await workerService.getWorkers(orgId)
    expect(activeWorkers.filter((w) => w.id === workerId)).toHaveLength(0)

    // But historical data queries still work
    const historicalSms = await supabase
      .from('sms_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('sent_at', { ascending: false })

    expect(historicalSms.error).toBeNull()
    expect(historicalSms.data).toHaveLength(1)
    expect(historicalSms.data![0].worker_id).toBe(workerId)
  })

  it('should allow querying historical data by worker ID after soft delete', async () => {
    // Soft delete the worker
    await workerService.deleteWorker(workerId, orgId)

    // Verify we can still query all historical data by the deleted worker's ID
    const workerTokens = await supabase
      .from('dashboard_tokens')
      .select('*')
      .eq('worker_id', workerId)

    const workerSms = await supabase.from('sms_logs').select('*').eq('worker_id', workerId)

    const workerAccess = await supabase.from('access_logs').select('*').eq('worker_id', workerId)

    expect(workerTokens.error).toBeNull()
    expect(workerTokens.data).toHaveLength(1)

    expect(workerSms.error).toBeNull()
    expect(workerSms.data).toHaveLength(1)

    expect(workerAccess.error).toBeNull()
    expect(workerAccess.data).toHaveLength(1)

    // Verify the data integrity
    expect(workerTokens.data![0].id).toBe(tokenId)
    expect(workerSms.data![0].id).toBe(smsLogId)
    expect(workerAccess.data![0].id).toBe(accessLogId)
  })

  it('should demonstrate soft delete vs hard delete difference for historical data', async () => {
    // Create another worker for comparison
    const worker2 = await workerService.createWorker(
      {
        name: 'Worker 2',
        phone: '0423 456 789',
      },
      orgId
    )

    // Create historical data for second worker
    const sms2Result = await supabase
      .from('sms_logs')
      .insert({
        organization_id: orgId,
        worker_id: worker2.id,
        phone_number: '+61423456789',
        message_content: 'Test message 2',
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (sms2Result.error) throw sms2Result.error

    // Soft delete first worker
    await workerService.deleteWorker(workerId, orgId)

    // Hard delete second worker (simulating old behavior)
    await supabase.from('workers').delete().eq('id', worker2.id)

    // Verify soft-deleted worker's historical data is preserved
    const softDeletedSms = await supabase.from('sms_logs').select('*').eq('worker_id', workerId)

    expect(softDeletedSms.error).toBeNull()
    expect(softDeletedSms.data).toHaveLength(1)

    // Verify hard-deleted worker's historical data is lost (worker_id becomes NULL)
    const hardDeletedSms = await supabase.from('sms_logs').select('*').eq('worker_id', worker2.id)

    expect(hardDeletedSms.error).toBeNull()
    expect(hardDeletedSms.data).toHaveLength(0)

    // But we can still find the SMS record by organization
    const orgSms = await supabase.from('sms_logs').select('*').eq('organization_id', orgId)

    expect(orgSms.error).toBeNull()
    expect(orgSms.data).toHaveLength(2) // Both SMS records exist

    // Verify one still references the soft-deleted worker, other has NULL reference
    const smsRecords = orgSms.data!
    expect(smsRecords.some((sms: any) => sms.worker_id === workerId)).toBe(true) // Soft deleted reference preserved
    expect(smsRecords.some((sms: any) => sms.worker_id === null)).toBe(true) // Hard deleted reference set to NULL
  })
})
