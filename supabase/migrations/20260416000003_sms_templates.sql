-- Migration 004: SMS templates for dashboard link messaging

CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1600),
  category TEXT NOT NULL CHECK (category IN ('dashboard_link')),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_sms_templates_updated_at
  BEFORE UPDATE ON sms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY sms_templates_tenant_isolation ON sms_templates
  FOR ALL USING (organization_id = current_setting('app.tenant_id', true)::uuid);

CREATE INDEX idx_sms_templates_org_category ON sms_templates(organization_id, category);
CREATE INDEX idx_sms_templates_org_name ON sms_templates(organization_id, name);
CREATE UNIQUE INDEX idx_sms_templates_default_per_category
  ON sms_templates(organization_id, category)
  WHERE is_default = TRUE;
