import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';

const organizations = new Hono();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// All routes require authentication
organizations.use('*', authMiddleware);

// Get current organization
organizations.get('/current', async (c) => {
  const userId = c.get('userId');

  const { data: admin } = await supabase
    .from('admins')
    .select('*, organizations(*)')
    .eq('auth_user_id', userId)
    .single();

  if (!admin) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  return c.json(admin.organizations);
});

// Update organization settings
organizations.put('/current', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const { data: admin } = await supabase
    .from('admins')
    .select('organization_id')
    .eq('auth_user_id', userId)
    .single();

  if (!admin) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const { data, error } = await supabase
    .from('organizations')
    .update({
      name: body.name,
      settings: body.settings,
    })
    .eq('id', admin.organization_id)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json(data);
});

export default organizations;
