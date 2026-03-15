-- Migration 004: SMS 003 Critical Schema Fixes
-- Fixes identified in SMS-003-ASSUMPTIONS-ANALYSIS.md

-- Fix 1: Add auth_user_id column to users table (authentication broken)
ALTER TABLE users 
ADD COLUMN auth_user_id TEXT UNIQUE;

-- Create index for auth_user_id lookup
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Fix 2: Add missing columns to sms_logs table (service layer expects these)
ALTER TABLE sms_logs 
ADD COLUMN provider VARCHAR(50) DEFAULT 'unknown',
ADD COLUMN message_id VARCHAR(255),
ADD COLUMN error_type VARCHAR(20),
ADD COLUMN cost DECIMAL(10,4) DEFAULT 0.0000,
ADD COLUMN delivery_status VARCHAR(20) DEFAULT 'pending';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_sms_logs_provider ON sms_logs(provider);
CREATE INDEX IF NOT EXISTS idx_sms_logs_message_id ON sms_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_error_type ON sms_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_delivery_status ON sms_logs(delivery_status);

-- Fix 3: Add comments for clarity
COMMENT ON COLUMN users.auth_user_id IS 'External authentication system user ID (e.g., Supabase auth)';
COMMENT ON COLUMN sms_logs.provider IS 'SMS provider used (mobile-message, twilio, aws-sns)';
COMMENT ON COLUMN sms_logs.message_id IS 'Provider-specific message ID for tracking';
COMMENT ON COLUMN sms_logs.error_type IS 'Categorized error type (temporary, permanent, rate_limit, invalid_number)';
COMMENT ON COLUMN sms_logs.cost IS 'Actual cost of sending this SMS message';
COMMENT ON COLUMN sms_logs.delivery_status IS 'Current delivery status (pending, sent, delivered, failed)';

-- Fix 4: Update existing records to have sensible defaults
UPDATE sms_logs 
SET provider = 'legacy', 
    message_id = provider_message_id,
    error_type = CASE 
        WHEN error_reason IS NOT NULL THEN 'permanent'
        ELSE NULL
    END,
    delivery_status = status
WHERE provider = 'unknown';

-- Fix 5: Add check constraints for new columns
ALTER TABLE sms_logs 
ADD CONSTRAINT chk_sms_logs_provider 
CHECK (provider IN ('mobile-message', 'twilio', 'aws-sns', 'legacy', 'unknown', 'validation')),
ADD CONSTRAINT chk_sms_logs_error_type 
CHECK (error_type IN ('temporary', 'permanent', 'rate_limit', 'invalid_number') OR error_type IS NULL),
ADD CONSTRAINT chk_sms_logs_delivery_status 
CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
ADD CONSTRAINT chk_sms_logs_cost 
CHECK (cost >= 0);

-- Fix 6: Add trigger to populate message_id from provider_message_id for backward compatibility
CREATE OR REPLACE FUNCTION sync_message_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.message_id IS NULL AND NEW.provider_message_id IS NOT NULL THEN
    NEW.message_id = NEW.provider_message_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_sms_logs_message_id ON sms_logs;
CREATE TRIGGER sync_sms_logs_message_id
  BEFORE INSERT OR UPDATE ON sms_logs
  FOR EACH ROW
  EXECUTE FUNCTION sync_message_id();
