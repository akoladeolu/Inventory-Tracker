import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description").default(""),
  requires_serial_tracking: boolean("requires_serial_tracking").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
