import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

const directUrl = "postgresql://postgres.lezxzbqykcwbakahgemx:WYWS%2B2_hGRL%21zSd@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
const migrationClient = postgres(directUrl, { max: 1, ssl: { rejectUnauthorized: false } });
const db = drizzle(migrationClient);

const rpcSQL = sql`
-- Drop any previous function overload to avoid signature conflicts
DROP FUNCTION IF EXISTS create_sale_transaction(text, text, numeric, numeric, numeric, text, jsonb);
DROP FUNCTION IF EXISTS create_sale_transaction(text, text, numeric, numeric, numeric, payment_method, uuid, uuid, jsonb);
DROP FUNCTION IF EXISTS create_sale_transaction(text, text, numeric, numeric, numeric, text, uuid, uuid, jsonb);

CREATE OR REPLACE FUNCTION create_sale_transaction(
  p_customer_name text DEFAULT 'Walk-in Customer',
  p_customer_phone text DEFAULT '',
  p_subtotal numeric DEFAULT 0,
  p_discount numeric DEFAULT 0,
  p_total numeric DEFAULT 0,
  p_payment_method text DEFAULT 'cash',
  p_sale_items jsonb DEFAULT '[]'::jsonb,
  p_user_id uuid DEFAULT NULL,
  p_coupon_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id uuid;
  v_invoice_number text;
  v_item record;
  v_prev_qty integer;
  v_new_qty integer;
  v_threshold integer;
  v_prod_name text;
  v_prod_sku text;
  v_effective_user_id uuid;
  v_items_jsonb jsonb;
BEGIN
  -- Determine user_id (if not provided directly)
  v_effective_user_id := p_user_id;
  IF v_effective_user_id IS NULL THEN
    SELECT id INTO v_effective_user_id 
    FROM users 
    WHERE auth_id = auth.uid() 
    LIMIT 1;
  END IF;

  IF v_effective_user_id IS NULL THEN
    SELECT id INTO v_effective_user_id FROM users ORDER BY created_at ASC LIMIT 1;
  END IF;

  -- Generate invoice number
  v_invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((floor(random() * 8999 + 1000))::text, 4, '0');

  -- Parse items input whether passed as a JSON string or JSONB array
  IF jsonb_typeof(p_sale_items) = 'string' THEN
    v_items_jsonb := (p_sale_items#>>'{}')::jsonb;
  ELSE
    v_items_jsonb := p_sale_items;
  END IF;

  -- 1. Create sale record
  INSERT INTO sales (
    invoice_number,
    customer_name,
    customer_phone,
    subtotal,
    discount,
    total,
    payment_method,
    user_id,
    coupon_id
  ) VALUES (
    v_invoice_number,
    COALESCE(p_customer_name, 'Walk-in Customer'),
    COALESCE(p_customer_phone, ''),
    p_subtotal,
    p_discount,
    p_total,
    p_payment_method::payment_method,
    v_effective_user_id,
    p_coupon_id
  ) RETURNING id INTO v_sale_id;

  -- 1.5 Increment coupon usage count if coupon was used
  IF p_coupon_id IS NOT NULL THEN
    UPDATE coupons
    SET 
      usage_count = usage_count + 1,
      updated_at = now()
    WHERE id = p_coupon_id;
  END IF;

  -- 2. Process each item in the items JSON array
  FOR v_item IN 
    SELECT * FROM jsonb_to_recordset(v_items_jsonb) AS x(product_id uuid, quantity integer, unit_price numeric, subtotal numeric) 
  LOOP
    -- Insert sale item
    INSERT INTO sale_items (
      sale_id,
      product_id,
      quantity,
      unit_price,
      total
    ) VALUES (
      v_sale_id,
      v_item.product_id,
      v_item.quantity,
      v_item.unit_price,
      COALESCE(v_item.subtotal, v_item.quantity * v_item.unit_price)
    );

    -- Get current product quantity, name, sku, and threshold
    SELECT quantity, name, sku, COALESCE(low_stock_threshold, 10) 
    INTO v_prev_qty, v_prod_name, v_prod_sku, v_threshold
    FROM products
    WHERE id = v_item.product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_item.product_id;
    END IF;

    v_new_qty := COALESCE(v_prev_qty, 0) - v_item.quantity;

    IF v_new_qty < 0 THEN
      RAISE EXCEPTION 'Insufficient stock for product "%" (SKU: %). Available: %, Requested: %', 
        v_prod_name, v_prod_sku, COALESCE(v_prev_qty, 0), v_item.quantity;
    END IF;

    -- Update product quantity
    UPDATE products
    SET 
      quantity = v_new_qty,
      updated_at = now()
    WHERE id = v_item.product_id;

    -- Trigger low stock notification if threshold crossed
    IF v_new_qty <= v_threshold THEN
      INSERT INTO notifications (
        type,
        title,
        message
      ) VALUES (
        'low_stock',
        'Low Stock Alert',
        'Product "' || v_prod_name || '" (' || v_prod_sku || ') is low in stock. Current quantity: ' || v_new_qty || '.'
      );
    END IF;

    -- Sync inventory table
    INSERT INTO inventory (
      product_id,
      quantity,
      updated_at
    ) VALUES (
      v_item.product_id,
      v_new_qty,
      now()
    )
    ON CONFLICT (product_id) DO UPDATE SET 
      quantity = v_new_qty,
      updated_at = now();

    -- Create stock movement record
    INSERT INTO stock_movements (
      product_id,
      type,
      quantity,
      previous_quantity,
      new_quantity,
      user_id,
      notes
    ) VALUES (
      v_item.product_id,
      'sale',
      v_item.quantity,
      v_prev_qty,
      v_new_qty,
      v_effective_user_id,
      'Sale ' || v_invoice_number
    );
  END LOOP;

  RETURN v_invoice_number;
END;
$$;
`;

async function main() {
  try {
    console.log("Executing RPC creation migration...");
    await db.execute(rpcSQL);
    console.log("RPC created successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

main();

