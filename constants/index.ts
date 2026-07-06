export const APP_NAME = "TEEKEH Inventory Tracker";

export const DEFAULT_CATEGORIES = [
  "Watches",
  "Bags",
  "Glasses",
  "Wallets",
  "Belts",
  "Shoes",
  "Accessories",
] as const;

export const PRODUCT_STATUSES = ["active", "archived"] as const;

export const STOCK_MOVEMENT_TYPES = [
  "stock_in",
  "stock_out",
  "adjustment",
  "sale",
  "return",
] as const;

export const PAYMENT_METHODS = ["cash", "card", "transfer", "mobile"] as const;

export const USER_ROLES = ["owner", "manager", "staff"] as const;

export const ITEMS_PER_PAGE = 20;

export const BRAND_COLORS = {
  gold: "#C8A348",
  goldHover: "#B8933A",
  charcoal: "#1E1E1E",
  softBlack: "#2D2D2D",
  deepRed: "#A52A2A",
  background: "#F8F9FA",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#DC2626",
  info: "#2563EB",
} as const;
