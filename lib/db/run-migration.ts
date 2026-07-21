import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

const directUrl = "postgresql://postgres.lezxzbqykcwbakahgemx:WYWS%2B2_hGRL%21zSd@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
const migrationClient = postgres(directUrl, { max: 1, ssl: { rejectUnauthorized: false } });
const db = drizzle(migrationClient);

const rpcSQL = sql`
-- Stored procedure to perform transaction-safe checkout of sales
CREATE OR REPLACE FUNCTION create_sale_transaction(
  p_customer_name text,
  p_customer_phone text,
  p_subtotal numeric,
  p_discount numeric,
  p_total numeric,
  p_payment_method text,
  p_sale_items jsonb -- Array of objects: { product_id, quantity, unit_price, subtotal }
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id uuid;
  v_item record;
  v_current_stock integer;
BEGIN
  -- 1. Insert the sale record
  INSERT INTO sales (
    customer_name, customer_phone, subtotal, discount, total, payment_method, status
  ) VALUES (
    p_customer_name, p_customer_phone, p_subtotal, p_discount, p_total, p_payment_method, 'COMPLETED'
  ) RETURNING id INTO v_sale_id;

  -- 2. Process each sale item
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_sale_items) AS x(product_id uuid, quantity integer, unit_price numeric, subtotal numeric)
  LOOP
    -- Check stock
    SELECT quantity INTO v_current_stock FROM inventory WHERE product_id = v_item.product_id FOR UPDATE;
    
    IF v_current_stock IS NULL OR v_current_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item.product_id;
    END IF;

    -- Insert sale item
    INSERT INTO sale_items (
      sale_id, product_id, quantity, unit_price, subtotal
    ) VALUES (
      v_sale_id, v_item.product_id, v_item.quantity, v_item.unit_price, v_item.subtotal
    );

    -- Update inventory
    UPDATE inventory 
    SET quantity = quantity - v_item.quantity, 
        updated_at = NOW()
    WHERE product_id = v_item.product_id;

    -- Record stock movement
    INSERT INTO stock_movements (
      product_id, type, quantity, reason
    ) VALUES (
      v_item.product_id, 'OUT', v_item.quantity, 'Sale ' || v_sale_id
    );
  END LOOP;

  RETURN v_sale_id;
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
