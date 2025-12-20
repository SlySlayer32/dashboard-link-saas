-- Seed data for testing

-- Insert test organization
INSERT INTO organizations (id, name, settings) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Demo Cleaning Company', '{"sms_sender_id": "CleanCo", "default_token_expiry": 86400}');

-- Note: Admins should be created through Supabase Auth signup flow
-- This is just placeholder data
-- In production, admins.auth_user_id would reference real auth.users records

-- Insert test workers
INSERT INTO workers (id, organization_id, name, phone, email, active) VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'John Smith', '+61412345678', 'john@example.com', true),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Jane Doe', '+61423456789', 'jane@example.com', true),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Bob Wilson', '+61434567890', 'bob@example.com', true);

-- Insert plugin config for manual entry
INSERT INTO plugin_configs (organization_id, plugin_id, config, active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'manual', '{}', true);

-- Create dashboards for workers
INSERT INTO dashboards (id, organization_id, worker_id, name, active) VALUES
    ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'John''s Dashboard', true),
    ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Jane''s Dashboard', true),
    ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Bob''s Dashboard', true);

-- Add manual plugin widgets to dashboards
INSERT INTO dashboard_widgets (dashboard_id, plugin_id, config, "order", active) VALUES
    ('20000000-0000-0000-0000-000000000001', 'manual', '{}', 1, true),
    ('20000000-0000-0000-0000-000000000002', 'manual', '{}', 1, true),
    ('20000000-0000-0000-0000-000000000003', 'manual', '{}', 1, true);

-- Insert sample manual schedule items for today
INSERT INTO manual_schedule_items (organization_id, worker_id, title, start_time, end_time, location, description) VALUES
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Office Building - Level 3', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '4 hours', '123 Collins St, Melbourne', 'Deep clean all offices'),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Retail Store', NOW() + INTERVAL '5 hours', NOW() + INTERVAL '7 hours', '456 Bourke St, Melbourne', 'Floor cleaning and restocking'),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Residential Complex', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '5 hours', '789 Lonsdale St, Melbourne', 'Common areas and hallways'),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Medical Center', NOW() + INTERVAL '3 hours', NOW() + INTERVAL '6 hours', '321 Swanston St, Melbourne', 'Sanitization and deep clean');

-- Insert sample manual tasks
INSERT INTO manual_task_items (organization_id, worker_id, title, description, due_date, priority, status) VALUES
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Restock cleaning supplies', 'Check inventory and restock from van', NOW() + INTERVAL '1 hour', 'high', 'pending'),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Submit timesheet', 'Submit hours for the week', NOW() + INTERVAL '8 hours', 'medium', 'pending'),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Equipment inspection', 'Check vacuum and floor polisher', NOW() + INTERVAL '2 hours', 'high', 'pending'),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Client feedback', 'Follow up with facility manager', NOW() + INTERVAL '6 hours', 'low', 'pending');
