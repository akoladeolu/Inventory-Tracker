import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { products } from "./products";
import { product_variants } from "./product-variants";
import { sales } from "./sales";

export const serial_numbers = pgTable(
  "serial_numbers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    product_id: uuid("product_id")
      .references(() => products.id)
      .notNull(),
    variant_id: uuid("variant_id").references(() => product_variants.id),
    serial_number: varchar("serial_number", { length: 100 }).notNull().unique(),
    status: varchar("status", { length: 20 }).notNull().default("in_stock"),
    sale_id: uuid("sale_id").references(() => sales.id),
    customer_name: varchar("customer_name", { length: 255 }),
    warranty_expiry: timestamp("warranty_expiry"),
    notes: text("notes").default(""),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("serial_numbers_product_idx").on(table.product_id),
    index("serial_numbers_variant_idx").on(table.variant_id),
    index("serial_numbers_serial_idx").on(table.serial_number),
    index("serial_numbers_status_idx").on(table.status),
  ]
);
