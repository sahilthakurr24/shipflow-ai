import { index, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { memberRoleEnum } from "./enums";
import { timestamps } from "./helpers";
import { usersTable } from "./user";

/**
 * An organization is the top-level tenant. Every domain row (project,
 * repository, feature request, billing, …) is scoped to exactly one org.
 */
export const organizationsTable = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    logoUrl: text("logo_url"),
    ...timestamps,
  },
  (t) => [uniqueIndex("organizations_slug_unique").on(t.slug)],
);

/**
 * Join table between users and organizations carrying the member's role.
 * A user may belong to many organizations.
 */
export const membershipsTable = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("member"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("memberships_org_user_unique").on(t.organizationId, t.userId),
    index("memberships_user_idx").on(t.userId),
  ],
);

export type SelectOrganization = typeof organizationsTable.$inferSelect;
export type InsertOrganization = typeof organizationsTable.$inferInsert;
export type SelectMembership = typeof membershipsTable.$inferSelect;
export type InsertMembership = typeof membershipsTable.$inferInsert;
