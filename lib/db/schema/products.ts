import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  pgEnum,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { brands } from "./brands";

export const productStatusEnum = pgEnum("product_status", [
  "active",
  "archived",
]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    category_id: uuid("category_id")
      .references(() => categories.id)
      .notNull(),
    brand_id: uuid("brand_id").references(() => brands.id),
    barcode: varchar("barcode", { length: 100 }).unique(),
    cost_price: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
    selling_price: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull().default(0),
    low_stock_threshold: integer("low_stock_threshold").notNull().default(10),
    image_url: text("image_url"),
    description: text("description").default(""),
    status: productStatusEnum("status").notNull().default("active"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("products_category_idx").on(table.category_id),
    index("products_status_idx").on(table.status),
    index("products_sku_idx").on(table.sku),
    index("products_brand_idx").on(table.brand_id),
    index("products_barcode_idx").on(table.barcode),
  ]
);
