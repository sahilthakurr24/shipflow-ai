import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { approvalDecisionEnum } from "./enums";
import { featureRequestsTable } from "./feature-request";
import { timestamps } from "./helpers";
import { organizationsTable } from "./organization";
import { reviewsTable } from "./review";
import { usersTable } from "./user";

/**
 * A human reviewer's decision on a feature after the AI review loop. Humans
 * remain the final decision makers — only an `approved` record lets a feature
 * proceed to release. Each decision is recorded for the audit trail.
 */
export const approvalsTable = pgTable(
  "approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    featureRequestId: uuid("feature_request_id")
      .notNull()
      .references(() => featureRequestsTable.id, { onDelete: "cascade" }),
    /** The AI review the human signed off against, if any. */
    reviewId: uuid("review_id").references(() => reviewsTable.id, { onDelete: "set null" }),
    reviewerUserId: uuid("reviewer_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    decision: approvalDecisionEnum("decision").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("approvals_org_idx").on(t.organizationId),
    index("approvals_feature_request_idx").on(t.featureRequestId),
  ],
);

export type SelectApproval = typeof approvalsTable.$inferSelect;
export type InsertApproval = typeof approvalsTable.$inferInsert;
