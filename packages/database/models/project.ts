import { boolean, index, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "./helpers";
import { organizationsTable } from "./organization";
import { usersTable } from "./user";

/**
 * A project groups feature work and repositories within an organization
 * (e.g. "Web App", "Mobile", "Billing service"). `key` is a short human
 * handle unique within the org, used for display and task prefixes.
 */
export const projectsTable = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    key: varchar("key", { length: 16 }).notNull(),
    description: text("description"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdByUserId: uuid("created_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("projects_org_key_unique").on(t.organizationId, t.key),
    index("projects_org_idx").on(t.organizationId),
  ],
);

export type SelectProject = typeof projectsTable.$inferSelect;
export type InsertProject = typeof projectsTable.$inferInsert;
