import { pgTable, uuid, varchar, decimal, boolean, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";

export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discount_type: discountTypeEnum("discount_type").notNull().default("percentage"),
  discount_value: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  min_purchase_amount: decimal("min_purchase_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  max_discount_amount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  active: boolean("active").default(true).notNull(),
  start_date: timestamp("start_date").defaultNow().notNull(),
  end_date: timestamp("end_date"),
  usage_limit: integer("usage_limit"),
  usage_count: integer("usage_count").default(0).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
