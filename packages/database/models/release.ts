import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { releaseStatusEnum } from "./enums";
import { approvalsTable } from "./approval";
import { featureRequestsTable } from "./feature-request";
import { timestamps } from "./helpers";
import { organizationsTable } from "./organization";
import { pullRequestsTable } from "./pull-request";
import { usersTable } from "./user";

/**
 * The shipped outcome of an approved feature. Created only after a human
 * approval; `status` flips to `shipped` when the feature goes live.
 */
export const releasesTable = pgTable(
  "releases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    featureRequestId: uuid("feature_request_id")
      .notNull()
      .references(() => featureRequestsTable.id, { onDelete: "cascade" }),
    pullRequestId: uuid("pull_request_id").references(() => pullRequestsTable.id, {
      onDelete: "set null",
    }),
    approvalId: uuid("approval_id").references(() => approvalsTable.id, { onDelete: "set null" }),
    status: releaseStatusEnum("status").notNull().default("pending"),
    version: varchar("version", { length: 50 }),
    releaseNotes: text("release_notes"),
    shippedByUserId: uuid("shipped_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    shippedAt: timestamp("shipped_at"),
    ...timestamps,
  },
  (t) => [
    index("releases_org_idx").on(t.organizationId),
    index("releases_feature_request_idx").on(t.featureRequestId),
  ],
);

export type SelectRelease = typeof releasesTable.$inferSelect;
export type InsertRelease = typeof releasesTable.$inferInsert;
