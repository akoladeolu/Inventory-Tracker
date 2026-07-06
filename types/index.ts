export type UserRole = "owner" | "manager" | "staff";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  brand: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
  description: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  quantity: number;
  updated_at: string;
}

export type StockMovementType = "stock_in" | "stock_out" | "adjustment" | "sale" | "return";

export interface StockMovement {
  id: string;
  product_id: string;
  type: StockMovementType;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  user_id: string;
  notes: string;
  created_at: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: "cash" | "card" | "transfer" | "mobile";
  user_id: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalInventory: number;
  lowStockCount: number;
  outOfStockCount: number;
  inventoryValue: number;
}

export interface SalesReport {
  date: string;
  totalSales: number;
  orderCount: number;
  revenue: number;
}
