-- Seed data for CleanConnect MVP development
-- Based on specs/001-sms-dashboard-mvp/data-model.md

-- Insert test organization
INSERT INTO organizations (id, name, slug, sms_limit_per_hour, default_token_expiry_hours, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Acme Cleaning Co', 'acme-cleaning', 100, 8, 'free')
ON CONFLICT (id) DO NOTHING;

-- Insert test admin user
-- Note: In production, this would be created via Supabase Auth
INSERT INTO users (id, organization_id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'admin@acme.com', 'Admin User', 'owner')
ON CONFLICT (id) DO NOTHING;

-- Insert test workers
INSERT INTO workers (id, organization_id, full_name, phone_number, calendar_email)
VALUES 
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'John Doe', '+61412345678', 'john@acme.com'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Jane Smith', '+61423456789', 'jane@acme.com'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Bob Wilson', '+61434567890', 'bob@acme.com')
ON CONFLICT (id) DO NOTHING;
