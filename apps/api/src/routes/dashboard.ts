import { createClient } from '@supabase/supabase-js';
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

const dashboard = new Hono();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// All routes require authentication
dashboard.use('*', authMiddleware);

// Get dashboard statistics
dashboard.get('/stats', async (c) => {
  // @ts-expect-error - Hono context typing issue
  const userId = c.get('userId');

  try {
    // Get user's organization
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('organization_id')
      .eq('auth_user_id', userId)
      .single();

    if (adminError || !admin) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const orgId = admin.organization_id;

    // Get worker stats
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('active')
      .eq('organization_id', orgId);

    if (workersError) throw workersError;

    const totalWorkers = workers?.length || 0;
    const activeWorkers = workers?.filter(w => w.active).length || 0;
    const inactiveWorkers = totalWorkers - activeWorkers;

    // Get SMS stats for today
    const today = new Date().toISOString().split('T')[0];
    const { data: todaySms, error: todaySmsError } = await supabase
      .from('sms_logs')
      .select('id')
      .eq('organization_id', orgId)
      .gte('created_at', today);

    if (todaySmsError) throw todaySmsError;

    const smsToday = todaySms?.length || 0;

    // Get SMS stats for this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartIso = weekStart.toISOString();

    const { data: weekSms, error: weekSmsError } = await supabase
      .from('sms_logs')
      .select('id')
      .eq('organization_id', orgId)
      .gte('created_at', weekStartIso);

    if (weekSmsError) throw weekSmsError;

    const smsThisWeek = weekSms?.length || 0;

    // Get recent SMS activity (last 10)
    const { data: recentSms, error: recentSmsError } = await supabase
      .from('sms_logs')
      .select(`
        id,
        message,
        status,
        created_at,
        worker_id,
        workers (
          name,
          phone
        )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentSmsError) throw recentSmsError;

    return c.json({
      stats: {
        totalWorkers,
        activeWorkers,
        inactiveWorkers,
        smsToday,
        smsThisWeek,
      },
      recentActivity: recentSms || [],
    });
  } catch (error) {
  return c.json(
    { error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' },
    500
  );
}
});

export default dashboard;
