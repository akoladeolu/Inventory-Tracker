import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { products, productStatusEnum } from "./products";

export const product_variants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    product_id: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    barcode: varchar("barcode", { length: 100 }).unique(),
    attribute_1_name: varchar("attribute_1_name", { length: 100 }),
    attribute_1_value: varchar("attribute_1_value", { length: 100 }),
    attribute_2_name: varchar("attribute_2_name", { length: 100 }),
    attribute_2_value: varchar("attribute_2_value", { length: 100 }),
    cost_price: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
    selling_price: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull().default(0),
    low_stock_threshold: integer("low_stock_threshold").notNull().default(5),
    image_url: text("image_url"),
    status: productStatusEnum("status").notNull().default("active"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("product_variants_product_idx").on(table.product_id),
    index("product_variants_sku_idx").on(table.sku),
    index("product_variants_barcode_idx").on(table.barcode),
  ]
);
