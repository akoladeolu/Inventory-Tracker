import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  pgEnum,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { coupons } from "./coupons";

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "transfer",
  "mobile",
]);

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoice_number: varchar("invoice_number", { length: 50 }).notNull().unique(),
    customer_name: varchar("customer_name", { length: 255 }).default(""),
    customer_phone: varchar("customer_phone", { length: 50 }).default(""),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    payment_method: paymentMethodEnum("payment_method").notNull().default("cash"),
    coupon_id: uuid("coupon_id").references(() => coupons.id),
    receipt_token: varchar("receipt_token", { length: 64 }).unique(),
    receipt_url: text("receipt_url"),
    user_id: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sales_user_idx").on(table.user_id),
    index("sales_created_at_idx").on(table.created_at),
    index("sales_coupon_idx").on(table.coupon_id),
  ]
);
