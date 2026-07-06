-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Users: read own profile, owners/managers read all
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Owners can read all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Owners can update users" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

-- Categories: all authenticated users can read, owners/managers can write
CREATE POLICY "Authenticated users can read categories" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owners and managers can insert categories" ON categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('owner', 'manager'))
  );

CREATE POLICY "Owners and managers can update categories" ON categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('owner', 'manager'))
  );

CREATE POLICY "Owners and managers can delete categories" ON categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('owner', 'manager'))
  );

-- Products: all authenticated users can read, owners/managers can write
CREATE POLICY "Authenticated users can read products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owners and managers can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('owner', 'manager'))
  );

CREATE POLICY "Owners and managers can update products" ON products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('owner', 'manager'))
  );

CREATE POLICY "Owners can delete products" ON products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

-- Suppliers: all authenticated users can read, owners/managers can write
CREATE POLICY "Authenticated users can read suppliers" ON suppliers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owners and managers can insert suppliers" ON suppliers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('owner', 'manager'))
  );

CREATE POLICY "Owners and managers can update suppliers" ON suppliers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('owner', 'manager'))
  );

CREATE POLICY "Owners and managers can delete suppliers" ON suppliers
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('owner', 'manager'))
  );

-- Inventory: all authenticated users can read, owners/managers can write
CREATE POLICY "Authenticated users can read inventory" ON inventory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owners and managers can insert inventory" ON inventory
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('owner', 'manager'))
  );

CREATE POLICY "Owners and managers can update inventory" ON inventory
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('owner', 'manager'))
  );

-- Stock Movements: all authenticated users can read, all can insert
CREATE POLICY "Authenticated users can read stock movements" ON stock_movements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert stock movements" ON stock_movements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Sales: all authenticated users can read and insert
CREATE POLICY "Authenticated users can read sales" ON sales
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sales" ON sales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Sale Items: all authenticated users can read and insert
CREATE POLICY "Authenticated users can read sale items" ON sale_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sale items" ON sale_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Customers: all authenticated users can read and insert
CREATE POLICY "Authenticated users can read customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert customers" ON customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
