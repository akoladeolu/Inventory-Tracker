import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 50 }).notNull().default("system"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  is_read: boolean("is_read").default(false).notNull(),
  user_id: uuid("user_id").references(() => users.id),
  channel: varchar("channel", { length: 20 }).default("in_app"),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
