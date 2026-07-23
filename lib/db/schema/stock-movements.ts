import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  pgEnum,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { products } from "./products";
import { users } from "./users";

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "stock_in",
  "stock_out",
  "adjustment",
  "sale",
  "return",
  "audit_adjustment",
]);

export const stock_movements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    product_id: uuid("product_id")
      .references(() => products.id)
      .notNull(),
    type: stockMovementTypeEnum("type").notNull(),
    quantity: integer("quantity").notNull(),
    previous_quantity: integer("previous_quantity").notNull(),
    new_quantity: integer("new_quantity").notNull(),
    user_id: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    notes: text("notes").default(""),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("stock_movements_product_idx").on(table.product_id),
    index("stock_movements_user_idx").on(table.user_id),
    index("stock_movements_created_at_idx").on(table.created_at),
  ]
);
