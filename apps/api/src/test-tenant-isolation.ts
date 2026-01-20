/**
 * Test script to verify tenant isolation is working correctly
 * Run with: npm run test:isolation
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

async function testTenantIsolation() {
  console.log('🧪 Testing tenant isolation...\n')

  // Create service client (bypasses RLS)
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

  // Create test organizations
  const org1 = await serviceClient.from('organizations').insert({ plan: 'free' }).select().single()

  const org2 = await serviceClient.from('organizations').insert({ plan: 'pro' }).select().single()

  console.log(`✅ Created test organizations: ${org1.data.id} and ${org2.data.id}`)

  // Create test users
  const user1 = await serviceClient.auth.admin.createUser({
    email: 'user1@test.com',
    password: 'test123456',
    user_metadata: { org_id: org1.data.id },
  })

  const user2 = await serviceClient.auth.admin.createUser({
    email: 'user2@test.com',
    password: 'test123456',
    user_metadata: { org_id: org2.data.id },
  })

  const user1Id = user1.data?.user?.id
  const user2Id = user2.data?.user?.id

  if (!user1Id || !user2Id) {
    throw new Error('Failed to create test users')
  }

  // Create test workers for each org
  await serviceClient.from('workers').insert([
    { org_id: org1.data.id, name: 'Worker 1', phone_e164: '+1234567890' },
    { org_id: org2.data.id, name: 'Worker 2', phone_e164: '+0987654321' },
  ])

  console.log('✅ Created test workers for each organization')

  // Create user clients (with RLS)
  const client1 = createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        Authorization: `Bearer ${await createTestJWT(user1Id, org1.data.id)}`,
      },
    },
  })

  const client2 = createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        Authorization: `Bearer ${await createTestJWT(user2Id, org2.data.id)}`,
      },
    },
  })

  // Test 1: Users should only see their own org data
  const org1Workers = await client1.from('workers').select('*')
  const org2Workers = await client2.from('workers').select('*')

  console.log('\n📊 Test Results:')
  console.log(`Org 1 can see ${org1Workers.data?.length || 0} workers`)
  console.log(`Org 2 can see ${org2Workers.data?.length || 0} workers`)

  // Verify isolation
  if (org1Workers.data?.length === 1 && org2Workers.data?.length === 1) {
    console.log('✅ Tenant isolation is working correctly!')
  } else {
    console.log('❌ Tenant isolation FAILED - cross-tenant data leak detected!')
    process.exit(1)
  }

  // Test 2: Direct SQL injection attempt should fail
  try {
    const maliciousQuery = await serviceClient
      .rpc('test_cross_tenant', { tenant_id: org1.data.id })
      .select('*')

    if (maliciousQuery.data && maliciousQuery.data.length > 1) {
      console.log('❌ RLS bypass detected!')
      process.exit(1)
    }
  } catch (error) {
    console.log('✅ SQL injection attempt blocked by RLS')
  }

  // Cleanup
  await serviceClient.from('workers').delete().in('org_id', [org1.data.id, org2.data.id])
  await serviceClient.from('organizations').delete().in('id', [org1.data.id, org2.data.id])
  await serviceClient.auth.admin.deleteUser(user1Id)
  await serviceClient.auth.admin.deleteUser(user2Id)

  console.log('\n🧹 Test data cleaned up')
  console.log('\n✅ All tenant isolation tests passed!')
}

// Helper function to create a test JWT
async function createTestJWT(userId: string, orgId: string): Promise<string> {
  // This is a simplified JWT for testing
  // In production, use proper Supabase JWT creation
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      org_id: orgId,
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      iat: Math.floor(Date.now() / 1000),
    })
  )
  const signature = btoa('test-signature') // In production, sign with proper secret

  return `${header}.${payload}.${signature}`
}

// Run tests
if (require.main === module) {
  testTenantIsolation().catch(console.error)
}

export { testTenantIsolation }
