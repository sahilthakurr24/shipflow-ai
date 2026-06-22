import { boolean, index, integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { priorityEnum, taskStatusEnum, taskTypeEnum } from "./enums";
import { featureRequestsTable } from "./feature-request";
import { timestamps } from "./helpers";
import { organizationsTable } from "./organization";
import { prdsTable } from "./prd";
import { projectsTable } from "./project";
import { usersTable } from "./user";

/**
 * An engineering task derived from a PRD and tracked on a Kanban board.
 * `boardPosition` orders cards within a `status` column. `createdByAgent`
 * distinguishes AI-generated tasks from human-authored ones.
 */
export const tasksTable = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    featureRequestId: uuid("feature_request_id")
      .notNull()
      .references(() => featureRequestsTable.id, { onDelete: "cascade" }),
    prdId: uuid("prd_id").references(() => prdsTable.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    type: taskTypeEnum("type").notNull().default("feature"),
    status: taskStatusEnum("status").notNull().default("backlog"),
    priority: priorityEnum("priority").notNull().default("medium"),
    boardPosition: integer("board_position").notNull().default(0),
    estimatePoints: integer("estimate_points"),
    assignedToUserId: uuid("assigned_to_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    createdByAgent: boolean("created_by_agent").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("tasks_org_idx").on(t.organizationId),
    index("tasks_feature_request_idx").on(t.featureRequestId),
    index("tasks_status_idx").on(t.status),
  ],
);

export type SelectTask = typeof tasksTable.$inferSelect;
export type InsertTask = typeof tasksTable.$inferInsert;
