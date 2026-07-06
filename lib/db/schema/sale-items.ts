import {
  pgTable,
  uuid,
  integer,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sales } from "./sales";
import { products } from "./products";

export const sale_items = pgTable(
  "sale_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sale_id: uuid("sale_id")
      .references(() => sales.id)
      .notNull(),
    product_id: uuid("product_id")
      .references(() => products.id)
      .notNull(),
    quantity: integer("quantity").notNull(),
    unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sale_items_sale_idx").on(table.sale_id),
    index("sale_items_product_idx").on(table.product_id),
  ]
);
