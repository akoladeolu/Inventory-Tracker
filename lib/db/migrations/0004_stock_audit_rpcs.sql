-- Drop previous versions
DROP FUNCTION IF EXISTS start_stock_audit(text, jsonb, uuid, text);
DROP FUNCTION IF EXISTS complete_stock_audit(uuid, uuid);

-- Start a new stock audit
CREATE OR REPLACE FUNCTION start_stock_audit(
  p_scope text DEFAULT 'full',
  p_scope_filter jsonb DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_notes text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_audit_id uuid;
  v_audit_number text;
  v_effective_user_id uuid;
BEGIN
  v_effective_user_id := p_user_id;
  IF v_effective_user_id IS NULL THEN
    SELECT id INTO v_effective_user_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
  END IF;
  IF v_effective_user_id IS NULL THEN
    SELECT id INTO v_effective_user_id FROM users ORDER BY created_at ASC LIMIT 1;
  END IF;

  v_audit_number := 'AUD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((floor(random() * 8999 + 1000))::text, 4, '0');

  INSERT INTO stock_audits (audit_number, scope, scope_filter, status, started_by, notes, started_at)
  VALUES (v_audit_number, p_scope, p_scope_filter, 'in_progress', v_effective_user_id, p_notes, now())
  RETURNING id INTO v_audit_id;

  -- Populate audit items based on scope
  IF p_scope = 'category' AND p_scope_filter IS NOT NULL THEN
    INSERT INTO stock_audit_items (audit_id, product_id, expected_quantity)
    SELECT v_audit_id, id, quantity
    FROM products
    WHERE status = 'active' AND category_id = (p_scope_filter->>'category_id')::uuid;
  ELSIF p_scope = 'brand' AND p_scope_filter IS NOT NULL THEN
    INSERT INTO stock_audit_items (audit_id, product_id, expected_quantity)
    SELECT v_audit_id, id, quantity
    FROM products
    WHERE status = 'active' AND brand_id = (p_scope_filter->>'brand_id')::uuid;
  ELSE
    INSERT INTO stock_audit_items (audit_id, product_id, expected_quantity)
    SELECT v_audit_id, id, quantity
    FROM products
    WHERE status = 'active';
  END IF;

  UPDATE stock_audits
  SET total_expected = (SELECT COALESCE(SUM(expected_quantity), 0) FROM stock_audit_items WHERE audit_id = v_audit_id)
  WHERE id = v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- Complete and apply audit adjustments
CREATE OR REPLACE FUNCTION complete_stock_audit(
  p_audit_id uuid,
  p_reviewer_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_effective_user_id uuid;
  v_audit_number text;
  v_audit_status text;
  v_item record;
  v_current_qty integer;
  v_adjustment integer;
BEGIN
  v_effective_user_id := p_reviewer_id;
  IF v_effective_user_id IS NULL THEN
    SELECT id INTO v_effective_user_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
  END IF;
  IF v_effective_user_id IS NULL THEN
    SELECT id INTO v_effective_user_id FROM users ORDER BY created_at ASC LIMIT 1;
  END IF;

  SELECT audit_number, status INTO v_audit_number, v_audit_status
  FROM stock_audits WHERE id = p_audit_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Audit not found';
  END IF;

  IF v_audit_status != 'pending_review' THEN
    RAISE EXCEPTION 'Audit must be in pending_review status to complete. Current status: %', v_audit_status;
  END IF;

  FOR v_item IN
    SELECT sai.*, p.selling_price
    FROM stock_audit_items sai
    JOIN products p ON p.id = sai.product_id
    WHERE sai.audit_id = p_audit_id
      AND sai.counted_quantity IS NOT NULL
      AND sai.variance IS NOT NULL
      AND sai.variance != 0
  LOOP
    SELECT quantity INTO v_current_qty FROM products WHERE id = v_item.product_id;
    v_adjustment := v_item.counted_quantity - v_current_qty;

    UPDATE products
    SET quantity = v_item.counted_quantity, updated_at = now()
    WHERE id = v_item.product_id;

    INSERT INTO stock_movements (product_id, type, quantity, previous_quantity, new_quantity, user_id, notes)
    VALUES (
      v_item.product_id,
      'audit_adjustment',
      abs(v_adjustment),
      v_current_qty,
      v_item.counted_quantity,
      v_effective_user_id,
      'Audit ' || v_audit_number || ': ' || COALESCE(v_item.variance_reason, 'adjustment')
    );

    INSERT INTO inventory (product_id, quantity, updated_at)
    VALUES (v_item.product_id, v_item.counted_quantity, now())
    ON CONFLICT (product_id) DO UPDATE SET quantity = v_item.counted_quantity, updated_at = now();
  END LOOP;

  UPDATE stock_audits
  SET
    status = 'completed',
    reviewed_by = v_effective_user_id,
    completed_at = now(),
    total_counted = (SELECT COALESCE(SUM(COALESCE(counted_quantity, expected_quantity)), 0) FROM stock_audit_items WHERE audit_id = p_audit_id),
    total_variance = (SELECT COALESCE(SUM(COALESCE(variance, 0)), 0) FROM stock_audit_items WHERE audit_id = p_audit_id),
    variance_value = (
      SELECT COALESCE(SUM(COALESCE(sai.variance, 0) * p.selling_price), 0)
      FROM stock_audit_items sai
      JOIN products p ON p.id = sai.product_id
      WHERE sai.audit_id = p_audit_id
    )
  WHERE id = p_audit_id;

  RETURN v_audit_number;
END;
$$;
