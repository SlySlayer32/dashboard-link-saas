import { createClient } from '@supabase/supabase-js'
import { Hono } from 'hono'

const auth = new Hono()

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '')

/**
 * Auth routes
 * Most auth is handled by Supabase Auth, but we provide some helper endpoints
 */

// Login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !data.session || !data.user) {
    return c.json({ error: signInError?.message || 'Login failed' }, 400)
  }

  // Return the expected format for the frontend
  return c.json({
    user: data.user,
    token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  })
})

// Signup (for admins)
auth.post('/signup', async (c) => {
  const { email, password, name, organizationName } = await c.req.json()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError || !authData.user || !authData.session) {
    return c.json({ error: authError?.message || 'Signup failed' }, 400)
  }

  try {
    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: organizationName })
      .select()
      .single()

    if (orgError) throw orgError

    // Create admin profile
    const { error: adminError } = await supabase.from('admins').insert({
      organization_id: org.id,
      auth_user_id: authData.user.id,
      email,
      name,
    })

    if (adminError) throw adminError

    return c.json({
      user: authData.user,
      organization: org,
    })
  } catch (error) {
    // Cleanup: delete auth user if org/admin creation failed
    if (authData.user?.id) {
      await supabase.auth.admin.deleteUser(authData.user.id)
    }

    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create account',
      },
      500
    )
  }
})

// Refresh token
auth.post('/refresh', async (c) => {
  const { refresh_token } = await c.req.json()

  if (!refresh_token) {
    return c.json({ error: 'Refresh token required' }, 400)
  }

  const { data, error: refreshError } = await supabase.auth.refreshSession({
    refresh_token,
  })

  if (refreshError || !data.session || !data.user) {
    return c.json({ error: refreshError?.message || 'Token refresh failed' }, 401)
  }

  return c.json({
    token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    user: data.user,
  })
})

// Logout
auth.post('/logout', async (c) => {
  await supabase.auth.signOut()
  return c.json({ message: 'Logged out' })
})

// Get current user
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Get admin profile
  const { data: admin } = await supabase
    .from('admins')
    .select('*, organizations(*)')
    .eq('auth_user_id', user.id)
    .single()

  return c.json({
    user,
    admin,
  })
})

export default auth
