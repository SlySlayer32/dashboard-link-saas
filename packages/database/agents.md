# Database Package Guidelines

When working with files in this directory:

## Purpose
Database schema definitions, SQL migrations, seed data, and Row Level Security (RLS) policies for the CleanConnect multi-tenant platform.

## Architecture
```
src/
├── migrations/      # SQL migration files
│   ├── 001_initial_schema.sql
│   ├── 002_add_rls_policies.sql
│   └── 003_add_plugins.sql
├── seeds/          # Development seed data
│   ├── development.sql
│   └── test.sql
├── functions/      # PostgreSQL functions
│   ├── get_user_organization_id.sql
│   └── audit_helpers.sql
├── policies/       # RLS policies
│   ├── workers.sql
│   ├── organizations.sql
│   └── dashboards.sql
└── types/          # Database-specific types
    └── index.ts
```

## File Naming Conventions
- Migrations: Numbered prefix with descriptive name (e.g., `001_initial_schema.sql`)
- Seeds: Environment-based naming (e.g., `development.sql`, `test.sql`)
- Functions: snake_case (e.g., `get_user_organization_id.sql`)
- Policies: Table-based naming (e.g., `workers_policies.sql`)

## Core Tables

### Multi-Tenancy Root
```sql
-- organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Tables
```sql
-- admins
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  auth_user_id UUID REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- workers
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, phone)
);
```

### Dashboard System
```sql
-- worker_tokens
CREATE TABLE worker_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  revoked BOOLEAN DEFAULT false
);

-- dashboards
CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  worker_id UUID NOT NULL REFERENCES workers(id),
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(worker_id)
);

-- dashboard_widgets
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id),
  plugin_id TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  "order" INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS)

### Enable RLS
```sql
-- Enable on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables
```

### Helper Functions
```sql
-- Get organization ID for current user
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM admins
  WHERE auth_user_id = auth.uid();
  
  RETURN org_id;
END;
$$;
```

### Policy Examples
```sql
-- Workers policy
CREATE POLICY "Organization isolation" ON workers
  FOR ALL
  USING (organization_id = get_user_organization_id());

-- Admins policy
CREATE POLICY "Admins can view their org" ON admins
  FOR SELECT
  USING (organization_id = get_user_organization_id());
```

## Migration Guidelines

### Migration Structure
```sql
-- Migration: 001_initial_schema.sql
-- Description: Create initial database schema

BEGIN;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE organizations (...);

-- Create indexes
CREATE INDEX idx_workers_org_id ON workers(organization_id);
CREATE INDEX idx_workers_phone ON workers(phone);

-- Create functions
CREATE OR REPLACE FUNCTION get_user_organization_id() (...);

COMMIT;
```

### Migration Rules
- Always use transactions (BEGIN/COMMIT)
- Include descriptive comments
- Create necessary indexes
- Add constraints last
- Test rollback procedures

## Index Strategy
- All foreign keys indexed
- Query patterns optimized
- Composite indexes for common filters
- Partial indexes for active data

## Data Types
- UUID for primary keys
- TIMESTAMP WITH TIME ZONE for dates
- JSONB for flexible metadata
- TEXT for variable strings
- BOOLEAN for flags
- Arrays for simple lists

## Constraints
- Foreign key relationships
- Unique constraints where needed
- CHECK constraints for data validity
- NOT NULL for required fields

## Seed Data
```sql
-- Development seed
INSERT INTO organizations (id, name) VALUES 
  ('dev-org-1', 'Test Organization'),
  ('dev-org-2', 'Demo Company');

INSERT INTO admins (organization_id, auth_user_id, email, name) VALUES
  ('dev-org-1', 'auth-user-1', 'admin@test.com', 'Test Admin');
```

## Testing
- Unit tests for functions
- Integration tests for migrations
- RLS policy testing
- Performance testing with sample data

## Security
- Always validate organization_id
- Use parameterized queries
- No dynamic SQL without sanitization
- Audit trail for sensitive operations

## Performance
- Optimize query patterns
- Use EXPLAIN ANALYZE
- Monitor slow queries
- Consider partitioning for large tables

## Backup Strategy
- Regular automated backups
- Point-in-time recovery enabled
- Test restore procedures
- Document backup retention

## Common Patterns

### Soft Deletes
```sql
ALTER TABLE workers ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_workers_deleted_at ON workers(deleted_at) WHERE deleted_at IS NOT NULL;
```

### Audit Trail
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Version Tracking
```sql
ALTER TABLE dashboards ADD COLUMN version INTEGER DEFAULT 1;
CREATE TRIGGER update_version 
  BEFORE UPDATE ON dashboards
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();
```
