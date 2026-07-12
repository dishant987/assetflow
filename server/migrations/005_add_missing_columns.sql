ALTER TABLE allocations ADD COLUMN IF NOT EXISTS expected_return_at TIMESTAMP;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS condition VARCHAR(50);
ALTER TABLE audit_cycles ADD COLUMN IF NOT EXISTS scope_department_id UUID REFERENCES departments(id);
ALTER TABLE audit_cycles ADD COLUMN IF NOT EXISTS scope_location VARCHAR(255);
ALTER TABLE audit_cycles ADD COLUMN IF NOT EXISTS auditor_ids JSONB DEFAULT '[]'::jsonb;
