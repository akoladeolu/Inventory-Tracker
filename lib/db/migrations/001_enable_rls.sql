-- Enable Row Level Security on all tables
-- Run this in Supabase Dashboard > SQL Editor

-- 1. USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users
  FOR SELECT USING (auth.uid() = auth_id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update" ON users
  FOR UPDATE USING (auth.uid() = auth_id OR auth.role() = 'authenticated');

-- 2. CATEGORIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_all" ON categories;
CREATE POLICY "categories_all" ON categories
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 3. PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_all" ON products;
CREATE POLICY "products_all" ON products
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. SUPPLIERS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suppliers_all" ON suppliers;
CREATE POLICY "suppliers_all" ON suppliers
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5. INVENTORY
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_all" ON inventory;
CREATE POLICY "inventory_all" ON inventory
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 6. STOCK_MOVEMENTS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_movements_all" ON stock_movements;
CREATE POLICY "stock_movements_all" ON stock_movements
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 7. SALES
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_all" ON sales;
CREATE POLICY "sales_all" ON sales
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 8. SALE_ITEMS
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sale_items_all" ON sale_items;
CREATE POLICY "sale_items_all" ON sale_items
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 9. CUSTOMERS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_all" ON customers;
CREATE POLICY "customers_all" ON customers
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
