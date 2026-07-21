-- Stored procedure to perform transaction-safe checkout of sales
CREATE OR REPLACE FUNCTION create_sale_transaction(
  p_customer_name text,
  p_customer_phone text,
  p_subtotal numeric,
  p_discount numeric,
  p_total numeric,
  p_payment_method payment_method,
  p_user_id uuid,
  p_coupon_id uuid,
  p_items jsonb
) RETURNS jsonb AS $$
DECLARE
  v_sale_id uuid;
  v_invoice_number text;
  v_item record;
  v_prev_qty integer;
  v_new_qty integer;
  v_threshold integer;
  v_prod_name text;
  v_prod_sku text;
BEGIN
  -- Generate invoice number
  v_invoice_number := 'INV-' || (extract(epoch from now()) * 1000)::bigint::text;

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
    COALESCE(p_customer_name, ''),
    COALESCE(p_customer_phone, ''),
    p_subtotal,
    p_discount,
    p_total,
    p_payment_method,
    p_user_id,
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
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id uuid, quantity integer, unit_price numeric, total numeric) LOOP
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
      v_item.total
    );

    -- Get current product quantity, name, sku, and threshold
    SELECT quantity, name, sku, low_stock_threshold INTO v_prev_qty, v_prod_name, v_prod_sku, v_threshold
    FROM products
    WHERE id = v_item.product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_item.product_id;
    END IF;

    v_new_qty := v_prev_qty - v_item.quantity;

    IF v_new_qty < 0 THEN
      RAISE EXCEPTION 'Insufficient stock for product "%" (%)', v_prod_name, v_prod_sku;
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
      p_user_id,
      'Sale ' || v_invoice_number
    );
  END LOOP;

  -- Return sale info
  RETURN json_build_object(
    'id', v_sale_id,
    'invoice_number', v_invoice_number,
    'total', p_total
  );
END;
$$ LANGUAGE plpgsql;
