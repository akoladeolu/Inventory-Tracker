-- Phase 3: Product Variants & Serial Tracking Migration

ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants boolean DEFAULT false NOT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_serial boolean DEFAULT false NOT NULL;

ALTER TABLE brands ADD COLUMN IF NOT EXISTS requires_serial_tracking boolean DEFAULT false NOT NULL;

ALTER TABLE categories ADD COLUMN IF NOT EXISTS variant_attributes jsonb;

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku varchar(100) NOT NULL UNIQUE,
  barcode varchar(100) UNIQUE,
  attribute_1_name varchar(100),
  attribute_1_value varchar(100),
  attribute_2_name varchar(100),
  attribute_2_value varchar(100),
  cost_price decimal(10,2) NOT NULL,
  selling_price decimal(10,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  image_url text,
  status product_status NOT NULL DEFAULT 'active',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_variants_product_idx ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS product_variants_sku_idx ON product_variants(sku);
CREATE INDEX IF NOT EXISTS product_variants_barcode_idx ON product_variants(barcode);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_variants_policy ON product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS serial_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  variant_id uuid REFERENCES product_variants(id),
  serial_number varchar(100) NOT NULL UNIQUE,
  status varchar(20) NOT NULL DEFAULT 'in_stock',
  sale_id uuid REFERENCES sales(id),
  customer_name varchar(255),
  warranty_expiry timestamp,
  notes text DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS serial_numbers_product_idx ON serial_numbers(product_id);
CREATE INDEX IF NOT EXISTS serial_numbers_variant_idx ON serial_numbers(variant_id);
CREATE INDEX IF NOT EXISTS serial_numbers_serial_idx ON serial_numbers(serial_number);
CREATE INDEX IF NOT EXISTS serial_numbers_status_idx ON serial_numbers(status);

ALTER TABLE serial_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY serial_numbers_policy ON serial_numbers FOR ALL TO authenticated USING (true) WITH CHECK (true);
