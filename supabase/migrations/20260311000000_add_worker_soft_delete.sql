-- Migration: Add soft delete and complete worker schema alignment
-- Aligns with specs/001-worker-management/spec.md requirements
-- Completes full schema alignment: column renames, new columns, indexes

-- Rename columns to match spec naming
ALTER TABLE workers RENAME COLUMN full_name TO name;
ALTER TABLE workers RENAME COLUMN phone_number TO phone;
ALTER TABLE workers RENAME COLUMN calendar_email TO email;

-- Update name length constraint to 255 characters (FR-018)
ALTER TABLE workers DROP CONSTRAINT workers_full_name_check;
ALTER TABLE workers ADD CONSTRAINT workers_name_check CHECK (length(name) BETWEEN 1 AND 255);

-- Add soft delete column (FR-010)
ALTER TABLE workers ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add active column (default true for existing workers)
ALTER TABLE workers ADD COLUMN active BOOLEAN DEFAULT TRUE NOT NULL;

-- Add metadata column for extensibility
ALTER TABLE workers ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Drop old phone index
DROP INDEX IF EXISTS idx_workers_phone;

-- Add partial index for active workers only (performance optimization)
CREATE INDEX idx_workers_org_active ON workers(organization_id, deleted_at) WHERE deleted_at IS NULL;

-- Add unique constraint on phone per org for active workers only (FR-016)
CREATE UNIQUE INDEX idx_workers_phone_org_active ON workers(phone, organization_id) WHERE deleted_at IS NULL;

-- Add index for phone lookups
CREATE INDEX idx_workers_phone ON workers(phone) WHERE deleted_at IS NULL;

-- Update email index to filter deleted workers (renamed from calendar_email)
DROP INDEX IF EXISTS idx_workers_calendar_email;
CREATE INDEX idx_workers_email ON workers(email) WHERE email IS NOT NULL AND deleted_at IS NULL;

-- Add index for deleted_at filtering (performance optimization)
CREATE INDEX idx_workers_deleted_at ON workers(deleted_at) WHERE deleted_at IS NULL;

-- Add E.164 phone format constraint (FR-015)
ALTER TABLE workers ADD CONSTRAINT check_phone_e164 CHECK (phone ~ '^\+[1-9]\d{1,14}$');

-- Add trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS update_workers_updated_at ON workers;
CREATE TRIGGER update_workers_updated_at 
BEFORE UPDATE ON workers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comment for documentation
COMMENT ON COLUMN workers.deleted_at IS 'Soft delete timestamp. NULL = active worker, NOT NULL = deleted worker (FR-010)';
COMMENT ON COLUMN workers.active IS 'Worker active status. Inactive workers cannot receive SMS but are not deleted';
COMMENT ON COLUMN workers.metadata IS 'Extensible JSONB field for future worker attributes';
