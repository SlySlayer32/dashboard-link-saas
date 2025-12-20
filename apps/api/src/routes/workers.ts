import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { formatAustralianPhone } from '@dashboard-link/shared';

const workers = new Hono();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// All routes require authentication
workers.use('*', authMiddleware);

// List workers
workers.get('/', async (c) => {
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId');

  // Get user's organization
  const { data: admin } = await supabase
    .from('admins')
    .select('organization_id')
    .eq('auth_user_id', userId)
    .single();

  if (!admin) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('organization_id', admin.organization_id)
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

// Get worker by ID
workers.get('/:id', async (c) => {
  const id = c.req.param('id');
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId');

  const { data: admin } = await supabase
    .from('admins')
    .select('organization_id')
    .eq('auth_user_id', userId)
    .single();

  if (!admin) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('id', id)
    .eq('organization_id', admin.organization_id)
    .single();

  if (error) {
    return c.json({ error: error.message }, 404);
  }

  return c.json(data);
});

// Create worker
workers.post('/', async (c) => {
  // @ts-ignore - Hono context typing issue
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

  try {
    // Format phone number
    const formattedPhone = formatAustralianPhone(body.phone);

    const { data, error } = await supabase
      .from('workers')
      .insert({
        organization_id: admin.organization_id,
        name: body.name,
        phone: formattedPhone,
        email: body.email,
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    // Create default dashboard for worker
    const { data: dashboard } = await supabase
      .from('dashboards')
      .insert({
        organization_id: admin.organization_id,
        worker_id: data.id,
        name: `${body.name}'s Dashboard`,
        active: true,
      })
      .select()
      .single();

    return c.json({ worker: data, dashboard }, 201);
  } catch (error) {
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to create worker' 
    }, 400);
  }
});

// Update worker
workers.put('/:id', async (c) => {
  const id = c.req.param('id');
  // @ts-ignore - Hono context typing issue
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

  const updateData: any = {};
  if (body.name) updateData.name = body.name;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.active !== undefined) updateData.active = body.active;
  if (body.metadata) updateData.metadata = body.metadata;
  if (body.phone) updateData.phone = formatAustralianPhone(body.phone);

  const { data, error } = await supabase
    .from('workers')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', admin.organization_id)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json(data);
});

// Delete worker
workers.delete('/:id', async (c) => {
  const id = c.req.param('id');
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId');

  const { data: admin } = await supabase
    .from('admins')
    .select('organization_id')
    .eq('auth_user_id', userId)
    .single();

  if (!admin) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const { error } = await supabase
    .from('workers')
    .delete()
    .eq('id', id)
    .eq('organization_id', admin.organization_id);

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({ message: 'Worker deleted' });
});

export default workers;
