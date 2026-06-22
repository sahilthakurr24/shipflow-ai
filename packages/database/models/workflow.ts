import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { workflowStatusEnum, workflowTypeEnum } from "./enums";
import { featureRequestsTable } from "./feature-request";
import { timestamps } from "./helpers";
import { organizationsTable } from "./organization";

/**
 * Tracks long-running Inngest workflows (PRD generation, repo analysis, AI
 * reviews, …) so progress is visible inside the application. `inngestRunId`
 * links back to the Inngest dashboard; `progress` is a 0-100 percentage.
 */
export const workflowRunsTable = pgTable(
  "workflow_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    featureRequestId: uuid("feature_request_id").references(() => featureRequestsTable.id, {
      onDelete: "set null",
    }),
    type: workflowTypeEnum("type").notNull(),
    status: workflowStatusEnum("status").notNull().default("pending"),
    inngestEventId: varchar("inngest_event_id", { length: 120 }),
    inngestRunId: varchar("inngest_run_id", { length: 120 }),
    currentStep: varchar("current_step", { length: 120 }),
    progress: integer("progress").notNull().default(0),
    totalSteps: integer("total_steps"),
    input: jsonb("input").$type<Record<string, unknown>>(),
    output: jsonb("output").$type<Record<string, unknown>>(),
    error: text("error"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    ...timestamps,
  },
  (t) => [
    index("workflow_runs_org_idx").on(t.organizationId),
    index("workflow_runs_feature_request_idx").on(t.featureRequestId),
    index("workflow_runs_status_idx").on(t.status),
  ],
);

export type SelectWorkflowRun = typeof workflowRunsTable.$inferSelect;
export type InsertWorkflowRun = typeof workflowRunsTable.$inferInsert;
