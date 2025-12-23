import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';

const auth = new Hono();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * Auth routes
 * Most auth is handled by Supabase Auth, but we provide some helper endpoints
 */

// Login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json(data);
});

// Signup (for admins)
auth.post('/signup', async (c) => {
  const { email, password, name, organizationName } = await c.req.json();

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return c.json({ error: authError?.message || 'Signup failed' }, 400);
  }

  try {
    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: organizationName })
      .select()
      .single();

    if (orgError) throw orgError;

    // Create admin profile
    const { error: adminError } = await supabase.from('admins').insert({
      organization_id: org.id,
      auth_user_id: authData.user.id,
      email,
      name,
    });

    if (adminError) throw adminError;

    return c.json({
      user: authData.user,
      organization: org,
    });
  } catch (error) {
    // Cleanup: delete auth user if org/admin creation failed
    await supabase.auth.admin.deleteUser(authData.user.id);
    
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to create account' 
    }, 500);
  }
});

// Logout
auth.post('/logout', async (c) => {
  await supabase.auth.signOut();
  return c.json({ message: 'Logged out' });
});

// Get current user
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Get admin profile
  const { data: admin } = await supabase
    .from('admins')
    .select('*, organizations(*)')
    .eq('auth_user_id', user.id)
    .single();

  return c.json({
    user,
    admin,
  });
});

export default auth;
