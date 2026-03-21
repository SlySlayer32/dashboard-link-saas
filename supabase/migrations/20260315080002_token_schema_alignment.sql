-- Migration 006: Token System Schema Alignment
-- Aligns dashboard_tokens table with tokens package expectations

-- Add missing columns that tokens package expects
ALTER TABLE dashboard_tokens 
ADD COLUMN user_id UUID,
ADD COLUMN session_id TEXT,
ADD COLUMN payload JSONB DEFAULT '{}',
ADD COLUMN last_used_at TIMESTAMPTZ,
ADD COLUMN revoked BOOLEAN DEFAULT FALSE,
ADD COLUMN revoked_by UUID REFERENCES users(id),
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_dashboard_tokens_user_id ON dashboard_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_tokens_session_id ON dashboard_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_tokens_last_used_at ON dashboard_tokens(last_used_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_tokens_revoked ON dashboard_tokens(revoked);
CREATE INDEX IF NOT EXISTS idx_dashboard_tokens_revoked_by ON dashboard_tokens(revoked_by);

-- Add comments for clarity
COMMENT ON COLUMN dashboard_tokens.user_id IS 'User ID from users table (maps to id in users table)';
COMMENT ON COLUMN dashboard_tokens.session_id IS 'Optional session identifier for multi-session support';
COMMENT ON COLUMN dashboard_tokens.payload IS 'Token payload data (JSON) - required by tokens package';
COMMENT ON COLUMN dashboard_tokens.last_used_at IS 'Timestamp when token was last used/validated';
COMMENT ON COLUMN dashboard_tokens.revoked IS 'Whether the token has been revoked';
COMMENT ON COLUMN dashboard_tokens.revoked_by IS 'User who revoked this token';
COMMENT ON COLUMN dashboard_tokens.metadata IS 'Additional token metadata (JSON) - required by tokens package';

-- Create a trigger to populate user_id from worker relationship
-- This maps worker tokens to the user who generated them
CREATE OR REPLACE FUNCTION populate_token_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is not set but worker_id is, try to find the associated user
  IF NEW.user_id IS NULL AND NEW.worker_id IS NOT NULL THEN
    SELECT u.id 
    INTO NEW.user_id
    FROM workers w
    JOIN users u ON u.organization_id = w.organization_id
    WHERE w.id = NEW.worker_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically populate user_id
DROP TRIGGER IF EXISTS populate_dashboard_token_user_id ON dashboard_tokens;
CREATE TRIGGER populate_dashboard_token_user_id
  BEFORE INSERT OR UPDATE ON dashboard_tokens
  FOR EACH ROW
  EXECUTE FUNCTION populate_token_user_id();

-- Update existing records to have sensible defaults
UPDATE dashboard_tokens 
SET 
  user_id = (SELECT u.id FROM users u WHERE u.organization_id = dashboard_tokens.organization_id LIMIT 1),
  payload = jsonb_build_object(
    'userId', COALESCE((SELECT u.id::text FROM users u WHERE u.organization_id = dashboard_tokens.organization_id LIMIT 1), worker_id::text),
    'organizationId', organization_id,
    'workerId', worker_id,
    'permissions', jsonb_build_array('worker:access', 'sms:receive'),
    'role', 'worker'
  ),
  metadata = jsonb_build_object(
    'tokenType', 'dashboard',
    'generatedFor', 'worker_dashboard_access',
    'version', '1.0'
  )
WHERE user_id IS NULL;

-- Create a view that matches exactly what the tokens package expects
-- This provides a compatibility layer
CREATE OR REPLACE VIEW tokens AS
SELECT 
  id,
  token_hash,
  user_id,
  organization_id,
  session_id,
  payload::text as payload, -- Convert to text as expected by tokens package
  expires_at,
  created_at,
  last_used_at,
  revoked,
  revoked_at,
  revoked_by,
  metadata::text as metadata -- Convert to text as expected by tokens package
FROM dashboard_tokens;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tokens TO service_role;

-- Note: RLS is handled by the underlying dashboard_tokens table
-- The tokens view inherits security from the base table

COMMENT ON VIEW tokens IS 'Compatibility view for tokens package - maps dashboard_tokens to expected schema';
