import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { products } from "./products";

export const stock_audits = pgTable(
  "stock_audits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    audit_number: varchar("audit_number", { length: 50 }).notNull().unique(),
    scope: varchar("scope", { length: 50 }).notNull(),
    scope_filter: jsonb("scope_filter"),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    started_by: uuid("started_by")
      .references(() => users.id)
      .notNull(),
    reviewed_by: uuid("reviewed_by").references(() => users.id),
    total_expected: integer("total_expected").default(0).notNull(),
    total_counted: integer("total_counted").default(0).notNull(),
    total_variance: integer("total_variance").default(0).notNull(),
    variance_value: decimal("variance_value", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    notes: text("notes"),
    started_at: timestamp("started_at").defaultNow().notNull(),
    completed_at: timestamp("completed_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("stock_audits_status_idx").on(table.status),
    index("stock_audits_started_by_idx").on(table.started_by),
  ]
);

export const stock_audit_items = pgTable(
  "stock_audit_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    audit_id: uuid("audit_id")
      .references(() => stock_audits.id)
      .notNull(),
    product_id: uuid("product_id")
      .references(() => products.id)
      .notNull(),
    expected_quantity: integer("expected_quantity").notNull(),
    counted_quantity: integer("counted_quantity"),
    variance: integer("variance"),
    variance_reason: varchar("variance_reason", { length: 50 }),
    variance_notes: text("variance_notes"),
    scanned_at: timestamp("scanned_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("stock_audit_items_audit_id_idx").on(table.audit_id),
    index("stock_audit_items_product_id_idx").on(table.product_id),
    uniqueIndex("stock_audit_items_audit_product_idx").on(
      table.audit_id,
      table.product_id
    ),
  ]
);
