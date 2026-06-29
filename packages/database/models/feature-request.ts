import { index, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import {
  buildDecisionEnum,
  clarificationRoleEnum,
  featureRequestSourceEnum,
  featureRequestStatusEnum,
  priorityEnum,
} from "./enums";
import { timestamps } from "./helpers";
import { organizationsTable } from "./organization";
import { projectsTable } from "./project";
import { repositoriesTable } from "./repository";
import { usersTable } from "./user";

/**
 * The entry point of the workflow. A customer/product-owner request captured
 * from any channel. `buildDecision` records the triage outcome (build it, it
 * already exists, or reject) and `status` tracks its position in the loop.
 */
export const featureRequestsTable = pgTable(
  "feature_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
    /** The single repository this request targets — the AI's code context. */
    repositoryId: uuid("repository_id").references(() => repositoriesTable.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    source: featureRequestSourceEnum("source").notNull().default("manual"),
    status: featureRequestStatusEnum("status").notNull().default("intake"),
    priority: priorityEnum("priority").notNull().default("medium"),
    buildDecision: buildDecisionEnum("build_decision").notNull().default("pending"),
    /** Why the AI/triage reached its build decision (e.g. "already covered by X"). */
    buildDecisionRationale: text("build_decision_rationale"),
    requesterName: varchar("requester_name", { length: 120 }),
    requesterEmail: varchar("requester_email", { length: 255 }),
    /** ID in the originating system (support ticket, CRM, etc.). */
    externalReference: varchar("external_reference", { length: 255 }),
    createdByUserId: uuid("created_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    assignedToUserId: uuid("assigned_to_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [
    index("feature_requests_org_idx").on(t.organizationId),
    index("feature_requests_project_idx").on(t.projectId),
    index("feature_requests_status_idx").on(t.status),
  ],
);

/**
 * The requirement-clarification conversation. The AI agent asks follow-up
 * questions to gather missing context; the user answers. Ordered by createdAt.
 */
export const clarificationMessagesTable = pgTable(
  "clarification_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    featureRequestId: uuid("feature_request_id")
      .notNull()
      .references(() => featureRequestsTable.id, { onDelete: "cascade" }),
    role: clarificationRoleEnum("role").notNull(),
    content: text("content").notNull(),
    ...timestamps,
  },
  (t) => [index("clarification_messages_feature_request_idx").on(t.featureRequestId)],
);

export type SelectFeatureRequest = typeof featureRequestsTable.$inferSelect;
export type InsertFeatureRequest = typeof featureRequestsTable.$inferInsert;
export type SelectClarificationMessage = typeof clarificationMessagesTable.$inferSelect;
export type InsertClarificationMessage = typeof clarificationMessagesTable.$inferInsert;
