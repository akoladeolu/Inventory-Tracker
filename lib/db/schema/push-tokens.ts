import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const push_tokens = pgTable(
  "push_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    expo_push_token: varchar("expo_push_token", { length: 255 }).notNull(),
    device_name: varchar("device_name", { length: 100 }),
    platform: varchar("platform", { length: 20 }),
    active: boolean("active").default(true).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("push_tokens_user_token_idx").on(
      table.user_id,
      table.expo_push_token
    ),
  ]
);
