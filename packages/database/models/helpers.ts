import { timestamp } from "drizzle-orm/pg-core";

/**
 * Standard audit columns shared by every table.
 *
 * Spread into a table definition: `pgTable("x", { ...columns, ...timestamps })`.
 * `updatedAt` is refreshed in the application layer via `$onUpdate`.
 */
export const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};
