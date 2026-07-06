import {
  pgTable,
  uuid,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { products } from "./products";

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    product_id: uuid("product_id")
      .references(() => products.id)
      .notNull()
      .unique(),
    quantity: integer("quantity").notNull().default(0),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("inventory_product_idx").on(table.product_id)]
);
