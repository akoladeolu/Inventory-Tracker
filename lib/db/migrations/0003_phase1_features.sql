-- Phase 1 Features Migration
-- Digital Receipts, Push Notifications, Stock Audits

-- 1. Receipt fields on sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS receipt_url text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS receipt_token varchar(64) UNIQUE;

-- 2. Enhanced notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel varchar(20) DEFAULT 'in_app';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata jsonb;

-- 3. Push tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  expo_push_token varchar(255) NOT NULL,
  device_name varchar(100),
  platform varchar(20),
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(user_id, expo_push_token)
);

CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS push_tokens_active_idx ON push_tokens(active);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY push_tokens_policy ON push_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Stock audits table
CREATE TABLE IF NOT EXISTS stock_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_number varchar(50) NOT NULL UNIQUE,
  scope varchar(50) NOT NULL,
  scope_filter jsonb,
  status varchar(20) NOT NULL DEFAULT 'draft',
  started_by uuid NOT NULL REFERENCES users(id),
  reviewed_by uuid REFERENCES users(id),
  total_expected integer NOT NULL DEFAULT 0,
  total_counted integer NOT NULL DEFAULT 0,
  total_variance integer NOT NULL DEFAULT 0,
  variance_value decimal(10,2) NOT NULL DEFAULT 0,
  notes text,
  started_at timestamp NOT NULL DEFAULT now(),
  completed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_audits_status_idx ON stock_audits(status);
CREATE INDEX IF NOT EXISTS stock_audits_started_by_idx ON stock_audits(started_by);

ALTER TABLE stock_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_audits_policy ON stock_audits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Stock audit items table
CREATE TABLE IF NOT EXISTS stock_audit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES stock_audits(id),
  product_id uuid NOT NULL REFERENCES products(id),
  expected_quantity integer NOT NULL,
  counted_quantity integer,
  variance integer,
  variance_reason varchar(50),
  variance_notes text,
  scanned_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(audit_id, product_id)
);

CREATE INDEX IF NOT EXISTS stock_audit_items_audit_idx ON stock_audit_items(audit_id);
CREATE INDEX IF NOT EXISTS stock_audit_items_product_idx ON stock_audit_items(product_id);

ALTER TABLE stock_audit_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_audit_items_policy ON stock_audit_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Add audit_adjustment to stock_movement_type enum
ALTER TYPE stock_movement_type ADD VALUE IF NOT EXISTS 'audit_adjustment';
